import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  CheckCircle2, 
  Loader2, 
  Radio, 
  ShieldAlert, 
  Flame, 
  Compass, 
  Clock
} from 'lucide-react';
import { LocationCoords, EmergencyCategory } from '../types';
import { EMERGENCY_CATEGORIES } from '../data/mockData';
import { getCurrentBrowserLocation } from '../utils/geo';
import { emergencyAudio } from '../utils/audio';

interface SOSButtonProps {
  userLocation: LocationCoords;
  onLocationUpdated: (coords: LocationCoords) => void;
  onTriggerSOS: (category: EmergencyCategory, location: LocationCoords, notes: string) => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  userLocation,
  onLocationUpdated,
  onTriggerSOS,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory>('cardiac');
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isLocating, setIsLocating] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Auto-acquire real browser GPS on load if permitted
  useEffect(() => {
    refreshLocation();
  }, []);

  const refreshLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await getCurrentBrowserLocation();
      onLocationUpdated(loc);
    } catch {
      // Keep default
    } finally {
      setIsLocating(false);
    }
  };

  const handleStartCountdown = () => {
    setIsCountingDown(true);
    setCountdown(3);
    emergencyAudio.playDispatchChime();

    // Sound alert beep on each second
    let current = 3;
    timerRef.current = window.setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
        emergencyAudio.playDispatchChime();
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsCountingDown(false);
        emergencyAudio.playSirenPulse();
        onTriggerSOS(selectedCategory, userLocation, customNotes);
      }
    }, 1000);
  };

  const handleCancelCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsCountingDown(false);
    setCountdown(3);
  };

  const handleInstantDispatch = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsCountingDown(false);
    emergencyAudio.playSirenPulse();
    onTriggerSOS(selectedCategory, userLocation, customNotes);
  };

  const selectedCatObj = EMERGENCY_CATEGORIES.find((c) => c.id === selectedCategory) || EMERGENCY_CATEGORIES[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background ambient red glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        
        {/* Status Header */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/80 text-red-400 text-xs font-semibold mb-4">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>INSTANT EMERGENCY RESPONSE READY</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Medical Emergency SOS
        </h2>
        <p className="text-slate-400 text-sm max-w-md mt-1 mb-6">
          Press once to dispatch the nearest Advanced Life Support ambulance and pre-alert the regional trauma center.
        </p>

        {/* The One-Tap Main SOS Button */}
        {!isCountingDown ? (
          <div className="relative my-2 flex items-center justify-center">
            {/* Outer pulsating wave rings */}
            <span className="absolute w-56 h-56 rounded-full bg-red-600/20 animate-ping opacity-75" />
            <span className="absolute w-64 h-64 rounded-full bg-red-600/10 animate-pulse" />

            <button
              id="main-sos-button"
              onClick={handleStartCountdown}
              className="relative group w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 text-white font-black text-2xl tracking-wider shadow-2xl shadow-red-700/60 flex flex-col items-center justify-center border-4 border-red-400/40 transform transition-all active:scale-95 hover:shadow-red-500/80 cursor-pointer"
            >
              <div className="p-2 bg-red-700/50 rounded-full mb-1 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-10 h-10 text-white drop-shadow" />
              </div>
              <span className="text-3xl font-black tracking-widest drop-shadow-md">SOS</span>
              <span className="text-[10px] tracking-normal uppercase font-bold text-red-100 opacity-90 mt-0.5">
                Tap to Activate
              </span>
            </button>
          </div>
        ) : (
          /* Active Countdown State with Cancel Buffer */
          <div className="my-4 flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <div className="relative w-44 h-44 rounded-full bg-red-950 border-4 border-red-500 flex flex-col items-center justify-center text-white shadow-2xl shadow-red-600/50">
              <span className="text-xs font-bold text-red-300 uppercase tracking-widest">Dispatching In</span>
              <span className="text-6xl font-black my-1 text-white animate-pulse">{countdown}</span>
              <span className="text-[11px] text-red-300">Seconds</span>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                id="cancel-sos-countdown-btn"
                onClick={handleCancelCountdown}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-colors"
              >
                Cancel (Accidental)
              </button>
              <button
                id="instant-sos-dispatch-btn"
                onClick={handleInstantDispatch}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/40 transition-transform active:scale-95"
              >
                Dispatch Immediately
              </button>
            </div>
          </div>
        )}

        {/* Category Selection Pill */}
        <div className="mt-6 w-full max-w-lg">
          <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-900/40 border border-red-700/50 flex items-center justify-center text-red-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Selected Emergency Condition</p>
                <p className="text-sm font-bold text-white">{selectedCatObj.label}</p>
              </div>
            </div>

            <button
              id="change-category-btn"
              onClick={() => setShowCategorySelector(!showCategorySelector)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showCategorySelector ? 'Close' : 'Change Condition'}
            </button>
          </div>

          {/* Collapsible Category Selector */}
          {showCategorySelector && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left animate-in slide-in-from-top-2 duration-150">
              {EMERGENCY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  id={`cat-select-${cat.id}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setShowCategorySelector(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-red-950/60 border-red-600 text-white'
                      : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs sm:text-sm">{cat.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-800 text-slate-300">
                      {cat.recommendedUnit}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 line-clamp-1">{cat.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location Verification Card */}
        <div className="mt-4 w-full max-w-lg bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-left">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-300">GPS Dispatch Location:</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                    GPS Active (±{Math.round(userLocation.accuracy || 8)}m)
                  </span>
                </div>
                <p className="text-xs text-white font-medium mt-0.5">{userLocation.address}</p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Lat: {userLocation.lat.toFixed(5)}, Lng: {userLocation.lng.toFixed(5)}
                </p>
              </div>
            </div>

            <button
              id="refresh-location-btn"
              onClick={refreshLocation}
              disabled={isLocating}
              title="Refresh GPS Coordinates"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
            >
              {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick symptom/location notes */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80">
            <input
              id="sos-custom-notes-input"
              type="text"
              placeholder="Optional notes: e.g., Apt 4B, patient unconscious, gate code #1234"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
