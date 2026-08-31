import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProject, updateProject, type UpdateProjectInput } from '../services/projectService';
import type { Project } from '../types';

const intakeLabels = ['Basics', 'Scope', 'Qualität', 'Quellen'];
const emptyProject: UpdateProjectInput = {};

const ProjectOverviewPage: React.FC = () => {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [form, setForm] = useState<UpdateProjectInput>(emptyProject);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const loadedProject = await getProject(projectId);
        if (!active) return;
        setProject(loadedProject);
        setStep(loadedProject.intakeStep);
        setForm(loadedProject);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Projekt konnte nicht geladen werden.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [projectId]);

  const updateField = (field: keyof UpdateProjectInput, value: string) => {
    setForm(previous => ({ ...previous, [field]: value }));
    setSaved(false);
  };

  const saveStep = async (nextStep: 1 | 2 | 3 | 4 = step) => {
    setSaving(true);
    setError('');
    try {
      const updatedProject = await updateProject(projectId, { ...form, intakeStep: nextStep });
      setProject(updatedProject);
      setForm(updatedProject);
      setStep(nextStep);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Projekt konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Projekt wird geladen...</div>;
  if (!project) return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Projekt nicht gefunden.'}</div>;

  const field = (name: keyof UpdateProjectInput, label: string, placeholder = '') => (
    <div>
      <label htmlFor={`project-${String(name)}`} className="mb-1 block text-sm font-medium">{label}</label>
      <textarea id={`project-${String(name)}`} value={String(form[name] || '')} onChange={event => updateField(name, event.target.value)} placeholder={placeholder} rows={4} className="w-full rounded-lg border border-slate-300 p-3 text-sm dark:border-slate-600 dark:bg-slate-800" />
    </div>
  );

  return (
    <section className="space-y-6">
      <button type="button" onClick={() => navigate('/projects')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><ArrowLeft size={16} /> Zur Projektliste</button>
      <header>
        <span className="font-mono text-xs text-slate-400">{project.projectKey}</span>
        <h2 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{project.name}</h2>
        <p className="mt-1 text-sm text-slate-500">Projektintake als Entwurf. Unvollständige Angaben sind nicht testbereit.</p>
      </header>

      <nav aria-label="Projektintake" className="grid grid-cols-4 gap-2">
        {intakeLabels.map((label, index) => {
          const intakeStep = (index + 1) as 1 | 2 | 3 | 4;
          return <button key={label} type="button" onClick={() => setStep(intakeStep)} className={`rounded-lg border p-3 text-left text-sm ${step === intakeStep ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}><span className="block text-xs font-bold">0{intakeStep}</span>{label}</button>;
        })}
      </nav>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saved && <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"><Check size={16} /> Entwurf gespeichert.</div>}

      <form onSubmit={event => { event.preventDefault(); void saveStep(); }} className="glass-panel space-y-5 rounded-xl border border-slate-200 p-6 shadow-sm dark:border-slate-700">
        {step === 1 && <div className="grid gap-5 md:grid-cols-2">{field('description', 'Beschreibung', 'Worum geht es in diesem Projekt?')}{field('goal', 'Testziel', 'Welche Qualität soll nachgewiesen werden?')}{field('testObject', 'Testobjekt', 'Welche Anwendung oder welcher Prozess wird getestet?')}{field('release', 'Release', 'Release oder Version')}</div>}
        {step === 2 && <div className="grid gap-5 md:grid-cols-2">{field('inScope', 'In Scope', 'Prozesse, Funktionen und Systeme im Scope')}{field('outOfScope', 'Out of Scope', 'Bewusst ausgeschlossene Bereiche')}{field('unchangedProcesses', 'Unveränderte Prozesse')}{field('knownInterfaces', 'Bekannte Schnittstellen')}{field('systems', 'Systeme')}{field('channels', 'Kanäle')}</div>}
        {step === 3 && <div className="grid gap-5 md:grid-cols-2">{field('knownRisks', 'Bekannte Risiken')}{field('compliancePrivacy', 'Compliance und Datenschutz')}{field('entryCriteria', 'Entry-Kriterien')}{field('exitCriteria', 'Exit-Kriterien')}{field('goLiveCriteria', 'Go-Live-Kriterien')}</div>}
        {step === 4 && <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">Quellen werden im nächsten PR projektbezogen über Supabase Storage verwaltet. Der Intake kann bereits als Entwurf gespeichert werden.</div>}
        <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
          <button type="button" disabled={step === 1} onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)} className="rounded-lg px-4 py-2 text-sm text-slate-600 disabled:opacity-40 dark:text-slate-300">Zurück</button>
          <div className="flex gap-2"><button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />} Entwurf speichern</button>{step < 4 && <button type="button" disabled={saving} onClick={() => void saveStep((step + 1) as 1 | 2 | 3 | 4)} className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-800 dark:text-blue-300">Speichern und weiter</button>}</div>
        </div>
      </form>
    </section>
  );
};

export default ProjectOverviewPage;
