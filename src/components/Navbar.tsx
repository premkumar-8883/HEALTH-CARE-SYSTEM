import React from 'react';
import { 
  ShieldAlert, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  Activity, 
  Ambulance as AmbulanceIcon, 
  Stethoscope, 
  BarChart3, 
  User, 
  AlertCircle
} from 'lucide-react';
import { RoleMode, SOSTicket } from '../types';
import { VoiceAssistantPanel } from './VoiceAssistantPanel';

interface NavbarProps {
  currentRole: RoleMode;
  onRoleChange: (role: RoleMode) => void;
  activeTicket: SOSTicket | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onQuickSOS: () => void;
  onVoiceTriggerSOS?: (phrase: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeTicket,
  isMuted,
  onToggleMute,
  onQuickSOS,
  onVoiceTriggerSOS,
}) => {
  const isEmergencyActive = activeTicket && activeTicket.status !== 'resolved' && activeTicket.status !== 'idle';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Active Status */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg transition-colors ${
                isEmergencyActive ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
              }`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              {isEmergencyActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  ResQ<span className="text-red-500">Health</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  EMS Emergency Network
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Coordinated Patient, Ambulance & ER Dispatch
              </p>
            </div>
          </div>

          {/* Role Navigation Switcher */}
          <nav className="hidden lg:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              id="role-patient-btn"
              onClick={() => onRoleChange('patient')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentRole === 'patient'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Patient SOS Portal</span>
            </button>

            <button
              id="role-paramedic-btn"
              onClick={() => onRoleChange('paramedic')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentRole === 'paramedic'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <AmbulanceIcon className="w-4 h-4" />
              <span>Ambulance Dispatch</span>
            </button>

            <button
              id="role-doctor-btn"
              onClick={() => onRoleChange('doctor')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentRole === 'doctor'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor / ER Console</span>
            </button>

            <button
              id="role-analytics-btn"
              onClick={() => onRoleChange('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentRole === 'analytics'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>EMS Analytics</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Hands-free VoiceAssistant Quick Toggle */}
            <VoiceAssistantPanel
              compact={true}
              onTriggerSOS={(phrase) => {
                if (onVoiceTriggerSOS) {
                  onVoiceTriggerSOS(phrase);
                } else {
                  onQuickSOS();
                }
              }}
            />

            {/* Audio Siren Mute Toggle */}
            <button
              id="mute-toggle-btn"
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Emergency Siren' : 'Mute Emergency Siren'}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Quick 911 Dial Link */}
            <a
              id="dial-911-btn"
              href="tel:911"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-900/40 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Dial 911</span>
            </a>

            {/* Instant SOS Banner Trigger */}
            {!isEmergencyActive ? (
              <button
                id="header-sos-btn"
                onClick={onQuickSOS}
                className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-900/40 transition-transform active:scale-95 animate-pulse"
              >
                <AlertCircle className="w-4 h-4" />
                <span>ACTIVATE SOS</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>SOS ACTIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile View Role Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-800 space-x-2 scrollbar-none">
          <button
            onClick={() => onRoleChange('patient')}
            className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-medium ${
              currentRole === 'patient' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Patient SOS
          </button>
          <button
            onClick={() => onRoleChange('paramedic')}
            className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-medium ${
              currentRole === 'paramedic' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Ambulance Fleet
          </button>
          <button
            onClick={() => onRoleChange('doctor')}
            className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-medium ${
              currentRole === 'doctor' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Doctor / ER
          </button>
          <button
            onClick={() => onRoleChange('analytics')}
            className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-medium ${
              currentRole === 'analytics' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>
    </header>
  );
};
