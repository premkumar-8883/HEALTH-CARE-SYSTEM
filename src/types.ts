export type EmergencyCategory = 
  | 'cardiac'
  | 'trauma'
  | 'respiratory'
  | 'stroke'
  | 'allergic'
  | 'maternal'
  | 'general';

export type SOSStatus = 
  | 'idle'
  | 'initiating'
  | 'dispatched'
  | 'en_route'
  | 'on_scene'
  | 'transporting'
  | 'arrived_hospital'
  | 'resolved';

export type TriageLevel = 'immediate' | 'urgent' | 'delayed';

export type RoleMode = 'patient' | 'paramedic' | 'doctor' | 'analytics';

export interface LocationCoords {
  lat: number;
  lng: number;
  accuracy?: number;
  address: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  autoNotifyOnSOS: boolean;
}

export interface PatientProfile {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  weightKg?: number;
  emergencyContacts: EmergencyContact[];
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  organDonor: boolean;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  privacySettings: {
    shareBloodGroup: boolean;
    shareAllergies: boolean;
    shareMedications: boolean;
    shareConditions: boolean;
    shareContacts: boolean;
    shareInsurance: boolean;
    autoNotifyContacts: boolean;
  };
}

export interface Ambulance {
  id: string;
  callSign: string;
  unitType: 'ALS' | 'BLS' | 'Critical Care' | 'Neonatal';
  status: 'available' | 'dispatched' | 'en_route' | 'on_scene' | 'transporting' | 'maintenance';
  crew: {
    leadParamedic: string;
    driver: string;
    phone: string;
  };
  coords: { lat: number; lng: number };
  distanceKm: number;
  etaMinutes: number;
  speedKmh: number;
  equipment: string[];
  assignedTicketId?: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: string;
  distanceKm: number;
  travelTimeMin: number;
  address: string;
  phone: string;
  emergencyLine: string;
  traumaLevel: 'Level I' | 'Level II' | 'Level III' | 'Community ER';
  status: 'Normal Operations' | 'High Volume' | 'Severe Surge' | 'Diversion';
  availableBeds: number;
  icuBedsAvailable: number;
  traumaBaysReady: number;
  specializedServices: string[];
  latitude: number;
  longitude: number;
  divertStatus: boolean;
}

export interface EmergencyMessage {
  id: string;
  senderRole: 'patient' | 'doctor' | 'paramedic' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  urgent?: boolean;
}

export interface NotificationLog {
  id: string;
  contactName: string;
  phone: string;
  channel: 'SMS' | 'WhatsApp' | 'Automated Call';
  status: 'delivered' | 'transmitted' | 'pending';
  message: string;
  timestamp: string;
}

export interface SOSTicket {
  id: string;
  createdAt: string;
  category: EmergencyCategory;
  categoryLabel: string;
  status: SOSStatus;
  triageLevel: TriageLevel;
  patientLocation: LocationCoords;
  notes: string;
  patientData: Partial<PatientProfile>;
  assignedAmbulanceId?: string;
  assignedHospitalId?: string;
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    spO2?: number;
    respiratoryRate?: number;
    temperatureC?: number;
  };
  messages: EmergencyMessage[];
  notificationsSent: NotificationLog[];
}
