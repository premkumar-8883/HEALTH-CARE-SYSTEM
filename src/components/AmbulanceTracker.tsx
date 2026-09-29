import React, { useState, useEffect } from 'react';
import { 
  Ambulance as AmbulanceIcon, 
  MapPin, 
  Phone, 
  Navigation, 
  ShieldCheck, 
  Clock, 
  Gauge, 
  HeartHandshake, 
  AlertCircle, 
  Check, 
  Siren, 
  Activity, 
  Radio
} from 'lucide-react';
import { Ambulance, SOSTicket, LocationCoords } from '../types';

interface AmbulanceTrackerProps {
  ambulances: Ambulance[];
  activeTicket: SOSTicket | null;
  userLocation: LocationCoords;
  onManualAssignAmbulance?: (ambulanceId: string) => void;
  onCancelSOS?: () => void;
  onRequestAmbulance?: (ambulanceId: string) => void;
}

export const AmbulanceTracker: React.FC<AmbulanceTrackerProps> = ({
  ambulances,
  activeTicket,
  userLocation,
  onManualAssignAmbulance,
  onCancelSOS,
  onRequestAmbulance,
}) => {
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string | null>(null);

  // Find assigned ambulance or default nearest
  const assignedAmbulance = ambulances.find(
    (a) => a.id === activeTicket?.assignedAmbulanceId
  ) || ambulances.find((a) => a.status === 'en_route') || null;

  useEffect(() => {
    if (assignedAmbulance) {
      setSelectedAmbulanceId(assignedAmbulance.id);
    } else if (ambulances.length > 0 && !selectedAmbulanceId) {
      setSelectedAmbulanceId(ambulances[0].id);
    }
  }, [assignedAmbulance, ambulances]);

  const activeAmbulance = ambulances.find((a) => a.id === selectedAmbulanceId) || ambulances[0];

  const getStatusBadge = (status: Ambulance['status']) => {
    switch (status) {
      case 'available':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">Ready & Available</span>;
      case 'en_route':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/60 animate-pulse">En Route / Siren Active</span>;
      case 'dispatched':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800/60">Dispatched</span>;
      case 'on_scene':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950 text-purple-300 border border-purple-800/60">On Scene</span>;
      case 'transporting':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">Transporting to ER</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400">Standby</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
            <AmbulanceIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Ambulance Assistance & Fleet Dispatch</span>
            </h3>
            <p className="text-xs text-slate-400">
              Real-time GPS telemetry, nearest vehicle assignment and crew communications
            </p>
          </div>
        </div>

        {/* Fleet Availability Counter */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-slate-300 font-medium">
            {ambulances.filter((a) => a.status === 'available').length} of {ambulances.length} Units Available
          </span>
        </div>
      </div>

      {/* Active En-Route Hero Banner if SOS is active */}
      {assignedAmbulance && (
        <div className="mt-5 bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/60 border-2 border-red-700/60 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500/60 flex items-center justify-center text-red-400 shrink-0">
                <Siren className="w-8 h-8 animate-bounce text-red-400" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-white text-lg sm:text-xl">
                    {assignedAmbulance.callSign}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white shadow-sm">
                    {assignedAmbulance.unitType}
                  </span>
                </div>
                <p className="text-xs text-red-200 mt-0.5">
                  Priority Dispatch: En route to your GPS position with siren active
                </p>
                <p className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                  <span>Crew: {assignedAmbulance.crew.leadParamedic}</span>
                  <span>•</span>
                  <span>Driver: {assignedAmbulance.crew.driver}</span>
                </p>
              </div>
            </div>

            {/* ETA Countdown Tile */}
            <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-red-800/40">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 block">
                  Estimated Arrival
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  ~{assignedAmbulance.etaMinutes} min
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {assignedAmbulance.distanceKm} km away • {assignedAmbulance.speedKmh} km/h
                </span>
              </div>

              <a
                href={`tel:${assignedAmbulance.crew.phone}`}
                id="call-crew-btn"
                className="flex items-center justify-center p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-transform active:scale-95"
                title="Call Paramedic Crew"
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Simulated Live Radar / Map View */}
      <div className="mt-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Emergency Dispatch Radar (San Francisco Medical District)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Scale: 10km grid • Live GPS telemetry
          </span>
        </div>

        {/* Stylized Vector Radar Map Container */}
        <div className="h-56 sm:h-64 w-full bg-slate-950 rounded-xl relative border border-slate-800/80 overflow-hidden flex items-center justify-center">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />
          
          {/* Radar scan ring */}
          <div className="absolute w-72 h-72 rounded-full border border-emerald-500/20" />
          <div className="absolute w-44 h-44 rounded-full border border-emerald-500/30" />
          <div className="absolute w-20 h-20 rounded-full border border-emerald-500/40" />

          {/* User Location Target Pin (Center) */}
          <div className="absolute z-20 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-red-500/30 animate-ping" />
              <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
            <span className="mt-1 text-[10px] font-bold bg-slate-900/90 text-red-300 border border-red-800/80 px-2 py-0.5 rounded shadow">
              You ({userLocation.address.split(',')[0]})
            </span>
          </div>

          {/* Ambulances Plotted on Radar */}
          {ambulances.map((amb, index) => {
            // Position dynamically based on distance
            const isAssigned = amb.id === assignedAmbulance?.id;
            const offsetX = (index - 2) * 55 + (isAssigned ? 20 : 0);
            const offsetY = (index % 2 === 0 ? -40 : 50) + (isAssigned ? -20 : 0);

            return (
              <div
                key={amb.id}
                onClick={() => setSelectedAmbulanceId(amb.id)}
                style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
                className={`absolute z-10 cursor-pointer group transition-all duration-700 flex flex-col items-center ${
                  isAssigned ? 'z-30 scale-110' : 'opacity-85 hover:opacity-100'
                }`}
              >
                <div className={`p-1.5 rounded-xl border flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 ${
                  isAssigned
                    ? 'bg-red-600 border-white text-white animate-bounce'
                    : amb.status === 'available'
                    ? 'bg-emerald-600 border-emerald-300 text-white'
                    : 'bg-slate-700 border-slate-500 text-slate-300'
                }`}>
                  <AmbulanceIcon className="w-4 h-4" />
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap mt-1 ${
                  isAssigned ? 'bg-red-950 text-red-200 border border-red-600' : 'bg-slate-900 text-slate-300 border border-slate-700'
                }`}>
                  {amb.callSign.split(' ')[1] || amb.callSign} (~{amb.etaMinutes}m)
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-2">
          Interactive dispatch map: Click any ambulance marker to view equipment and assign.
        </p>
      </div>

      {/* Selected Ambulance Details Card & Availability List */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Unit Fleet List */}
        <div className="lg:col-span-1 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Available Emergency Fleet
          </h4>
          {ambulances.map((amb) => {
            const isSelected = amb.id === activeAmbulance.id;
            const isAssigned = amb.id === assignedAmbulance?.id;

            return (
              <div
                key={amb.id}
                id={`amb-card-${amb.id}`}
                onClick={() => setSelectedAmbulanceId(amb.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                  isAssigned
                    ? 'bg-red-950/50 border-red-600 ring-1 ring-red-500'
                    : isSelected
                    ? 'bg-slate-800 border-blue-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{amb.callSign}</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {amb.unitType}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                  <span>{amb.distanceKm} km away</span>
                  <span className="font-bold text-slate-200">ETA: {amb.etaMinutes} min</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  {getStatusBadge(amb.status)}
                  {isAssigned && (
                    <span className="text-[10px] font-bold text-red-400">ASSIGNED</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Unit Spec Sheet */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-white text-base sm:text-lg">
                    {activeAmbulance.callSign}
                  </h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    {activeAmbulance.unitType} Life Support
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Station: Downtown Station 4 • Response Radius: 8.5 km
                </p>
              </div>

              {getStatusBadge(activeAmbulance.status)}
            </div>

            {/* Crew Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lead Paramedic</span>
                <span className="text-xs font-bold text-slate-200">{activeAmbulance.crew.leadParamedic}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Emergency Driver</span>
                <span className="text-xs font-bold text-slate-200">{activeAmbulance.crew.driver}</span>
              </div>
            </div>

            {/* On-board Medical Equipment */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-1.5">
                Certified On-board Medical Equipment:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeAmbulance.equipment.map((item, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center space-x-1"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span>Speed: {activeAmbulance.speedKmh} km/h</span>
              <span>•</span>
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Est. Travel: {activeAmbulance.etaMinutes} min</span>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={`tel:${activeAmbulance.crew.phone}`}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Unit</span>
              </a>

              {onRequestAmbulance && activeAmbulance.id !== assignedAmbulance?.id && (
                <button
                  id={`dispatch-amb-${activeAmbulance.id}`}
                  onClick={() => onRequestAmbulance(activeAmbulance.id)}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-transform active:scale-95"
                >
                  Assign This Ambulance
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
