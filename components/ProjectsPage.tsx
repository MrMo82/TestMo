import React, { useEffect, useMemo, useState } from 'react';
import { FolderKanban, Loader2, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createProject, listProjects, type CreateProjectInput } from '../services/projectService';
import { upsertProjectContextSelection } from '../services/projectContextSelectionService';
import { listContextProfiles, getContextProfile, listControlledValueSets } from '../services/contextProfileService';
import { GENERAL_CONTEXT_PROFILE_ID, PROJECT_TYPES } from '../data/hays/contextProfile';
import type { Project } from '../types';

const emptyForm: CreateProjectInput = {
  projectKey: '',
  name: '',
  description: '',
  goal: '',
  testObject: '',
  release: '',
};

interface ContextForm {
  contextProfileId: string;
  projectType: string;
  dataDictionaryVersion: string;
  selectedEnvironments: string[];
  selectedSystems: string[];
  selectedProcesses: string[];
  selectedEvidenceTypes: string[];
  businessOwner: string;
  technicalOwner: string;
  strictQaContract: boolean;
  defaultArtifactMode: 'auto' | 'testcase' | 'draft_backlog';
  customQaInstruction: string;
}

const emptyContextForm: ContextForm = {
  contextProfileId: GENERAL_CONTEXT_PROFILE_ID,
  projectType: '',
  dataDictionaryVersion: '',
  selectedEnvironments: [],
  selectedSystems: [],
  selectedProcesses: [],
  selectedEvidenceTypes: [],
  businessOwner: '',
  technicalOwner: '',
  strictQaContract: true,
  defaultArtifactMode: 'auto',
  customQaInstruction: '',
};

const MultiSelectGroup: React.FC<{ label: string; options: string[]; selected: string[]; onChange: (next: string[]) => void }> = ({ label, options, selected, onChange }) => {
  if (options.length === 0) return null;
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };
  return (
    <div className="md:col-span-2">
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            type="button"
            key={option}
            onClick={() => toggle(option)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${selected.includes(option) ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-600 hover:border-blue-400 dark:border-slate-600 dark:text-slate-300'}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<CreateProjectInput>(emptyForm);
  const [contextForm, setContextForm] = useState<ContextForm>(emptyContextForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [contextSwitchWarning, setContextSwitchWarning] = useState('');

  const contextProfiles = listContextProfiles();
  const activeProfile = getContextProfile(contextForm.contextProfileId);

  const environmentOptions = useMemo(() => listControlledValueSets(contextForm.contextProfileId).find(set => set.key === 'ENVIRONMENT')?.values || [], [contextForm.contextProfileId]);
  const evidenceOptions = activeProfile?.evidenceTypes || [];
  const systemOptions = activeProfile?.systems.map(s => s.label) || [];
  const processOptions = activeProfile?.processes.map(p => p.label) || [];
  const dictionaryVersionOptions = activeProfile?.dataDictionaryVersions || [];

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      setProjects(await listProjects());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Projekte konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const updateField = (field: keyof CreateProjectInput, value: string) => {
    setForm(previous => ({ ...previous, [field]: field === 'projectKey' ? value.toUpperCase() : value }));
  };

  const updateContextField = <K extends keyof ContextForm>(field: K, value: ContextForm[K]) => {
    setContextForm(previous => ({ ...previous, [field]: value }));
  };

  const handleContextProfileChange = (nextProfileId: string) => {
    const hasSelections = contextForm.selectedSystems.length > 0 || contextForm.selectedProcesses.length > 0 || contextForm.selectedEvidenceTypes.length > 0;
    if (hasSelections && nextProfileId !== contextForm.contextProfileId) {
      setContextSwitchWarning('Achtung: Ein Wechsel des Kontextprofils setzt Systeme, Prozesse und Evidence-Auswahl zurueck, da diese vom vorherigen Profil abhingen.');
    } else {
      setContextSwitchWarning('');
    }
    const nextProfile = getContextProfile(nextProfileId);
    setContextForm(previous => ({
      ...previous,
      contextProfileId: nextProfileId,
      dataDictionaryVersion: nextProfile?.dataDictionaryVersions[0] || '',
      selectedSystems: [],
      selectedProcesses: [],
      selectedEvidenceTypes: [],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const project = await createProject(form);
      if (contextForm.contextProfileId !== GENERAL_CONTEXT_PROFILE_ID || contextForm.projectType) {
        await upsertProjectContextSelection(project.id, {
          contextProfileId: contextForm.contextProfileId,
          projectType: contextForm.projectType || null,
          dataDictionaryVersion: contextForm.dataDictionaryVersion || null,
          selectedEnvironments: contextForm.selectedEnvironments,
          selectedSystems: contextForm.selectedSystems,
          selectedProcesses: contextForm.selectedProcesses,
          selectedEvidenceTypes: contextForm.selectedEvidenceTypes,
          businessOwner: contextForm.businessOwner || null,
          technicalOwner: contextForm.technicalOwner || null,
          strictQaContract: contextForm.strictQaContract,
          defaultArtifactMode: contextForm.defaultArtifactMode,
          customQaInstruction: contextForm.customQaInstruction || null,
        });
      }
      setForm(emptyForm);
      setContextForm(emptyContextForm);
      setContextSwitchWarning('');
      setShowForm(false);
      await loadProjects();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Projekt konnte nicht angelegt werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Arbeitsbereiche</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">Projekte</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Projektzugriff wird durch Supabase Memberships begrenzt.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void loadProjects()} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" title="Projekte aktualisieren" aria-label="Projekte aktualisieren">
            <RefreshCw size={18} />
          </button>
          <button type="button" onClick={() => setShowForm(value => !value)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus size={18} /> Neues Projekt
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-panel grid gap-4 rounded-xl border border-slate-200 p-6 shadow-sm dark:border-slate-700 md:grid-cols-2">
          <h3 className="md:col-span-2 text-xs font-bold uppercase tracking-wider text-slate-400">Projektstammdaten</h3>
          <div>
            <label htmlFor="project-key" className="mb-1 block text-sm font-medium">Projekt-Key</label>
            <input id="project-key" required pattern="[A-Z][A-Z0-9_-]{1,31}" value={form.projectKey} onChange={event => updateField('projectKey', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800" placeholder="ITR" />
          </div>
          <div>
            <label htmlFor="project-name" className="mb-1 block text-sm font-medium">Projektname</label>
            <input id="project-name" required value={form.name} onChange={event => updateField('name', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800" placeholder="Importtool-Ablösung" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="project-description" className="mb-1 block text-sm font-medium">Beschreibung</label>
            <textarea id="project-description" value={form.description} onChange={event => updateField('description', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800" rows={2} />
          </div>
          <div>
            <label htmlFor="project-goal" className="mb-1 block text-sm font-medium">Testziel</label>
            <input id="project-goal" value={form.goal} onChange={event => updateField('goal', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800" />
          </div>
          <div>
            <label htmlFor="project-object" className="mb-1 block text-sm font-medium">Testobjekt</label>
            <input id="project-object" value={form.testObject} onChange={event => updateField('testObject', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800" />
          </div>
          <div>
            <label htmlFor="project-release" className="mb-1 block text-sm font-medium">Release</label>
            <input id="project-release" value={form.release} onChange={event => updateField('release', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800" />
          </div>

          <h3 className="md:col-span-2 mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Organisation &amp; Kontext</h3>

          {contextSwitchWarning && (
            <div className="md:col-span-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {contextSwitchWarning}
            </div>
          )}

          <div>
            <label htmlFor="project-context-profile" className="mb-1 block text-sm font-medium">Organisation / Kontextprofil</label>
            <select id="project-context-profile" value={contextForm.contextProfileId} onChange={event => handleContextProfileChange(event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800">
              {contextProfiles.map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="project-type" className="mb-1 block text-sm font-medium">Projekttyp</label>
            <select id="project-type" value={contextForm.projectType} onChange={event => updateContextField('projectType', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800">
              <option value="">-- Bitte wählen --</option>
              {PROJECT_TYPES.filter(pt => pt.contextProfileId === contextForm.contextProfileId).map(pt => <option key={pt.key} value={pt.key}>{pt.label}</option>)}
            </select>
          </div>
          {dictionaryVersionOptions.length > 0 && (
            <div>
              <label htmlFor="project-dict-version" className="mb-1 block text-sm font-medium">Data-Dictionary-Version</label>
              <select id="project-dict-version" value={contextForm.dataDictionaryVersion} onChange={event => updateContextField('dataDictionaryVersion', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800">
                {dictionaryVersionOptions.map(version => <option key={version} value={version}>{version}</option>)}
              </select>
            </div>
          )}

          <MultiSelectGroup label="Environment" options={environmentOptions} selected={contextForm.selectedEnvironments} onChange={next => updateContextField('selectedEnvironments', next)} />
          <MultiSelectGroup label="Systeme im Scope" options={systemOptions} selected={contextForm.selectedSystems} onChange={next => updateContextField('selectedSystems', next)} />
          <MultiSelectGroup label="Bewerbungswege / Prozesse" options={processOptions} selected={contextForm.selectedProcesses} onChange={next => updateContextField('selectedProcesses', next)} />
          <MultiSelectGroup label="Evidence-Vorgaben" options={evidenceOptions} selected={contextForm.selectedEvidenceTypes} onChange={next => updateContextField('selectedEvidenceTypes', next)} />

          <div>
            <label htmlFor="project-business-owner" className="mb-1 block text-sm font-medium">Fachlicher Owner</label>
            <input id="project-business-owner" value={contextForm.businessOwner} onChange={event => updateContextField('businessOwner', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800" />
          </div>
          <div>
            <label htmlFor="project-technical-owner" className="mb-1 block text-sm font-medium">Technischer Owner</label>
            <input id="project-technical-owner" value={contextForm.technicalOwner} onChange={event => updateContextField('technicalOwner', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800" />
          </div>

          <h3 className="md:col-span-2 mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">QA Governance</h3>
          <label className="md:col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={contextForm.strictQaContract} onChange={event => updateContextField('strictQaContract', event.target.checked)} />
            Strikten QA-Contract anwenden (Draft-first bei unklarer Spezifikation)
          </label>
          <div>
            <label htmlFor="project-artifact-mode" className="mb-1 block text-sm font-medium">Standard-Artefaktmodus</label>
            <select id="project-artifact-mode" value={contextForm.defaultArtifactMode} onChange={event => updateContextField('defaultArtifactMode', event.target.value as ContextForm['defaultArtifactMode'])} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800">
              <option value="auto">Auto (Readiness-basiert)</option>
              <option value="testcase">Ausführbarer Testfall</option>
              <option value="draft_backlog">Draft-Szenario-Backlog</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="project-custom-instruction" className="mb-1 block text-sm font-medium">Custom QA Instruction (optional)</label>
            <textarea id="project-custom-instruction" value={contextForm.customQaInstruction} onChange={event => updateContextField('customQaInstruction', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 font-mono text-xs dark:border-slate-600 dark:bg-slate-800" rows={3} />
          </div>

          <div className="flex items-end justify-end gap-2 md:col-span-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Abbrechen</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving && <Loader2 size={16} className="animate-spin" />} Projekt speichern
            </button>
          </div>
        </form>
      )}

      {loading ? <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Projekte werden geladen...</div> : projects.length === 0 ? (
        <div className="glass-panel rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <FolderKanban className="mx-auto text-[color:var(--color-action-primary)]" size={36} />
          <h3 className="mt-3 font-semibold text-slate-800 dark:text-slate-100">Erstes Testprojekt anlegen</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Lege ein Projekt mit Systemen, Prozessen und Qualitätsregeln an. Der Projektkontext unterstützt anschließend die Erstellung konsistenter und ausführbarer Testfälle.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => setShowForm(true)} className="rounded-lg bg-[color:var(--color-action-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-action-primary-hover)]">Projekt anlegen</button>
            <a href="/admin/design-system" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">Kontextprofil ansehen</a>
          </div>
          <p className="mx-auto mt-6 max-w-md text-xs text-slate-400">Hays Test Hub unterstützt strukturierte Testplanung, nachvollziehbare Testausführung und belastbare Qualitätsnachweise.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <article key={project.id} role="button" tabIndex={0} onClick={() => navigate(`/projects/${project.id}`)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') navigate(`/projects/${project.id}`); }} className="glass-panel cursor-pointer rounded-xl border border-slate-200 p-5 shadow-sm outline-none hover:border-blue-400 focus:ring-2 focus:ring-blue-500 dark:border-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs text-slate-400">{project.projectKey}</span>
                  <h3 className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{project.name}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{project.status}</span>
              </div>
              <p className="mt-3 min-h-10 text-sm text-slate-600 dark:text-slate-400">{project.description || 'Keine Beschreibung hinterlegt.'}</p>
              <p className="mt-4 text-xs text-slate-400">Release: {project.release || 'Nicht festgelegt'}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProjectsPage;
