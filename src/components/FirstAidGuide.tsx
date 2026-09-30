import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Activity, 
  Play, 
  Square, 
  CheckCircle, 
  Clock, 
  AlertOctagon, 
  ShieldCheck, 
  ChevronRight,
  Heart
} from 'lucide-react';
import { FIRST_AID_PROTOCOLS } from '../data/mockData';
import { emergencyAudio } from '../utils/audio';

export const FirstAidGuide: React.FC = () => {
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('cpr');
  const [isCPRRunning, setIsCPRRunning] = useState(false);
  const [cprBeat, setCprBeat] = useState(0);

  const selectedProtocol = FIRST_AID_PROTOCOLS.find(p => p.id === selectedProtocolId) || FIRST_AID_PROTOCOLS[0];

  useEffect(() => {
    return () => {
      emergencyAudio.stopCPRMetronome();
    };
  }, []);

  const toggleCPR = () => {
    if (isCPRRunning) {
      emergencyAudio.stopCPRMetronome();
      setIsCPRRunning(false);
      setCprBeat(0);
    } else {
      setIsCPRRunning(true);
      emergencyAudio.startCPRMetronome(110, (beat) => {
        setCprBeat(beat);
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/50 flex items-center justify-center text-red-400">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Pre-Arrival First Aid & Bystander Life Support</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evidence-based clinical resuscitation protocols while emergency responders are en route
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>AHA & ERC Compliant</span>
        </div>
      </div>

      {/* Protocol Selection Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto py-3 scrollbar-none">
        {FIRST_AID_PROTOCOLS.map((protocol) => (
          <button
            key={protocol.id}
            id={`protocol-btn-${protocol.id}`}
            onClick={() => {
              setSelectedProtocolId(protocol.id);
              if (isCPRRunning && protocol.id !== 'cpr') {
                emergencyAudio.stopCPRMetronome();
                setIsCPRRunning(false);
              }
            }}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedProtocolId === protocol.id
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {protocol.title}
          </button>
        ))}
      </div>

      {/* Protocol Content Box */}
      <div className="mt-3 bg-slate-950 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h4 className="text-base font-bold text-white">{selectedProtocol.title}</h4>
            <span className="text-xs text-red-400 font-semibold flex items-center space-x-1 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{selectedProtocol.urgency}</span>
            </span>
          </div>

          {/* CPR Metronome Launcher if CPR protocol is chosen */}
          {selectedProtocol.id === 'cpr' && (
            <div className="flex items-center space-x-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">CPR Rhythm Guide</span>
                <span className="text-xs font-mono font-bold text-emerald-400 block">
                  110 BPM • Beat: {cprBeat % 30 || 30} / 30
                </span>
              </div>

              <button
                id="toggle-cpr-metronome-btn"
                onClick={toggleCPR}
                className={`p-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all ${
                  isCPRRunning
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                }`}
              >
                {isCPRRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isCPRRunning ? 'Stop Metronome' : 'Start Audio Beat'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Visual CPR Pulse Ring if running */}
        {isCPRRunning && selectedProtocol.id === 'cpr' && (
          <div className="my-5 p-4 bg-slate-900/80 rounded-2xl border border-red-700/60 flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
            <div className="relative flex items-center justify-center w-24 h-24">
              <span className="absolute w-24 h-24 rounded-full bg-red-600/30 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg">
                <Heart className="w-8 h-8 animate-pulse text-white" />
              </div>
            </div>

            <div className="text-left max-w-sm">
              <p className="text-sm font-bold text-white">
                Push down hard in the center of the chest with every beat.
              </p>
              <p className="text-xs text-red-300 mt-1">
                Compress at 2 inches (5 cm) depth. Allow full chest recoil. Deliver 2 rescue breaths every 30 compressions if trained.
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Total Compressions</span>
              <span className="text-3xl font-black font-mono text-white">{cprBeat}</span>
            </div>
          </div>
        )}

        {/* Step-by-Step Action List */}
        <div className="mt-4 space-y-2.5">
          {selectedProtocol.steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start space-x-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80"
            >
              <span className="w-6 h-6 rounded-full bg-slate-800 text-red-400 border border-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
