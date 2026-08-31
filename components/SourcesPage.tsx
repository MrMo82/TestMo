import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSourceDownloadUrl, listSources, removeSource, uploadSource } from '../services/sourceService';
import type { Source } from '../types';

const SourcesPage: React.FC = () => {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadSources = async () => {
    setLoading(true);
    setError('');
    try {
      setSources(await listSources(projectId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Quellen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadSources(); }, [projectId]);

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Bitte eine Datei auswählen.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await uploadSource(projectId, selectedFile, title || selectedFile.name);
      setSelectedFile(null);
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setNotice('Quelle wurde gespeichert.');
      await loadSources();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (source: Source) => {
    try {
      const url = await createSourceDownloadUrl(source);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Download fehlgeschlagen.');
    }
  };

  const handleDelete = async (source: Source) => {
    if (!window.confirm(`Quelle "${source.title}" wirklich löschen?`)) return;
    setError('');
    try {
      await removeSource(source);
      setSources(previous => previous.filter(item => item.id !== source.id));
      setNotice('Quelle wurde gelöscht.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Quelle konnte nicht gelöscht werden.');
    }
  };

  return (
    <section className="space-y-6">
      <button type="button" onClick={() => navigate(`/projects/${projectId}`)} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Zur Projektübersicht</button>
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Projektquellen</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">Sources</h2>
        <p className="mt-1 text-sm text-slate-500">Dateien werden privat in Supabase Storage gespeichert. Extraktion folgt nach der Review-Grundlage.</p>
      </header>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</div>}

      <form onSubmit={handleUpload} className="glass-panel space-y-4 rounded-xl border border-slate-200 p-6 shadow-sm dark:border-slate-700">
        <div>
          <label htmlFor="source-title" className="mb-1 block text-sm font-medium">Titel</label>
          <input id="source-title" value={title} onChange={event => setTitle(event.target.value)} className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800" placeholder="Fachliche Spezifikation v1" />
        </div>
        <div>
          <label htmlFor="source-file" className="mb-1 block text-sm font-medium">Datei</label>
          <input ref={fileInputRef} id="source-file" type="file" required accept=".docx,.pdf,.xlsx,.csv,.txt,.json,.yaml,.yml,.png,.jpg,.jpeg,.webp" onChange={event => setSelectedFile(event.target.files?.[0] || null)} className="block w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-800" />
          <p className="mt-1 text-xs text-slate-400">DOCX, PDF, XLSX, CSV, TXT, JSON, YAML oder Bild, maximal 20 MB.</p>
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Upload size={16} />{saving && <Loader2 size={16} className="animate-spin" />} Quelle hochladen</button>
      </form>

      <div className="glass-panel overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700">
        <div className="border-b border-slate-200 p-4 dark:border-slate-700"><h3 className="font-semibold text-slate-800 dark:text-slate-100">Quellen ({sources.length})</h3></div>
        {loading ? <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Quellen werden geladen...</div> : sources.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">Noch keine Quelle vorhanden.</div> : <div className="divide-y divide-slate-200 dark:divide-slate-700">{sources.map(source => <div key={source.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><FileText className="shrink-0 text-blue-600" size={20} /><div className="min-w-0"><h4 className="truncate font-medium text-slate-800 dark:text-slate-100">{source.title}</h4><p className="truncate text-xs text-slate-500">{source.originalFileName} · Version {source.version} · {source.approvalStatus} · {source.authorityLevel}</p></div></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => void handleDownload(source)} disabled={!source.storagePath} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800" title="Quelle herunterladen" aria-label="Quelle herunterladen"><Download size={16} /></button><button type="button" onClick={() => void handleDelete(source)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" title="Quelle löschen" aria-label="Quelle löschen"><Trash2 size={16} /></button></div></div>)}</div>}
      </div>
    </section>
  );
};

export default SourcesPage;
