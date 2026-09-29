import React, { useState } from 'react';
import { 
  FileText, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Save, 
  QrCode, 
  Heart, 
  AlertCircle, 
  CheckCircle2, 
  Droplet, 
  Pill, 
  Stethoscope
} from 'lucide-react';
import { PatientProfile } from '../types';

interface PatientHealthPassportProps {
  profile: PatientProfile;
  onSaveProfile: (profile: PatientProfile) => void;
}

export const PatientHealthPassport: React.FC<PatientHealthPassportProps> = ({
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<PatientProfile>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New tag inputs
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const handleSave = () => {
    onSaveProfile(formData);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const togglePrivacy = (key: keyof PatientProfile['privacySettings']) => {
    setFormData(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [key]: !prev.privacySettings[key],
      },
    }));
  };

  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    setFormData(prev => ({
      ...prev,
      allergies: [...prev.allergies, newAllergy.trim()],
    }));
    setNewAllergy('');
  };

  const removeAllergy = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== idx),
    }));
  };

  const addMedication = () => {
    if (!newMedication.trim()) return;
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, newMedication.trim()],
    }));
    setNewMedication('');
  };

  const removeMedication = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== idx),
    }));
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    setFormData(prev => ({
      ...prev,
      chronicConditions: [...prev.chronicConditions, newCondition.trim()],
    }));
    setNewCondition('');
  };

  const removeCondition = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      chronicConditions: prev.chronicConditions.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Patient Emergency Health Passport</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-normal">
                Encrypted On Device
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Critical clinical data transmitted to first responders during SOS activation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}

          <button
            id="qr-passport-btn"
            onClick={() => setShowQRModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title="Lockscreen Responder QR"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Responder QR</span>
          </button>

          <button
            id="edit-passport-btn"
            onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              isEditing
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
            }`}
          >
            {isEditing ? <Save className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Save Passport' : 'Edit Passport'}</span>
          </button>
        </div>
      </div>

      {/* Patient Vital Identity Bar */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Full Legal Name</span>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
            />
          ) : (
            <span className="text-sm font-bold text-white mt-0.5 block">{formData.name}</span>
          )}
        </div>

        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Age & Gender</span>
          {isEditing ? (
            <div className="flex space-x-1 mt-1">
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              />
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as PatientProfile['gender'] })}
                className="w-1/2 bg-slate-900 border border-slate-700 rounded px-1 py-1 text-xs text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          ) : (
            <span className="text-sm font-bold text-white mt-0.5 block">
              {formData.age} yrs • {formData.gender}
            </span>
          )}
        </div>

        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blood Group</span>
            <Droplet className="w-3.5 h-3.5 text-red-500" />
          </div>
          {isEditing ? (
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as PatientProfile['bloodGroup'] })}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-bold"
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          ) : (
            <span className="text-lg font-black text-red-400 mt-0.5 block">{formData.bloodGroup}</span>
          )}
        </div>

        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Organ Donor Status</span>
          {isEditing ? (
            <label className="flex items-center space-x-2 mt-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.organDonor}
                onChange={(e) => setFormData({ ...formData, organDonor: e.target.checked })}
                className="rounded text-purple-600"
              />
              <span className="text-xs text-white">Registered Donor</span>
            </label>
          ) : (
            <span className="text-xs font-bold text-emerald-400 mt-1 block">
              {formData.organDonor ? 'Registered Organ Donor' : 'Not Registered'}
            </span>
          )}
        </div>
      </div>

      {/* Responder Privacy Sharing Controls */}
      <div className="mt-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Emergency Responder Data Sharing Permissions
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Control what medical personnel see during SOS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {[
            { key: 'shareBloodGroup', label: 'Share Blood Group with Paramedics' },
            { key: 'shareAllergies', label: 'Share Critical Drug Allergies' },
            { key: 'shareMedications', label: 'Share Current Medications' },
            { key: 'shareConditions', label: 'Share Chronic Medical History' },
            { key: 'shareInsurance', label: 'Share Emergency Insurance Info' },
            { key: 'autoNotifyContacts', label: 'Auto-Notify Contacts on SOS' },
          ].map((item) => {
            const isShared = formData.privacySettings[item.key as keyof PatientProfile['privacySettings']];
            return (
              <button
                key={item.key}
                id={`toggle-privacy-${item.key}`}
                type="button"
                onClick={() => togglePrivacy(item.key as keyof PatientProfile['privacySettings'])}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-colors ${
                  isShared
                    ? 'bg-slate-900 border-emerald-700/60 text-emerald-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <span className="font-medium text-[11px]">{item.label}</span>
                {isShared ? <Eye className="w-4 h-4 text-emerald-400 shrink-0 ml-1" /> : <EyeOff className="w-4 h-4 text-slate-600 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Allergies, Medications & Chronic Conditions */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Allergies Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Known Allergies</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{formData.allergies.length} recorded</span>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[60px]">
            {formData.allergies.map((allergy, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-lg bg-red-950/60 text-red-300 border border-red-800/80 flex items-center space-x-1"
              >
                <span>{allergy}</span>
                {isEditing && (
                  <button onClick={() => removeAllergy(i)} className="text-red-400 hover:text-white">
                    ×
                  </button>
                )}
              </span>
            ))}
            {formData.allergies.length === 0 && (
              <span className="text-xs text-slate-500 italic">No allergies listed</span>
            )}
          </div>

          {isEditing && (
            <div className="mt-2 flex space-x-1">
              <input
                type="text"
                placeholder="e.g. Latex, Sulfa"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              />
              <button onClick={addAllergy} className="px-2 py-1 bg-slate-800 text-xs text-slate-200 rounded">
                Add
              </button>
            </div>
          )}
        </div>

        {/* Existing Medications Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Pill className="w-3.5 h-3.5" />
              <span>Current Medications</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{formData.medications.length} recorded</span>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[60px]">
            {formData.medications.map((med, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-lg bg-blue-950/60 text-blue-300 border border-blue-800/80 flex items-center space-x-1"
              >
                <span>{med}</span>
                {isEditing && (
                  <button onClick={() => removeMedication(i)} className="text-blue-400 hover:text-white">
                    ×
                  </button>
                )}
              </span>
            ))}
            {formData.medications.length === 0 && (
              <span className="text-xs text-slate-500 italic">No daily medications</span>
            )}
          </div>

          {isEditing && (
            <div className="mt-2 flex space-x-1">
              <input
                type="text"
                placeholder="e.g. Metformin 500mg"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMedication()}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              />
              <button onClick={addMedication} className="px-2 py-1 bg-slate-800 text-xs text-slate-200 rounded">
                Add
              </button>
            </div>
          )}
        </div>

        {/* Chronic Medical Conditions */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Medical Conditions</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{formData.chronicConditions.length} recorded</span>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[60px]">
            {formData.chronicConditions.map((cond, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800/80 flex items-center space-x-1"
              >
                <span>{cond}</span>
                {isEditing && (
                  <button onClick={() => removeCondition(i)} className="text-amber-400 hover:text-white">
                    ×
                  </button>
                )}
              </span>
            ))}
            {formData.chronicConditions.length === 0 && (
              <span className="text-xs text-slate-500 italic">No chronic illnesses</span>
            )}
          </div>

          {isEditing && (
            <div className="mt-2 flex space-x-1">
              <input
                type="text"
                placeholder="e.g. Type 1 Diabetes, Epilepsy"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCondition()}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              />
              <button onClick={addCondition} className="px-2 py-1 bg-slate-800 text-xs text-slate-200 rounded">
                Add
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Lockscreen Responder QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-700 mx-auto flex items-center justify-center text-purple-400 mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">Emergency Responder QR</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Paramedics can scan this optical code to retrieve your critical medical profile directly from your lockscreen.
            </p>

            {/* Stylized QR Code Preview */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
              <div className="w-48 h-48 bg-slate-950 rounded-lg p-2 flex flex-col justify-between items-center relative">
                {/* Corner markers */}
                <div className="w-full flex justify-between">
                  <div className="w-10 h-10 border-4 border-white bg-slate-900 p-1 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white" />
                  </div>
                  <div className="w-10 h-10 border-4 border-white bg-slate-900 p-1 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white" />
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <Heart className="w-8 h-8 text-red-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-white mt-1">EMERGENCY ID</span>
                  <span className="text-[8px] font-mono text-slate-400">MED-PASS-9948</span>
                </div>

                <div className="w-full flex justify-between">
                  <div className="w-10 h-10 border-4 border-white bg-slate-900 p-1 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white" />
                  </div>
                  <div className="text-[8px] font-mono text-slate-400 self-end">
                    Blood: {formData.bloodGroup}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Close QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
