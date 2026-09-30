/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Phone, 
  MapPin, 
  Ambulance as AmbulanceIcon, 
  Building2, 
  User, 
  Users, 
  Stethoscope, 
  BarChart3, 
  HeartHandshake, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Siren, 
  X
} from 'lucide-react';
import { 
  RoleMode, 
  SOSTicket, 
  LocationCoords, 
  Ambulance, 
  Hospital, 
  PatientProfile, 
  EmergencyContact, 
  NotificationLog, 
  EmergencyCategory, 
  TriageLevel, 
  EmergencyMessage 
} from './types';
import { 
  INITIAL_AMBULANCES, 
  INITIAL_HOSPITALS, 
  INITIAL_PATIENT_PROFILE, 
  EMERGENCY_CATEGORIES 
} from './data/mockData';
import { getCurrentBrowserLocation, DEFAULT_USER_LOCATION, stepTowards } from './utils/geo';
import { emergencyAudio } from './utils/audio';
import { voiceAssistant } from './utils/VoiceAssistant';

import { Navbar } from './components/Navbar';
import { SOSButton } from './components/SOSButton';
import { VoiceAssistantPanel } from './components/VoiceAssistantPanel';
import { AmbulanceTracker } from './components/AmbulanceTracker';
import { NearbyHospitals } from './components/NearbyHospitals';
import { PatientHealthPassport } from './components/PatientHealthPassport';
import { EmergencyContactsManager } from './components/EmergencyContactsManager';
import { DoctorTriageConsole } from './components/DoctorTriageConsole';
import { FirstAidGuide } from './components/FirstAidGuide';
import { SystemAnalytics } from './components/SystemAnalytics';

const LOCAL_STORAGE_KEY_PROFILE = 'resq_patient_profile_v1';
const LOCAL_STORAGE_KEY_TICKETS = 'resq_active_tickets_v1';

export default function App() {
  // Navigation & Role Mode
  const [currentRole, setCurrentRole] = useState<RoleMode>('patient');
  const [activeTab, setActiveTab] = useState<'sos' | 'ambulance' | 'hospitals' | 'passport' | 'contacts' | 'firstaid'>('sos');

  // Core Data State
  const [userLocation, setUserLocation] = useState<LocationCoords>(DEFAULT_USER_LOCATION);
  const [ambulances, setAmbulances] = useState<Ambulance[]>(INITIAL_AMBULANCES);
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [patientProfile, setPatientProfile] = useState<PatientProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return INITIAL_PATIENT_PROFILE;
  });

  const [activeTicket, setActiveTicket] = useState<SOSTicket | null>(null);
  const [allTickets, setAllTickets] = useState<SOSTicket[]>([]);
  const [notificationsLog, setNotificationsLog] = useState<NotificationLog[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Audio mute sync
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    emergencyAudio.setMuted(next);
  };

  // Acquire live GPS on app mount
  useEffect(() => {
    getCurrentBrowserLocation().then((loc) => {
      setUserLocation(loc);
    });
  }, []);

  // Save profile changes
  const handleSaveProfile = (newProfile: PatientProfile) => {
    setPatientProfile(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(newProfile));
    }
  };

  // Trigger Emergency SOS
  const handleTriggerSOS = (
    category: EmergencyCategory,
    location: LocationCoords,
    notes: string
  ) => {
    const catObj = EMERGENCY_CATEGORIES.find((c) => c.id === category) || EMERGENCY_CATEGORIES[0];
    
    // Pick nearest available ambulance
    const availableAmbulances = ambulances.filter(a => a.status === 'available');
    const matchedAmbulance = availableAmbulances.find(a => a.unitType === catObj.recommendedUnit) || availableAmbulances[0] || ambulances[0];

    // Pick nearest hospital
    const nearestHospital = hospitals[0];

    const ticketId = 'SOS-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Generate automated notifications for contacts with autoNotifyOnSOS enabled
    const newNotifications: NotificationLog[] = patientProfile.emergencyContacts
      .filter((c) => c.autoNotifyOnSOS && patientProfile.privacySettings.autoNotifyContacts)
      .map((c) => ({
        id: 'notif_' + Math.random().toString(36).substring(2, 9),
        contactName: c.name,
        phone: c.phone,
        channel: 'SMS',
        status: 'delivered',
        message: `EMERGENCY ALERT: ${patientProfile.name} initiated medical SOS for [${catObj.label}] at ${location.address}. Ambulance ${matchedAmbulance.callSign} en route.`,
        timestamp: timeStr,
      }));

    const initialMessages: EmergencyMessage[] = [
      {
        id: 'msg_1',
        senderRole: 'system',
        senderName: 'EMS Dispatch Center',
        text: `Emergency ticket initiated. Priority: ${catObj.defaultTriage.toUpperCase()}. Unit ${matchedAmbulance.callSign} assigned. Estimated arrival: ~${matchedAmbulance.etaMinutes} minutes.`,
        timestamp: timeStr,
      },
      {
        id: 'msg_2',
        senderRole: 'doctor',
        senderName: 'Dr. Sarah Vance (ER Attending)',
        text: `Trauma Center received your alert. Please remain calm and seated. Paramedics are en route. If you are experiencing chest pain or difficulty breathing, notify us immediately.`,
        timestamp: timeStr,
      },
    ];

    const newTicket: SOSTicket = {
      id: ticketId,
      createdAt: now.toISOString(),
      category,
      categoryLabel: catObj.label,
      status: 'en_route',
      triageLevel: catObj.defaultTriage,
      patientLocation: location,
      notes,
      patientData: patientProfile,
      assignedAmbulanceId: matchedAmbulance.id,
      assignedHospitalId: nearestHospital.id,
      vitals: {
        heartRate: 104,
        bloodPressure: '138/88',
        spO2: 96,
        respiratoryRate: 22,
        temperatureC: 37.1,
      },
      messages: initialMessages,
      notificationsSent: newNotifications,
    };

    setActiveTicket(newTicket);
    setAllTickets((prev) => [newTicket, ...prev]);
    setNotificationsLog((prev) => [...newNotifications, ...prev]);

    // Update assigned ambulance status
    setAmbulances((prev) =>
      prev.map((a) =>
        a.id === matchedAmbulance.id
          ? { ...a, status: 'en_route', assignedTicketId: ticketId }
          : a
      )
    );

    emergencyAudio.speakEmergencyAlert(
      `Emergency alert activated. Nearest unit ${matchedAmbulance.callSign} is en route. Estimated arrival in ${matchedAmbulance.etaMinutes} minutes.`
    );
  };

  // Wire up VoiceAssistant: Automatically invoke handleTriggerSOS when trigger phrases like "Emergency" or "Help" are spoken
  useEffect(() => {
    voiceAssistant.onTrigger((phrase: string) => {
      let category: EmergencyCategory = 'general';
      const lower = phrase.toLowerCase();
      if (lower.includes('heart') || lower.includes('chest pain')) {
        category = 'cardiac';
      } else if (lower.includes('stroke')) {
        category = 'stroke';
      } else if (lower.includes('breath') || lower.includes('chok')) {
        category = 'respiratory';
      } else if (lower.includes('trauma') || lower.includes('bleed') || lower.includes('accident')) {
        category = 'trauma';
      }

      handleTriggerSOS(
        category,
        userLocation,
        `Hands-Free VoiceAssistant: Emergency command detected: "${phrase}"`
      );
    });
  }, [userLocation, ambulances, hospitals, patientProfile]);

  // Cancel / Resolve SOS
  const handleResolveTicket = (ticketId: string) => {
    setActiveTicket(null);
    setAllTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
    );
    setAmbulances((prev) =>
      prev.map((a) =>
        a.assignedTicketId === ticketId
          ? { ...a, status: 'available', assignedTicketId: undefined, etaMinutes: 4, distanceKm: 1.5 }
          : a
      )
    );
  };

  // Paramedic update status
  const handleUpdateAmbulanceStatus = (ambulanceId: string, newStatus: Ambulance['status']) => {
    setAmbulances((prev) =>
      prev.map((a) => (a.id === ambulanceId ? { ...a, status: newStatus } : a))
    );
    if (activeTicket && activeTicket.assignedAmbulanceId === ambulanceId) {
      setActiveTicket((prev) => (prev ? { ...prev, status: newStatus as SOSTicket['status'] } : null));
    }
  };

  // Doctor send message in triage chat
  const handleSendMessage = (
    text: string,
    senderRole: EmergencyMessage['senderRole'],
    senderName: string,
    urgent: boolean = false
  ) => {
    if (!activeTicket) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg: EmergencyMessage = {
      id: 'msg_' + Date.now(),
      senderRole,
      senderName,
      text,
      timestamp: timeStr,
      urgent,
    };

    const updated = {
      ...activeTicket,
      messages: [...activeTicket.messages, msg],
    };

    setActiveTicket(updated);
    setAllTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );

    if (urgent) {
      emergencyAudio.playDispatchChime();
    }
  };

  // Doctor update triage severity
  const handleUpdateTriageLevel = (ticketId: string, level: TriageLevel) => {
    if (activeTicket && activeTicket.id === ticketId) {
      setActiveTicket((prev) => (prev ? { ...prev, triageLevel: level } : null));
    }
    setAllTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, triageLevel: level } : t))
    );
  };

  // Hospital Pre-Alert
  const handlePreAlertHospital = (hospitalId: string) => {
    const hosp = hospitals.find((h) => h.id === hospitalId);
    if (hosp && activeTicket) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const alertMsg: EmergencyMessage = {
        id: 'msg_' + Date.now(),
        senderRole: 'system',
        senderName: 'Hospital Triage Desk',
        text: `PRE-ALERT TRANSMITTED to ${hosp.name}. Trauma bay prepared. Receiving Nurse alerted for inbound arrival.`,
        timestamp: timeStr,
      };
      const updated = {
        ...activeTicket,
        assignedHospitalId: hospitalId,
        messages: [...activeTicket.messages, alertMsg],
      };
      setActiveTicket(updated);
      setAllTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      emergencyAudio.playDispatchChime();
    }
  };

  // Manual ambulance assignment
  const handleManualAssignAmbulance = (ambulanceId: string) => {
    if (!activeTicket) {
      handleTriggerSOS('general', userLocation, 'Direct ambulance dispatch requested');
      return;
    }
    setAmbulances((prev) =>
      prev.map((a) =>
        a.id === ambulanceId
          ? { ...a, status: 'en_route', assignedTicketId: activeTicket.id }
          : a
      )
    );
    setActiveTicket((prev) => (prev ? { ...prev, assignedAmbulanceId: ambulanceId } : null));
  };

  // Live GPS simulation loop when ambulance is en route
  useEffect(() => {
    if (!activeTicket || activeTicket.status !== 'en_route') return;
    const assignedAmb = ambulances.find((a) => a.id === activeTicket.assignedAmbulanceId);
    if (!assignedAmb) return;

    const interval = window.setInterval(() => {
      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.id === assignedAmb.id && a.status === 'en_route') {
            const nextEta = Math.max(1, a.etaMinutes - 1);
            const nextDistance = Math.max(0.2, Math.round((a.distanceKm - 0.3) * 10) / 10);
            const newCoords = stepTowards(a.coords, userLocation, 0.1);

            return {
              ...a,
              etaMinutes: nextEta,
              distanceKm: nextDistance,
              coords: newCoords,
              speedKmh: Math.floor(45 + Math.random() * 15),
            };
          }
          return a;
        })
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [activeTicket, ambulances, userLocation]);

  const assignedAmbulance = ambulances.find(
    (a) => a.id === activeTicket?.assignedAmbulanceId
  ) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        activeTicket={activeTicket}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onVoiceTriggerSOS={(phrase) => {
          handleTriggerSOS('general', userLocation, `Hands-Free Voice SOS: Triggered by command "${phrase}"`);
        }}
        onQuickSOS={() => {
          setCurrentRole('patient');
          setActiveTab('sos');
          const mainBtn = document.getElementById('main-sos-button');
          if (mainBtn) mainBtn.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* PERSPECTIVE 1: PATIENT SOS PORTAL */}
        {currentRole === 'patient' && (
          <div className="space-y-6">
            
            {/* Quick Feature Navigation Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
              {[
                { id: 'sos', label: 'Emergency SOS', icon: ShieldAlert },
                { id: 'ambulance', label: 'Ambulance Radar', icon: AmbulanceIcon },
                { id: 'hospitals', label: 'Nearby Hospitals', icon: Building2 },
                { id: 'passport', label: 'Health Passport', icon: User },
                { id: 'contacts', label: 'Emergency Contacts', icon: Users },
                { id: 'firstaid', label: 'First Aid & CPR', icon: HeartHandshake },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active SOS Ticket Global Ribbon */}
            {activeTicket && activeTicket.status !== 'resolved' && (
              <div className="bg-gradient-to-r from-red-900/90 via-slate-900 to-red-950 border-2 border-red-500 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg animate-pulse shrink-0">
                    <Siren className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-white text-base sm:text-lg">
                        EMERGENCY DISPATCH ACTIVE • {activeTicket.categoryLabel.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase">
                        {activeTicket.triageLevel}
                      </span>
                    </div>
                    <p className="text-xs text-red-200 mt-0.5">
                      Assigned: {assignedAmbulance?.callSign || 'Ambulance ALS-402'} • ETA: ~{assignedAmbulance?.etaMinutes || 4} min ({assignedAmbulance?.distanceKm || 1.2} km)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => setActiveTab('ambulance')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-red-400/40 transition-colors"
                  >
                    Track Ambulance
                  </button>
                  <button
                    onClick={() => handleResolveTicket(activeTicket.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Cancel / Resolved
                  </button>
                </div>
              </div>
            )}

            {/* Tab 1: One-Tap Emergency SOS & Hands-Free Voice Assistant */}
            {activeTab === 'sos' && (
              <div className="space-y-6">
                <SOSButton
                  userLocation={userLocation}
                  onLocationUpdated={(loc) => setUserLocation(loc)}
                  onTriggerSOS={handleTriggerSOS}
                />

                {/* VoiceAssistant Dedicated Panel */}
                <VoiceAssistantPanel
                  onTriggerSOS={(phrase) => {
                    handleTriggerSOS('general', userLocation, `VoiceAssistant vocal command: "${phrase}"`);
                  }}
                />

                {/* Sub-panels preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AmbulanceTracker
                    ambulances={ambulances}
                    activeTicket={activeTicket}
                    userLocation={userLocation}
                    onRequestAmbulance={handleManualAssignAmbulance}
                  />
                  <NearbyHospitals
                    hospitals={hospitals}
                    activeTicket={activeTicket}
                    onPreAlertHospital={handlePreAlertHospital}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Ambulance Radar & Tracking */}
            {activeTab === 'ambulance' && (
              <AmbulanceTracker
                ambulances={ambulances}
                activeTicket={activeTicket}
                userLocation={userLocation}
                onRequestAmbulance={handleManualAssignAmbulance}
                onCancelSOS={() => activeTicket && handleResolveTicket(activeTicket.id)}
              />
            )}

            {/* Tab 3: Nearby Hospitals & Real-time ER status */}
            {activeTab === 'hospitals' && (
              <NearbyHospitals
                hospitals={hospitals}
                activeTicket={activeTicket}
                onPreAlertHospital={handlePreAlertHospital}
              />
            )}

            {/* Tab 4: Patient Health Passport */}
            {activeTab === 'passport' && (
              <PatientHealthPassport
                profile={patientProfile}
                onSaveProfile={handleSaveProfile}
              />
            )}

            {/* Tab 5: Emergency Contacts & Automated SMS Notifications */}
            {activeTab === 'contacts' && (
              <EmergencyContactsManager
                contacts={patientProfile.emergencyContacts}
                notificationsLog={notificationsLog}
                activeTicket={activeTicket}
                onUpdateContacts={(newContacts) => {
                  handleSaveProfile({ ...patientProfile, emergencyContacts: newContacts });
                }}
                onSendManualAlert={(contactId) => {
                  const contact = patientProfile.emergencyContacts.find(c => c.id === contactId);
                  if (contact) {
                    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    setNotificationsLog(prev => [
                      {
                        id: 'manual_' + Date.now(),
                        contactName: contact.name,
                        phone: contact.phone,
                        channel: 'SMS',
                        status: 'delivered',
                        message: `PRIORITY ALERT: ${patientProfile.name} shared live medical status and location: ${userLocation.address}.`,
                        timestamp: timeStr,
                      },
                      ...prev,
                    ]);
                  }
                }}
              />
            )}

            {/* Tab 6: First Aid & CPR Metronome */}
            {activeTab === 'firstaid' && (
              <FirstAidGuide />
            )}

          </div>
        )}

        {/* PERSPECTIVE 2: PARAMEDIC & AMBULANCE DISPATCH CONSOLE */}
        {currentRole === 'paramedic' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                    <AmbulanceIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Paramedic EMS Dispatch Terminal</h3>
                    <p className="text-xs text-slate-400">
                      Active call telemetry, navigation waypoints, patient clinical records, and hospital handoff
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800">
                    Unit: Rescue ALS-402 (Active Dispatch)
                  </span>
                </div>
              </div>

              {/* Paramedic Workflow Card */}
              {activeTicket ? (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Incident Address</span>
                      <span className="text-sm font-bold text-white block mt-1">
                        {activeTicket.patientLocation.address}
                      </span>
                      <span className="text-xs text-red-400 block mt-0.5">
                        Category: {activeTicket.categoryLabel}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Patient Identity</span>
                      <span className="text-sm font-bold text-white block mt-1">
                        {activeTicket.patientData.name || 'Patient'} ({activeTicket.patientData.age} yrs, {activeTicket.patientData.bloodGroup})
                      </span>
                      <span className="text-xs text-amber-300 block mt-0.5">
                        Allergies: {activeTicket.patientData.allergies?.join(', ') || 'None reported'}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Receiving Hospital</span>
                      <span className="text-sm font-bold text-white block mt-1">
                        Metropolitan Trauma Center
                      </span>
                      <span className="text-xs text-emerald-400 block mt-0.5">
                        Trauma Bay 3 Pre-Alerted
                      </span>
                    </div>
                  </div>

                  {/* Operational Status Progression Buttons */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-300">Update Mission Stage:</span>
                    <div className="flex flex-wrap gap-2">
                      {(['en_route', 'on_scene', 'transporting', 'arrived_hospital'] as Ambulance['status'][]).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateAmbulanceStatus(assignedAmbulance?.id || 'amb-101', status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            assignedAmbulance?.status === status
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                          }`}
                        >
                          {status.replace('_', ' ').toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 p-8 bg-slate-950 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
                  No active ambulance dispatch calls right now. Press "Emergency SOS" in the Patient portal or header to generate a live dispatch ticket.
                </div>
              )}
            </div>

            {/* Ambulance Tracker Map */}
            <AmbulanceTracker
              ambulances={ambulances}
              activeTicket={activeTicket}
              userLocation={userLocation}
              onRequestAmbulance={handleManualAssignAmbulance}
            />
          </div>
        )}

        {/* PERSPECTIVE 3: DOCTOR / ER CONSOLE */}
        {currentRole === 'doctor' && (
          <DoctorTriageConsole
            activeTicket={activeTicket}
            allTickets={allTickets}
            patientProfile={patientProfile}
            assignedAmbulance={assignedAmbulance}
            onSendMessage={handleSendMessage}
            onUpdateTriageLevel={handleUpdateTriageLevel}
            onResolveTicket={handleResolveTicket}
          />
        )}

        {/* PERSPECTIVE 4: EMS SYSTEM ANALYTICS */}
        {currentRole === 'analytics' && (
          <SystemAnalytics
            tickets={allTickets}
            ambulances={ambulances}
            hospitals={hospitals}
          />
        )}

      </main>

      {/* Persistent Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Healthcare Emergency Management System • ISO 27799 / HIPAA Compliant Telemetry</span>
          <span className="font-mono text-slate-400">Emergency Hotlines: 911 (US/CA) • 112 (EU) • 108 (IN)</span>
        </div>
      </footer>
    </div>
  );
}
