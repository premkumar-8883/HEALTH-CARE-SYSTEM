import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  ShieldAlert, 
  Radio, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  Info,
  Sparkles,
  Play
} from 'lucide-react';
import { voiceAssistant, DEFAULT_TRIGGER_PHRASES } from '../utils/VoiceAssistant';

interface VoiceAssistantPanelProps {
  onTriggerSOS: (command: string) => void;
  compact?: boolean;
}

export const VoiceAssistantPanel: React.FC<VoiceAssistantPanelProps> = ({
  onTriggerSOS,
  compact = false,
}) => {
  const [isListening, setIsListening] = useState<boolean>(voiceAssistant.isListening());
  const [hasWakeLock, setHasWakeLock] = useState<boolean>(voiceAssistant.getHasWakeLock());
  const [transcript, setTranscript] = useState<string>(voiceAssistant.getLastTranscript());
  const [lastTriggeredPhrase, setLastTriggeredPhrase] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  useEffect(() => {
    setIsSupported(voiceAssistant.isSupported());

    // Register primary trigger handler with VoiceAssistant
    voiceAssistant.onTrigger((phrase) => {
      setLastTriggeredPhrase(phrase);
      onTriggerSOS(phrase);
    });

    // Subscribe to events
    const unsubscribe = voiceAssistant.addListener({
      onStatusChange: (listening) => {
        setIsListening(listening);
        if (listening) {
          setErrorMessage(null);
        }
      },
      onTranscript: (heardText) => {
        setTranscript(heardText);
      },
      onTriggerDetected: (phrase) => {
        setLastTriggeredPhrase(phrase);
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onWakeLockChange: (locked) => {
        setHasWakeLock(locked);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [onTriggerSOS]);

  const handleToggle = async () => {
    if (isListening) {
      voiceAssistant.stop();
    } else {
      setErrorMessage(null);
      await voiceAssistant.start();
    }
  };

  const handleSimulate = (phrase: string) => {
    voiceAssistant.simulateTrigger(phrase);
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <button
          id="voice-assistant-nav-toggle-btn"
          onClick={handleToggle}
          title={
            isListening 
              ? 'Voice Assistant Listening: Say "Emergency" or "Help"' 
              : 'Turn on Voice Assistant for hands-free SOS'
          }
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            isListening
              ? 'bg-red-950/90 text-red-300 border-red-500 shadow-md shadow-red-950/50 animate-pulse'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
          }`}
        >
          {isListening ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <Mic className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Voice SOS: Active</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Voice SOS: Standby</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Subtle background ambiance */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
        isListening ? 'bg-red-600/10 opacity-100' : 'bg-blue-600/5 opacity-50'
      }`} />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isListening
              ? 'bg-red-600 text-white shadow-lg shadow-red-900/40 ring-4 ring-red-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {isListening ? (
              <Mic className="w-6 h-6 animate-pulse" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center space-x-2">
                <span>Hands-Free VoiceAssistant</span>
              </h3>
              {isListening ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 uppercase animate-pulse flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Listening</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                  Standby
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              Listens for trigger phrases like <span className="text-red-400 font-bold">"Emergency"</span> or <span className="text-red-400 font-bold">"Help"</span> to automatically trigger an SOS even when away from the screen.
            </p>
          </div>
        </div>

        {/* Action Toggle Button */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            id="voice-assistant-toggle-main-btn"
            onClick={handleToggle}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all shadow-md ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-950/50'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/40'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Stop VoiceAssistant</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Arm VoiceAssistant</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Away-From-Screen & Screen Lock Status Indicators */}
      <div className="relative z-10 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Screen WakeLock State */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 rounded-lg ${hasWakeLock ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
              {hasWakeLock ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
            <div>
              <span className="font-semibold text-slate-200 block">Screen Lock Defense (WakeLock)</span>
              <span className="text-[11px] text-slate-400">
                {hasWakeLock ? 'Screen prevented from sleeping' : 'Arm to prevent screen sleep'}
              </span>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            hasWakeLock ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-400'
          }`}>
            {hasWakeLock ? 'Active' : 'Off'}
          </span>
        </div>

        {/* Background Audio Keep-Alive */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 rounded-lg ${isListening ? 'bg-blue-950 text-blue-400' : 'bg-slate-900 text-slate-400'}`}>
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-200 block">Continuous Audio Carrier</span>
              <span className="text-[11px] text-slate-400">
                {isListening ? 'Keeps browser responsive in background' : 'Activates during listening'}
              </span>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            isListening ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-slate-900 text-slate-400'
          }`}>
            {isListening ? 'Streaming' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Error Message if Mic was blocked */}
      {errorMessage && (
        <div className="relative z-10 mt-3 p-3 rounded-2xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Hearing Transcript Area */}
      {isListening && (
        <div className="relative z-10 mt-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-slate-400 font-semibold shrink-0">Live Hearing:</span>
            <span className="text-slate-100 font-mono italic truncate">
              {transcript ? `"${transcript}"` : 'Listening for "Emergency" or "Help"... speak clearly'}
            </span>
          </div>

          {lastTriggeredPhrase && (
            <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold uppercase shrink-0">
              Matched: "{lastTriggeredPhrase}"
            </span>
          )}
        </div>
      )}

      {/* Trigger Phrases & Instant Simulator */}
      <div className="relative z-10 mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">
            Trigger Phrases:
          </span>
          {['Emergency', 'Help', 'Help Me', 'Call Ambulance'].map((phrase) => (
            <button
              key={phrase}
              onClick={() => handleSimulate(phrase)}
              title={`Click to simulate vocalizing "${phrase}"`}
              className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-red-950/80 text-red-300 hover:text-red-200 border border-slate-800 hover:border-red-800/80 text-[11px] font-medium transition-colors flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-red-400" />
              <span>"{phrase}"</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-slate-400 hover:text-slate-200 text-[11px] underline underline-offset-4 flex items-center space-x-1"
        >
          <Info className="w-3 h-3" />
          <span>{showInfo ? 'Hide Technical Spec' : 'Locked Screen & Away Handling'}</span>
        </button>
      </div>

      {/* Technical Spec Drawer */}
      {showInfo && (
        <div className="relative z-10 mt-3 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 space-y-2 animate-in fade-in">
          <p className="font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>How VoiceAssistant Operates in Locked or Away-from-Screen Scenarios</span>
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            1. <strong>Screen WakeLock API</strong>: Automatically requests a screen lock sentinel upon arming, preventing the mobile or computer display from timing out or locking while monitoring.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            2. <strong>Continuous Web Audio Keep-Alive</strong>: Generates an inaudible audio carrier to keep browser audio processes active and prevent background sleep when the tab is out of focus.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            3. <strong>Auto-Restart Loop & Voice Confirmation</strong>: Speech recognition instances automatically self-restart when silence triggers browser timeouts. On recognized phrases, it triggers <code className="text-red-400">handleTriggerSOS</code>, sounds an alert chime, and uses Speech Synthesis to verbally announce the dispatch.
          </p>
        </div>
      )}
    </div>
  );
};
