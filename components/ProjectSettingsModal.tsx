
import React, { useState } from 'react';
import { ProjectSettings } from '../types';
import { X, Save, Settings, Database, Globe, Tag } from 'lucide-react';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: ProjectSettings) => void;
  initialSettings: ProjectSettings | null;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [settings, setSettings] = useState<ProjectSettings>(initialSettings || {
    projectName: 'CMP Schweiz',
    description: '',
    systems: '',
    urls: '',
    releaseVersion: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in-up">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings size={20} /> Projekt Konfiguration
          </h2>
          {initialSettings && (
             <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full"><X size={20} /></button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
            Diese Infos helfen der KI, den Kontext deiner Tests zu verstehen (Systemnamen, URLs, Release-Versionen).
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Projekt Name</label>
            <input 
              required
              className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={settings.projectName}
              onChange={e => setSettings({...settings, projectName: e.target.value})}
              placeholder="z.B. CMP Schweiz"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                 <Tag size={14} /> Aktuelles Release / Fix Version
             </label>
             <input 
              className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
              value={settings.releaseVersion}
              onChange={e => setSettings({...settings, releaseVersion: e.target.value})}
              placeholder="z.B. IRIS 3.02.03 PF"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Database size={14} /> Systeme (Komma getrennt)
                </label>
                <input 
                  className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={settings.systems}
                  onChange={e => setSettings({...settings, systems: e.target.value})}
                  placeholder="IRIS, Salesforce, Daxtra"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Globe size={14} /> URLs (Komma getrennt)
                </label>
                <input 
                  className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={settings.urls}
                  onChange={e => setSettings({...settings, urls: e.target.value})}
                  placeholder="www.hays.ch, ..."
                />
             </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Projekt Beschreibung</label>
            <textarea 
              className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
              value={settings.description}
              onChange={e => setSettings({...settings, description: e.target.value})}
              placeholder="Kurze Beschreibung des Scopes..."
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold shadow-md transition-colors flex justify-center items-center gap-2"
          >
            <Save size={18} /> Einstellungen Speichern
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectSettingsModal;
