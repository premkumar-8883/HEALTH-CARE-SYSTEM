import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation, 
  Heart, 
  ShieldAlert, 
  Bed, 
  Send, 
  Filter
} from 'lucide-react';
import { Hospital, SOSTicket } from '../types';

interface NearbyHospitalsProps {
  hospitals: Hospital[];
  activeTicket: SOSTicket | null;
  onPreAlertHospital: (hospitalId: string) => void;
}

export const NearbyHospitals: React.FC<NearbyHospitalsProps> = ({
  hospitals,
  activeTicket,
  onPreAlertHospital,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [preAlertedHospitals, setPreAlertedHospitals] = useState<Record<string, boolean>>({});

  const filterServices = [
    { id: 'all', label: 'All Emergency Facilities' },
    { id: 'trauma', label: 'Level I / II Trauma' },
    { id: 'cardiac', label: '24/7 Cath Lab' },
    { id: 'stroke', label: 'Stroke Center' },
    { id: 'pediatric', label: 'Pediatric ER' },
  ];

  const filteredHospitals = hospitals.filter((hosp) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'trauma') return hosp.traumaLevel.includes('Level I') || hosp.traumaLevel.includes('Level II');
    if (selectedFilter === 'cardiac') return hosp.specializedServices.some(s => s.toLowerCase().includes('cath') || s.toLowerCase().includes('pci'));
    if (selectedFilter === 'stroke') return hosp.specializedServices.some(s => s.toLowerCase().includes('stroke'));
    if (selectedFilter === 'pediatric') return hosp.specializedServices.some(s => s.toLowerCase().includes('pediatric'));
    return true;
  });

  const handlePreAlert = (hospitalId: string) => {
    setPreAlertedHospitals(prev => ({ ...prev, [hospitalId]: true }));
    onPreAlertHospital(hospitalId);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-700/50 flex items-center justify-center text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Nearby Hospitals & Emergency Departments</span>
            </h3>
            <p className="text-xs text-slate-400">
              Verified real-time capacity, ICU occupancy, trauma readiness, and direct pre-alerting
            </p>
          </div>
        </div>

        {/* Real-time sync badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Regional ER Registry Live Sync</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto py-3 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" />
        {filterServices.map((filter) => (
          <button
            key={filter.id}
            id={`filter-${filter.id}`}
            onClick={() => setSelectedFilter(filter.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedFilter === filter.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {filteredHospitals.map((hosp) => {
          const isPreAlerted = preAlertedHospitals[hosp.id] || activeTicket?.assignedHospitalId === hosp.id;
          const isDivert = hosp.status === 'Diversion';

          return (
            <div
              key={hosp.id}
              id={`hospital-card-${hosp.id}`}
              className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all ${
                isPreAlerted
                  ? 'bg-blue-950/40 border-blue-600 ring-1 ring-blue-500'
                  : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header: Name & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      {hosp.traumaLevel}
                    </span>
                    <h4 className="font-bold text-white text-base leading-snug">
                      {hosp.name}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="line-clamp-1">{hosp.address}</span>
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                    isDivert
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : hosp.status === 'High Volume'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {hosp.status}
                  </span>
                </div>

                {/* Distance & Real-Time Capacity Metrics */}
                <div className="grid grid-cols-3 gap-2 my-3.5">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">Distance</span>
                    <span className="text-xs font-bold text-white mt-0.5 block">
                      {hosp.distanceKm} km (~{hosp.travelTimeMin}m)
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">ER Beds</span>
                    <span className={`text-xs font-bold mt-0.5 block ${
                      hosp.availableBeds <= 2 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {hosp.availableBeds} Available
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">ICU / Trauma</span>
                    <span className="text-xs font-bold text-white mt-0.5 block">
                      {hosp.icuBedsAvailable} ICU • {hosp.traumaBaysReady} Bays
                    </span>
                  </div>
                </div>

                {/* Specialized Emergency Services Chips */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1.5">
                    Available Emergency Capabilities:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {hosp.specializedServices.map((service, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  {/* Emergency Line Phone Call */}
                  <a
                    href={`tel:${hosp.emergencyLine}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5"
                    title="Direct Emergency Department Line"
                  >
                    <Phone className="w-3.5 h-3.5 text-red-400" />
                    <span>ER Line</span>
                  </a>

                  {/* Google Maps External Navigation */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hosp.name + ' ' + hosp.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    <span>Navigate</span>
                  </a>
                </div>

                {/* Pre-Alert ER Button */}
                <button
                  id={`pre-alert-${hosp.id}`}
                  onClick={() => handlePreAlert(hosp.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isPreAlerted
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700'
                  }`}
                >
                  <Send className="w-3 h-3" />
                  <span>{isPreAlerted ? 'ER Pre-Alerted' : 'Pre-Alert ER'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
