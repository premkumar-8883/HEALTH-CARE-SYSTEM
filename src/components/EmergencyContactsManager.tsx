import React, { useState } from 'react';
import { 
  Users, 
  Phone, 
  MessageSquare, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Bell, 
  ShieldAlert, 
  Send, 
  ExternalLink, 
  AlertCircle, 
  Clock
} from 'lucide-react';
import { EmergencyContact, NotificationLog, SOSTicket } from '../types';
import { EMERGENCY_HOTLINES } from '../data/mockData';

interface EmergencyContactsManagerProps {
  contacts: EmergencyContact[];
  notificationsLog: NotificationLog[];
  activeTicket: SOSTicket | null;
  onUpdateContacts: (contacts: EmergencyContact[]) => void;
  onSendManualAlert: (contactId: string) => void;
}

export const EmergencyContactsManager: React.FC<EmergencyContactsManagerProps> = ({
  contacts,
  notificationsLog,
  activeTicket,
  onUpdateContacts,
  onSendManualAlert,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [autoNotify, setAutoNotify] = useState(true);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newContact: EmergencyContact = {
      id: 'c_' + Date.now(),
      name: newName.trim(),
      relationship: newRelation.trim() || 'Relative',
      phone: newPhone.trim(),
      isPrimary: contacts.length === 0,
      autoNotifyOnSOS: autoNotify,
    };

    onUpdateContacts([...contacts, newContact]);
    setNewName('');
    setNewRelation('');
    setNewPhone('');
    setIsAdding(false);
  };

  const handleRemoveContact = (id: string) => {
    onUpdateContacts(contacts.filter(c => c.id !== id));
  };

  const handleToggleAutoNotify = (id: string) => {
    onUpdateContacts(
      contacts.map(c => c.id === id ? { ...c, autoNotifyOnSOS: !c.autoNotifyOnSOS } : c)
    );
  };

  const handleSetPrimary = (id: string) => {
    onUpdateContacts(
      contacts.map(c => ({ ...c, isPrimary: c.id === id }))
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Emergency Contacts & Automatic Notification</span>
            </h3>
            <p className="text-xs text-slate-400">
              Designated family, caregivers and primary physicians notified instantly on SOS
            </p>
          </div>
        </div>

        <button
          id="add-contact-btn"
          onClick={() => setIsAdding(!isAdding)}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAdding ? 'Close Form' : 'Add Emergency Contact'}</span>
        </button>
      </div>

      {/* Add Contact Form Modal/Drawer */}
      {isAdding && (
        <form onSubmit={handleAddContact} className="mt-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 animate-in slide-in-from-top-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Add New Emergency Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Maria Gonzalez"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Relationship</label>
              <input
                type="text"
                placeholder="e.g. Spouse / Parent / Doctor"
                value={newRelation}
                onChange={(e) => setNewRelation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Phone Number (with country code)</label>
              <input
                type="tel"
                placeholder="e.g. +1 (555) 019-2831"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-800">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoNotify}
                onChange={(e) => setAutoNotify(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span>Enable automatic SMS broadcast when SOS is triggered</span>
            </label>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition-transform active:scale-95"
            >
              Save Contact
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            id={`contact-${contact.id}`}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              contact.isPrimary
                ? 'bg-amber-950/20 border-amber-800/80 ring-1 ring-amber-700/50'
                : 'bg-slate-950/70 border-slate-800/80'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-white text-sm">{contact.name}</h4>
                    {contact.isPrimary && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-600 text-white">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{contact.relationship}</p>
                  <p className="text-xs font-mono text-slate-200 mt-1">{contact.phone}</p>
                </div>

                <div className="flex items-center space-x-1">
                  <a
                    href={`tel:${contact.phone}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors"
                    title={`Call ${contact.name}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`sms:${contact.phone}?body=${encodeURIComponent("EMERGENCY: Medical assistance requested. Please check my live status.")}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white transition-colors"
                    title={`SMS ${contact.name}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleRemoveContact(contact.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleToggleAutoNotify(contact.id)}
                className={`flex items-center space-x-1.5 text-[11px] ${
                  contact.autoNotifyOnSOS ? 'text-amber-400 font-semibold' : 'text-slate-500'
                }`}
              >
                <Bell className="w-3 h-3" />
                <span>{contact.autoNotifyOnSOS ? 'Auto-SOS Alert: ON' : 'Auto-SOS Alert: OFF'}</span>
              </button>

              {!contact.isPrimary && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(contact.id)}
                  className="text-[11px] text-slate-400 hover:text-white underline"
                >
                  Make Primary
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Live SOS Emergency Notification Dispatch Audit Trail */}
      {notificationsLog.length > 0 && (
        <div className="mt-6 bg-slate-950 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Automated SOS Notification Log</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Real-time SMS & WhatsApp Telemetry
            </span>
          </div>

          <div className="space-y-2">
            {notificationsLog.map((log) => (
              <div
                key={log.id}
                className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start space-x-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    {log.channel}
                  </span>
                  <div>
                    <p className="text-slate-200 font-medium">
                      To: <span className="text-white font-bold">{log.contactName}</span> ({log.phone})
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                      "{log.message}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-slate-400 self-end sm:self-auto shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/80">
                    {log.status.toUpperCase()}
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Emergency Hotlines Quick Guide */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Direct Regional Medical Lines & Lifelines
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {EMERGENCY_HOTLINES.map((hotline, idx) => (
            <a
              key={idx}
              href={`tel:${hotline.number}`}
              className="bg-slate-950/80 hover:bg-slate-800 border border-slate-800/90 hover:border-slate-700 p-2.5 rounded-xl transition-all block text-center"
            >
              <span className="text-sm font-black text-red-400 block">{hotline.number}</span>
              <span className="text-[11px] font-bold text-slate-200 block truncate mt-0.5">{hotline.name}</span>
              <span className="text-[9px] text-slate-400 block truncate">{hotline.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
