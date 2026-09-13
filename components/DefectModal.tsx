
import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Bug, AlertTriangle, FileText, Server, Tag, Download, Save } from 'lucide-react';
import { DefectReport } from '../services/geminiService';
import { DefectContext, createDefectTicket, formatDefectTicketMarkdown } from '../services/defectService';
import { storageService } from '../services/storageService';

interface DefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defectData: DefectReport | null;
  isLoading: boolean;
    defectContext?: DefectContext;
}

const DefectModal: React.FC<DefectModalProps> = ({ isOpen, onClose, defectData, isLoading, defectContext }) => {
  const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
  const [environment, setEnvironment] = useState('QA');
  const [category, setCategory] = useState('Bug:Code');
    const [draft, setDraft] = useState<DefectReport | null>(null);

    useEffect(() => {
        if (defectData) {
            setDraft({ ...defectData });
            setEnvironment(defectData.environment || 'QA');
            setCategory(defectData.category || 'Bug:Code');
            setSaved(false);
        }
    }, [defectData]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!draft) return;

    const textToCopy = `
Titel: ${draft.title}
Environment: ${environment}
Category: ${category}
Schweregrad: ${draft.severity}

Beschreibung:
${draft.description}

Schritte zur Reproduktion:
${draft.stepsToReproduce}

Erwartet vs. Tatsächlich:
${draft.expectedVsActual}
    `;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

    const createTicket = () => draft ? createDefectTicket({ ...draft, environment, category }, defectContext) : null;

    const handleSave = () => {
        const ticket = createTicket();
        if (!ticket) return;
        storageService.saveDefect(ticket);
        setSaved(true);
    };

    const handleDownload = (format: 'json' | 'md') => {
        const ticket = createTicket();
        if (!ticket) return;
        const content = format === 'json' ? JSON.stringify(ticket, null, 2) : formatDefectTicketMarkdown(ticket);
        const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${ticket.id}.${format}`;
        link.click();
        URL.revokeObjectURL(url);
    };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in-up border border-slate-200">
        
        {/* Header */}
        <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <Bug size={20} />
                Fehlerbericht erstellen (KI)
            </h2>
            <button onClick={onClose} className="text-red-400 hover:text-red-700 transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600 mb-4"></div>
                    <p>Analysiere Fehlerursache & generiere Report...</p>
                </div>
            ) : draft ? (
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Titel</label>
                        <div className="font-semibold text-slate-800 flex justify-between items-start gap-3">
                             <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full bg-transparent border-b border-slate-300 outline-none" />
                             <span className={`text-xs px-2 py-1 rounded font-bold ${
                                 draft.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                 draft.severity === 'Major' ? 'bg-orange-100 text-orange-700' :
                                 'bg-blue-100 text-blue-700'
                             }`}>
                                 {draft.severity}
                             </span>
                        </div>
                    </div>
                    
                    {/* Hays Specific Dropdowns */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                                <Server size={14} /> Umgebung
                             </label>
                             <select 
                                value={environment}
                                onChange={(e) => setEnvironment(e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500 bg-white"
                             >
                                 <option value="QA">QA</option>
                                 <option value="UAT">UAT</option>
                                 <option value="PreProd">PreProd</option>
                                 <option value="Prod">Prod</option>
                             </select>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                                <Tag size={14} /> Kategorie
                             </label>
                             <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-500 bg-white"
                             >
                                 <option value="Bug:Code">Bug:Code</option>
                                 <option value="Bug:Data">Bug:Data</option>
                                 <option value="Bug:Invalid">Bug:Invalid</option>
                                 <option value="Bug:Infrastructure">Bug:Infrastructure</option>
                                 <option value="Bug:UI-WIP">Bug:UI-WIP</option>
                             </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                <FileText size={14} /> Beschreibung
                            </label>
                            <textarea 
                                className="w-full h-32 p-3 text-sm bg-white border border-slate-200 rounded resize-none focus:outline-none focus:border-blue-500"
                                value={draft.description}
                                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                <AlertTriangle size={14} /> Erwartet vs. Tatsächlich
                            </label>
                            <textarea 
                                className="w-full h-32 p-3 text-sm bg-white border border-slate-200 rounded resize-none focus:outline-none focus:border-blue-500"
                                value={draft.expectedVsActual}
                                onChange={(e) => setDraft({ ...draft, expectedVsActual: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Schritte zur Reproduktion</label>
                        <textarea value={draft.stepsToReproduce} onChange={(e) => setDraft({ ...draft, stepsToReproduce: e.target.value })} className="w-full min-h-24 p-3 bg-white border border-slate-200 rounded text-sm text-slate-700 resize-y outline-none focus:border-blue-500" />
                    </div>

                    <div className="pt-4 flex flex-wrap justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                            Schließen
                        </button>
                        <button 
                            onClick={handleCopy}
                            className={`px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-all ${
                                copied ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'Kopiert!' : 'In Zwischenablage kopieren'}
                        </button>
                        <button onClick={() => handleDownload('md')} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-2" title="Als Markdown herunterladen"><Download size={16} /> MD</button>
                        <button onClick={() => handleDownload('json')} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-2" title="Als JSON herunterladen"><Download size={16} /> JSON</button>
                        <button onClick={handleSave} className={`px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 ${saved ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}><Save size={18} /> {saved ? 'Gespeichert' : 'Ticket speichern'}</button>
                    </div>
                </div>
            ) : (
                <div className="text-center text-red-500">
                    Fehler beim Generieren des Reports.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DefectModal;
