/**
 * Custom hook for hands-free voice command recognition using browser SpeechRecognition / webkitSpeechRecognition.
 * Allows hands-free emergency SOS activation when a patient cannot physically interact with the screen.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type definitions for cross-browser support
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Emergency trigger phrases and synonyms
export const TRIGGER_PHRASES = [
  'emergency',
  'help',
  'help me',
  'call ambulance',
  'send help',
  'medical emergency',
  'trigger sos',
  'ambulance',
  'i need help',
  'call 911',
  'call 112',
  'mayday'
];

interface UseVoiceSOSProps {
  onTriggerSOS: (commandMatch: string) => void;
  autoStart?: boolean;
}

export function useVoiceSOS({ onTriggerSOS, autoStart = false }: UseVoiceSOSProps) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [lastDetectedPhrase, setLastDetectedPhrase] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldListenRef = useRef<boolean>(false);
  const onTriggerRef = useRef(onTriggerSOS);
  onTriggerRef.current = onTriggerSOS;

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setIsSupported(true);
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsListening(true);
          setPermissionError(null);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setPermissionError('Microphone permission denied. Enable microphone access to use voice SOS.');
            shouldListenRef.current = false;
            setIsListening(false);
          } else if (event.error === 'no-speech') {
            // normal silence timeout; loop continues
          } else {
            console.warn('SpeechRecognition warning/error:', event.error);
          }
        };

        recognition.onend = () => {
          // If the user intended to keep listening, auto-restart (SpeechRecognition periodically times out)
          if (shouldListenRef.current) {
            try {
              recognition.start();
            } catch {
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript.toLowerCase();
          }
          setTranscript(currentTranscript);

          // Check if any emergency trigger phrase is included
          for (const phrase of TRIGGER_PHRASES) {
            if (currentTranscript.includes(phrase)) {
              setLastDetectedPhrase(phrase);
              onTriggerRef.current(phrase);
              break;
            }
          }
        };

        recognitionRef.current = recognition;

        if (autoStart) {
          shouldListenRef.current = true;
          try {
            recognition.start();
          } catch {
            // ignore initial start error
          }
        }
      } catch (err) {
        console.error('Failed to initialize SpeechRecognition:', err);
      }
    } else {
      setIsSupported(false);
    }

    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [autoStart]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setPermissionError(null);
    shouldListenRef.current = true;
    try {
      recognitionRef.current.start();
    } catch {
      // might already be started
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isSupported,
    isListening,
    transcript,
    lastDetectedPhrase,
    permissionError,
    startListening,
    stopListening,
    toggleListening,
  };
}
