import React, { useEffect, useState } from 'react';
import { FolderKanban, Loader2, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createProject, listProjects, type CreateProjectInput } from '../services/projectService';
import type { Project } from '../types';

const emptyForm: CreateProjectInput = {
  projectKey: '',
  name: '',
  description: '',
  goal: '',
  testObject: '',
  release: '',
};

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<CreateProjectInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createProject(form);
      setForm(emptyForm);
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
          <div>
            <label htmlFor="project-key" className="mb-1 block text-sm font-medium">Projekt-Key</label>
            <input id="project-key" required pattern="[A-Z][A-Z0-9_-]{1,31}" value={form.projectKey} onChange={event => updateField('projectKey', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800" placeholder="PAYMENTS" />
          </div>
          <div>
            <label htmlFor="project-name" className="mb-1 block text-sm font-medium">Projektname</label>
            <input id="project-name" required value={form.name} onChange={event => updateField('name', event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800" placeholder="Payment Platform" />
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
          <FolderKanban className="mx-auto text-slate-400" size={36} />
          <h3 className="mt-3 font-semibold text-slate-800 dark:text-slate-100">Noch keine Projekte</h3>
          <p className="mt-1 text-sm text-slate-500">Lege den ersten Arbeitsbereich an, um den Intake zu starten.</p>
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
