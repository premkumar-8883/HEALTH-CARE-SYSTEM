/**
 * VoiceAssistant: Web Speech API voice recognition service.
 * Continuously listens for emergency trigger phrases like "Emergency" or "Help",
 * invoking the emergency dispatch even when the user is away from the screen
 * or the device screen might otherwise idle or lock.
 */

import { emergencyAudio } from './audio';

// Speech Recognition typings for cross-browser support (WebKit / Chrome / Edge / Safari)
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

export type TriggerPhrase = string;

export interface VoiceAssistantListener {
  onStatusChange?: (isListening: boolean) => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onTriggerDetected?: (phrase: string, confidence: number) => void;
  onError?: (errorMessage: string) => void;
  onWakeLockChange?: (hasWakeLock: boolean) => void;
}

export const DEFAULT_TRIGGER_PHRASES: string[] = [
  'emergency',
  'help',
  'help me',
  'call ambulance',
  'send help',
  'medical emergency',
  'trigger sos',
  'i need help',
  'call 911',
  'call 112',
  'heart attack',
  'ambulance now',
  'mayday'
];

export class VoiceAssistant {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListeningActive: boolean = false;
  private shouldBeListening: boolean = false;
  private wakeLockSentinel: any = null;
  private keepAliveAudioCtx: AudioContext | null = null;
  private keepAliveGain: GainNode | null = null;
  private restartTimeout: number | null = null;
  private lastTriggerTime: number = 0;
  private triggerCooldownMs: number = 6000; // 6s debounce between triggers
  private triggerCallback: ((phrase: string) => void) | null = null;
  private listeners: Set<VoiceAssistantListener> = new Set();
  private triggerPhrases: string[] = [...DEFAULT_TRIGGER_PHRASES];
  private lastTranscript: string = '';
  private isWakeLockSupported: boolean = false;
  private hasWakeLock: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isWakeLockSupported = 'wakeLock' in navigator;
      this.initRecognition();
      this.bindVisibilityWatcher();
    }
  }

  /**
   * Check whether Web Speech API is supported in the current browser.
   */
  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  public getHasWakeLock(): boolean {
    return this.hasWakeLock;
  }

  public getLastTranscript(): string {
    return this.lastTranscript;
  }

  public getTriggerPhrases(): string[] {
    return [...this.triggerPhrases];
  }

  /**
   * Sets the primary trigger handler invoked when an emergency phrase is recognized.
   */
  public onTrigger(callback: (phrase: string) => void) {
    this.triggerCallback = callback;
  }

  /**
   * Add a subscriber listener for status, transcripts, errors, and triggers.
   */
  public addListener(listener: VoiceAssistantListener): () => void {
    this.listeners.add(listener);
    // Notify current status immediately
    if (listener.onStatusChange) {
      listener.onStatusChange(this.isListeningActive);
    }
    if (listener.onWakeLockChange) {
      listener.onWakeLockChange(this.hasWakeLock);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyStatus(isListening: boolean) {
    this.listeners.forEach((l) => l.onStatusChange?.(isListening));
  }

  private notifyTranscript(transcript: string, isFinal: boolean) {
    this.listeners.forEach((l) => l.onTranscript?.(transcript, isFinal));
  }

  private notifyTrigger(phrase: string, confidence: number = 1.0) {
    this.listeners.forEach((l) => l.onTriggerDetected?.(phrase, confidence));
  }

  private notifyError(error: string) {
    this.listeners.forEach((l) => l.onError?.(error));
  }

  private notifyWakeLock(hasLock: boolean) {
    this.listeners.forEach((l) => l.onWakeLockChange?.(hasLock));
  }

  /**
   * Initialize speech recognition instance with high resilience.
   */
  private initRecognition() {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) return;

    try {
      this.recognition = new SpeechClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3;

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        this.notifyStatus(true);
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        this.notifyStatus(false);

        // Auto-restart loop if user still intends for VoiceAssistant to run
        if (this.shouldBeListening) {
          if (this.restartTimeout) clearTimeout(this.restartTimeout);
          this.restartTimeout = window.setTimeout(() => {
            if (this.shouldBeListening) {
              this.safeStart();
            }
          }, 350);
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // 'no-speech' is a normal periodic timeout when no one is talking
        if (event.error === 'no-speech') {
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.shouldBeListening = false;
          this.isListeningActive = false;
          this.notifyStatus(false);
          this.notifyError('Microphone permission was denied. Please allow microphone access for hands-free voice SOS.');
          return;
        }

        if (event.error === 'network') {
          this.notifyError('Voice recognition network timeout. Reconnecting...');
        }
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcriptPiece = result[0].transcript.toLowerCase().trim();
          if (result.isFinal) {
            finalTranscript += ' ' + transcriptPiece;
          } else {
            interimTranscript += ' ' + transcriptPiece;
          }
        }

        const combined = (finalTranscript || interimTranscript).trim();
        if (combined) {
          this.lastTranscript = combined;
          this.notifyTranscript(combined, Boolean(finalTranscript));
          this.evaluateDistressCommand(combined);
        }
      };
    } catch (err) {
      console.warn('[VoiceAssistant] Initialization error:', err);
    }
  }

  /**
   * Evaluates if heard speech matches any emergency distress keywords.
   */
  private evaluateDistressCommand(speech: string) {
    const cleaned = speech.toLowerCase();
    const now = Date.now();

    // Guard against rapid duplicate firing within cooldown window
    if (now - this.lastTriggerTime < this.triggerCooldownMs) {
      return;
    }

    for (const phrase of this.triggerPhrases) {
      // Regex check with word boundaries or substring inclusion
      const regex = new RegExp(`\\b${phrase}\\b`, 'i');
      if (regex.test(cleaned) || cleaned.includes(phrase)) {
        this.lastTriggerTime = now;
        this.notifyTrigger(phrase, 1.0);
        this.executeEmergencyTrigger(phrase);
        break;
      }
    }
  }

  /**
   * Executes the emergency trigger callback, voice synthesis announcement, and chimes.
   */
  private executeEmergencyTrigger(matchedPhrase: string) {
    // 1. Play auditory alarm chime immediately
    emergencyAudio.playDispatchChime();

    // 2. Announce speech feedback so someone in another room or with locked screen knows
    emergencyAudio.speakEmergencyAlert(
      `Voice distress command "${matchedPhrase}" detected. Initiating emergency response now.`
    );

    // 3. Invoke user callback
    if (this.triggerCallback) {
      this.triggerCallback(matchedPhrase);
    }
  }

  /**
   * Request Screen WakeLock to prevent the screen from sleeping or turning off
   * while the user is away from the device or hands are occupied.
   */
  private async acquireWakeLock() {
    if (!this.isWakeLockSupported) return;
    try {
      if ('wakeLock' in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.hasWakeLock = true;
        this.notifyWakeLock(true);

        this.wakeLockSentinel.addEventListener('release', () => {
          this.hasWakeLock = false;
          this.notifyWakeLock(false);
          // Re-acquire if assistant is still actively armed
          if (this.shouldBeListening && document.visibilityState === 'visible') {
            this.acquireWakeLock();
          }
        });
      }
    } catch (err) {
      console.warn('[VoiceAssistant] Could not acquire WakeLock:', err);
    }
  }

  private releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {
        // ignore
      }
      this.wakeLockSentinel = null;
      this.hasWakeLock = false;
      this.notifyWakeLock(false);
    }
  }

  /**
   * Creates an inaudible audio carrier to keep the browser media subsystem awake
   * even when screen dims or user is away from the screen.
   */
  private startBackgroundAudioKeepAlive() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.keepAliveAudioCtx) {
        this.keepAliveAudioCtx = new AudioCtx();
      }

      if (this.keepAliveAudioCtx.state === 'suspended') {
        this.keepAliveAudioCtx.resume();
      }

      // Inaudible periodic buffer or silent gain node
      if (!this.keepAliveGain) {
        const osc = this.keepAliveAudioCtx.createOscillator();
        this.keepAliveGain = this.keepAliveAudioCtx.createGain();
        this.keepAliveGain.gain.setValueAtTime(0.0001, this.keepAliveAudioCtx.currentTime); // Inaudible
        osc.frequency.setValueAtTime(440, this.keepAliveAudioCtx.currentTime);
        osc.connect(this.keepAliveGain);
        this.keepAliveGain.connect(this.keepAliveAudioCtx.destination);
        osc.start();
      }
    } catch (err) {
      // Audio keep alive fallback
    }
  }

  private stopBackgroundAudioKeepAlive() {
    if (this.keepAliveAudioCtx) {
      try {
        this.keepAliveAudioCtx.close();
      } catch {
        // ignore
      }
      this.keepAliveAudioCtx = null;
      this.keepAliveGain = null;
    }
  }

  /**
   * Watch page visibility changes so if user locks/unlocks or switches apps,
   * VoiceAssistant ensures listening is resumed.
   */
  private bindVisibilityWatcher() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.shouldBeListening) {
        this.acquireWakeLock();
        if (!this.isListeningActive) {
          this.safeStart();
        }
      }
    });
  }

  private safeStart() {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) return;

    try {
      this.recognition.start();
    } catch (e: any) {
      // If already started or pending, don't crash
      if (e?.name === 'InvalidStateError') {
        this.isListeningActive = true;
        this.notifyStatus(true);
      }
    }
  }

  /**
   * Start listening for emergency voice trigger commands.
   */
  public async start(): Promise<boolean> {
    if (!this.isSupported()) {
      this.notifyError('Web Speech API is not supported in this browser.');
      return false;
    }

    this.shouldBeListening = true;
    this.safeStart();
    await this.acquireWakeLock();
    this.startBackgroundAudioKeepAlive();

    return true;
  }

  /**
   * Stop listening for voice commands and release locks.
   */
  public stop() {
    this.shouldBeListening = false;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListeningActive = false;
    this.releaseWakeLock();
    this.stopBackgroundAudioKeepAlive();
    this.notifyStatus(false);
  }

  /**
   * Toggle listening state on / off.
   */
  public toggle(): Promise<boolean> | void {
    if (this.shouldBeListening || this.isListeningActive) {
      this.stop();
      return Promise.resolve(false);
    } else {
      return this.start();
    }
  }

  /**
   * Simulates speaking a voice trigger command (e.g. for accessibility testing or demo).
   */
  public simulateTrigger(phrase: string = 'Emergency') {
    this.notifyTranscript(phrase, true);
    this.executeEmergencyTrigger(phrase);
  }
}

// Export singleton instance for app-wide use
export const voiceAssistant = new VoiceAssistant();
