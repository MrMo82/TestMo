
import React, { useState } from 'react';
import { ProjectSettings, SystemUrlEntry } from '../types';
import { X, Save, Settings, Database, Globe, Tag, Plus, Trash2 } from 'lucide-react';
import { listContextProfiles, getContextProfile } from '../services/contextProfileService';
import { GENERAL_CONTEXT_PROFILE_ID } from '../data/hays/contextProfile';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: ProjectSettings) => void;
  initialSettings: ProjectSettings | null;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [settings, setSettings] = useState<ProjectSettings>(initialSettings || {
    projectName: 'Neues Projekt',
    description: '',
    systems: '',
    urls: '',
    releaseVersion: '',
    qaInstruction: '',
    strictQAContract: true,
    artifactModeDefault: 'auto',
    contextProfileId: GENERAL_CONTEXT_PROFILE_ID,
    selectedSystems: [],
    otherSystems: [],
    selectedProcesses: [],
    selectedEvidenceTypes: [],
    systemUrls: [],
    forbiddenTerms: [],
  });
  const [newOtherSystem, setNewOtherSystem] = useState('');

  if (!isOpen) return null;

  const activeProfile = getContextProfile(settings.contextProfileId);
  const profileSystems = activeProfile?.systems.map(s => s.label) || [];
  const profileProcesses = activeProfile?.processes.map(p => p.label) || [];
  const profileEvidence = activeProfile?.evidenceTypes || [];
  const dictionaryVersions = activeProfile?.dataDictionaryVersions || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
    onClose();
  };

  const toggleListValue = (field: 'selectedSystems' | 'selectedProcesses' | 'selectedEvidenceTypes', value: string) => {
    setSettings(prev => {
      const current = prev[field] || [];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  const addOtherSystem = () => {
    const value = newOtherSystem.trim();
    if (!value) return;
    setSettings(prev => ({ ...prev, otherSystems: [...(prev.otherSystems || []), value] }));
    setNewOtherSystem('');
  };

  const removeOtherSystem = (value: string) => {
    setSettings(prev => ({ ...prev, otherSystems: (prev.otherSystems || []).filter(v => v !== value) }));
  };

  const addUrlEntry = () => {
    const entry: SystemUrlEntry = { id: `url-${Date.now()}`, environment: '', system: '', url: '', purpose: '', status: 'active', note: '' };
    setSettings(prev => ({ ...prev, systemUrls: [...(prev.systemUrls || []), entry] }));
  };

  const updateUrlEntry = (id: string, field: keyof SystemUrlEntry, value: string) => {
    setSettings(prev => ({
      ...prev,
      systemUrls: (prev.systemUrls || []).map(entry => entry.id === id ? { ...entry, [field]: value } : entry),
    }));
  };

  const removeUrlEntry = (id: string) => {
    setSettings(prev => ({ ...prev, systemUrls: (prev.systemUrls || []).filter(entry => entry.id !== id) }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white sticky top-0 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings size={20} /> Projekt Konfiguration
          </h2>
          {initialSettings && (
             <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full"><X size={20} /></button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
            Diese Infos helfen der KI, den Kontext deiner Tests zu verstehen (Systeme, URLs, Release-Versionen, Kontextprofil).
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Projekt Name</label>
            <input 
              required
              className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={settings.projectName}
              onChange={e => setSettings({...settings, projectName: e.target.value})}
              placeholder="z.B. Importtool-Ablösung"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                   <Tag size={14} /> Release
               </label>
               <input 
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                value={settings.releaseVersion}
                onChange={e => setSettings({...settings, releaseVersion: e.target.value})}
                placeholder="z.B. IRIS 3.02.03 PF"
              />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                   <Tag size={14} /> Fix Version
               </label>
               <input 
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                value={settings.fixVersion || ''}
                onChange={e => setSettings({...settings, fixVersion: e.target.value})}
                placeholder="optional, falls von Release getrennt"
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Kontextprofil</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organisation / Kontextprofil</label>
              <select
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings.contextProfileId || GENERAL_CONTEXT_PROFILE_ID}
                onChange={e => setSettings({ ...settings, contextProfileId: e.target.value, selectedSystems: [], selectedProcesses: [], selectedEvidenceTypes: [] })}
              >
                {listContextProfiles().map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
              </select>
            </div>
            {dictionaryVersions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data-Dictionary-Version</label>
                <select
                  className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={settings.dataDictionaryVersion || dictionaryVersions[0]}
                  onChange={e => setSettings({ ...settings, dataDictionaryVersion: e.target.value })}
                >
                  {dictionaryVersions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}
            {profileProcesses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Freigegebene Bewerbungswege / Prozesse</label>
                <div className="flex flex-wrap gap-2">
                  {profileProcesses.map(process => (
                    <button type="button" key={process} onClick={() => toggleListValue('selectedProcesses', process)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${(settings.selectedProcesses || []).includes(process) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-600'}`}>
                      {process}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {profileEvidence.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Evidence-Anforderungen</label>
                <div className="flex flex-wrap gap-2">
                  {profileEvidence.map(item => (
                    <button type="button" key={item} onClick={() => toggleListValue('selectedEvidenceTypes', item)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${(settings.selectedEvidenceTypes || []).includes(item) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-600'}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1"><Database size={14} /> Systeme</h3>
            {profileSystems.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profileSystems.map(system => (
                  <button type="button" key={system} onClick={() => toggleListValue('selectedSystems', system)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${(settings.selectedSystems || []).includes(system) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-600'}`}>
                    {system}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="flex-1 p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500"
                placeholder="Weiteres System hinzufügen..."
                value={newOtherSystem}
                onChange={e => setNewOtherSystem(e.target.value)}
              />
              <button type="button" onClick={addOtherSystem} className="px-3 py-2 bg-slate-800 text-white rounded text-sm flex items-center gap-1"><Plus size={14} /> Hinzufügen</button>
            </div>
            {(settings.otherSystems || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(settings.otherSystems || []).map(system => (
                  <span key={system} className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs">
                    {system}
                    <button type="button" onClick={() => removeOtherSystem(system)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Legacy: Systeme (Komma getrennt, weiterhin unterstützt)</label>
              <input
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={settings.systems}
                onChange={e => setSettings({...settings, systems: e.target.value})}
                placeholder="IRIS, Daxtra Capture, ..."
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1"><Globe size={14} /> URLs (Environment-/System-Matrix)</h3>
            {(settings.systemUrls || []).map(entry => (
              <div key={entry.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded">
                <input className="col-span-2 p-1.5 border border-slate-200 rounded text-xs" placeholder="Environment" value={entry.environment} onChange={e => updateUrlEntry(entry.id, 'environment', e.target.value)} />
                <input className="col-span-2 p-1.5 border border-slate-200 rounded text-xs" placeholder="System" value={entry.system} onChange={e => updateUrlEntry(entry.id, 'system', e.target.value)} />
                <input className="col-span-3 p-1.5 border border-slate-200 rounded text-xs" placeholder="URL" value={entry.url} onChange={e => updateUrlEntry(entry.id, 'url', e.target.value)} />
                <input className="col-span-2 p-1.5 border border-slate-200 rounded text-xs" placeholder="Zweck" value={entry.purpose || ''} onChange={e => updateUrlEntry(entry.id, 'purpose', e.target.value)} />
                <select className="col-span-2 p-1.5 border border-slate-200 rounded text-xs" value={entry.status || 'active'} onChange={e => updateUrlEntry(entry.id, 'status', e.target.value)}>
                  <option value="active">aktiv</option>
                  <option value="inactive">inaktiv</option>
                  <option value="planned">geplant</option>
                </select>
                <button type="button" onClick={() => removeUrlEntry(entry.id)} className="col-span-1 text-red-500 flex justify-center"><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" onClick={addUrlEntry} className="text-xs text-blue-600 flex items-center gap-1"><Plus size={14} /> URL-Eintrag hinzufügen</button>
            <p className="text-xs text-slate-400">Keine Zugangsdaten oder Secrets in URLs speichern.</p>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Legacy: URLs (Komma getrennt, weiterhin unterstützt)</label>
              <input
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={settings.urls}
                onChange={e => setSettings({...settings, urls: e.target.value})}
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

          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">QA Governance</h3>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.strictQAContract ?? true}
                onChange={e => setSettings({ ...settings, strictQAContract: e.target.checked })}
              />
              Strikten QA-Contract anwenden (Draft-first bei unklarer Spezifikation)
            </label>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Standard Artefaktmodus</label>
              <select
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={settings.artifactModeDefault || 'auto'}
                onChange={e => setSettings({ ...settings, artifactModeDefault: e.target.value as ProjectSettings['artifactModeDefault'] })}
              >
                <option value="auto">Auto (Readiness-basiert)</option>
                <option value="testcase">Ausführbarer Testfall</option>
                <option value="draft_backlog">Draft-Szenario-Backlog</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Verbotene / zu ersetzende Begriffe (Komma getrennt)</label>
              <input
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={(settings.forbiddenTerms || []).join(', ')}
                onChange={e => setSettings({ ...settings, forbiddenTerms: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })}
                placeholder="z.B. ATS, Candidate Record"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Custom QA-Instruction (optional)</label>
              <textarea
                className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-y font-mono text-xs"
                value={settings.qaInstruction || ''}
                onChange={e => setSettings({ ...settings, qaInstruction: e.target.value })}
                maxLength={8000}
                placeholder="Optional: eigener QA Output Contract / Projektvorgaben"
              />
              <p className="text-xs text-slate-500 mt-1">Wenn leer, verwendet die App einen kompakten Standard-Contract. Limit: 8000 Zeichen.</p>
            </div>
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
