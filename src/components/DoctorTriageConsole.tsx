import React, { useState } from 'react';
import { 
  Stethoscope, 
  Send, 
  ShieldCheck, 
  Activity, 
  Heart, 
  AlertTriangle, 
  Clock, 
  User, 
  MessageSquare, 
  CheckCircle2, 
  FileText, 
  Plus, 
  Radio, 
  Sparkles, 
  Ambulance as AmbulanceIcon
} from 'lucide-react';
import { SOSTicket, EmergencyMessage, TriageLevel, PatientProfile, Ambulance } from '../types';

interface DoctorTriageConsoleProps {
  activeTicket: SOSTicket | null;
  allTickets: SOSTicket[];
  patientProfile: PatientProfile;
  assignedAmbulance: Ambulance | null;
  onSendMessage: (text: string, senderRole: EmergencyMessage['senderRole'], senderName: string, urgent?: boolean) => void;
  onUpdateTriageLevel: (ticketId: string, level: TriageLevel) => void;
  onResolveTicket: (ticketId: string) => void;
}

export const DoctorTriageConsole: React.FC<DoctorTriageConsoleProps> = ({
  activeTicket,
  allTickets,
  patientProfile,
  assignedAmbulance,
  onSendMessage,
  onUpdateTriageLevel,
  onResolveTicket,
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    activeTicket?.id || (allTickets.length > 0 ? allTickets[0].id : null)
  );
  const [doctorInput, setDoctorInput] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Sarah Vance (ER Attending)');

  const currentTicket = allTickets.find(t => t.id === selectedTicketId) || activeTicket;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorInput.trim()) return;
    onSendMessage(doctorInput.trim(), 'doctor', doctorName, false);
    setDoctorInput('');
  };

  const handleQuickClinicalDirective = (directiveText: string) => {
    onSendMessage(`[CLINICAL DIRECTIVE] ${directiveText}`, 'doctor', doctorName, true);
  };

  const getTriageColorBadge = (level: TriageLevel) => {
    switch (level) {
      case 'immediate':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-950 text-red-400 border border-red-800 animate-pulse">RED - IMMEDIATE (RESUSCITATION)</span>;
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-800">YELLOW - URGENT (EMERGENT)</span>;
      case 'delayed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-400 border border-emerald-800">GREEN - DELAYED (NON-URGENT)</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Doctor Tele-Triage & Emergency Physician Console</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live hospital clinical queue, authorized health history, and direct pre-arrival telemetry communication
            </p>
          </div>
        </div>

        {/* Doctor on duty indicator */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-xs font-semibold text-slate-300">{doctorName}</span>
        </div>
      </div>

      {/* Main Console Layout */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Col: Incoming Emergency Tickets List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Emergency Stream ({allTickets.length})
            </h4>
            <span className="text-[10px] text-red-400 font-mono flex items-center space-x-1">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Live Triage Feed</span>
            </span>
          </div>

          {allTickets.length === 0 ? (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
              No active emergency calls right now. System on high alert.
            </div>
          ) : (
            allTickets.map((ticket) => {
              const isSelected = ticket.id === currentTicket?.id;
              return (
                <div
                  key={ticket.id}
                  id={`triage-ticket-${ticket.id}`}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-800/90 border-purple-500 ring-1 ring-purple-500 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{ticket.categoryLabel}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1">
                    Patient: <span className="font-semibold text-white">{ticket.patientData?.name || 'Anonymous'}</span> ({ticket.patientData?.age || '?'})
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    📍 {ticket.patientLocation.address}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between">
                    {getTriageColorBadge(ticket.triageLevel)}
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {ticket.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Center & Right Col: Clinical Chart & Real-Time Comms (8 cols) */}
        {currentTicket ? (
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {/* Top Bar: Patient Emergency Assessment & Authorized Health Data */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-bold text-white">
                      Case #{currentTicket.id.slice(-6).toUpperCase()}: {currentTicket.patientData?.name || 'Patient'}
                    </h4>
                    {getTriageColorBadge(currentTicket.triageLevel)}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Category: <span className="text-red-400 font-semibold">{currentTicket.categoryLabel}</span> • GPS: {currentTicket.patientLocation.address}
                  </p>
                </div>

                {/* Triage Level Reclassification Selector */}
                <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Triage:</span>
                  {(['immediate', 'urgent', 'delayed'] as TriageLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => onUpdateTriageLevel(currentTicket.id, level)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        currentTicket.triageLevel === level
                          ? level === 'immediate'
                            ? 'bg-red-600 text-white'
                            : level === 'urgent'
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {level[0].toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Authorized Patient Health Data (respecting privacy flags) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 text-xs">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Blood Group</span>
                  <span className="font-bold text-red-400">
                    {patientProfile.privacySettings.shareBloodGroup ? patientProfile.bloodGroup : '[Withheld by User]'}
                  </span>
                </div>

                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Known Allergies</span>
                  <span className="font-bold text-amber-300 truncate block">
                    {patientProfile.privacySettings.shareAllergies
                      ? patientProfile.allergies.join(', ') || 'None'
                      : '[Withheld by User]'}
                  </span>
                </div>

                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Current Medications</span>
                  <span className="font-bold text-blue-300 truncate block">
                    {patientProfile.privacySettings.shareMedications
                      ? patientProfile.medications.join(', ') || 'None'
                      : '[Withheld by User]'}
                  </span>
                </div>

                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Chronic Illnesses</span>
                  <span className="font-bold text-purple-300 truncate block">
                    {patientProfile.privacySettings.shareConditions
                      ? patientProfile.chronicConditions.join(', ') || 'None'
                      : '[Withheld by User]'}
                  </span>
                </div>
              </div>

              {/* Paramedic Unit Assignment Status */}
              {assignedAmbulance && (
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <AmbulanceIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300">
                      Assigned Unit: <span className="font-bold text-white">{assignedAmbulance.callSign}</span> ({assignedAmbulance.unitType})
                    </span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">
                    ETA: ~{assignedAmbulance.etaMinutes} min ({assignedAmbulance.distanceKm} km)
                  </span>
                </div>
              )}
            </div>

            {/* Quick Clinical Guidance Buttons (Instant Orders) */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Emergency Doctor Instant Directives (Pre-Arrival Orders):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Administer Aspirin 325mg chewable immediately',
                  'Position patient upright at 45° angle',
                  'Apply 15L O2 via Non-Rebreather Mask',
                  'Establish 18G IV access & prep 12-lead ECG',
                  'Prepare Cath Lab for STEMI activation',
                  'Initiate immediate continuous Hands-Only CPR',
                ].map((directive, idx) => (
                  <button
                    key={idx}
                    id={`directive-btn-${idx}`}
                    onClick={() => handleQuickClinicalDirective(directive)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-900/60 text-slate-200 hover:text-white border border-slate-800 hover:border-purple-600 transition-colors"
                  >
                    + {directive}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-Time Tele-Triage Messaging Channel */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col h-72">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Two-Way Emergency Comms Channel</span>
                </span>
                <span className="text-[10px] text-slate-400">Doctor • Paramedic • Patient</span>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto py-2 space-y-2.5 scrollbar-thin">
                {currentTicket.messages.map((msg) => {
                  const isDoctor = msg.senderRole === 'doctor';
                  const isParamedic = msg.senderRole === 'paramedic';
                  const isPatient = msg.senderRole === 'patient';
                  const isSystem = msg.senderRole === 'system';

                  return (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                        isDoctor
                          ? 'ml-auto bg-purple-950/80 border border-purple-700/60 text-purple-100'
                          : isParamedic
                          ? 'mr-auto bg-emerald-950/70 border border-emerald-700/60 text-emerald-100'
                          : isPatient
                          ? 'mr-auto bg-blue-950/70 border border-blue-700/60 text-blue-100'
                          : 'mx-auto bg-slate-900 text-slate-400 border border-slate-800 text-center font-mono text-[11px]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold mb-0.5 opacity-80">
                        <span>{msg.senderName}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSend} className="pt-2 border-t border-slate-800 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Send medical guidance or pre-arrival instruction..."
                  value={doctorInput}
                  onChange={(e) => setDoctorInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  id="send-doctor-msg-btn"
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>

            {/* Resolve or Close Call */}
            <div className="flex justify-end">
              <button
                id="resolve-ticket-btn"
                onClick={() => onResolveTicket(currentTicket.id)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                Mark Emergency Resolved / Patient Admitted to ER
              </button>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-12 bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-500 text-sm">
            Select an active emergency ticket from the queue to review medical chart and provide guidance.
          </div>
        )}

      </div>
    </div>
  );
};
