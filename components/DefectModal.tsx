
import React, { useState } from 'react';
import { X, Copy, Check, Bug, AlertTriangle, FileText, Server, Tag } from 'lucide-react';
import { DefectReport } from '../services/geminiService';

interface DefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defectData: DefectReport | null;
  isLoading: boolean;
}

const DefectModal: React.FC<DefectModalProps> = ({ isOpen, onClose, defectData, isLoading }) => {
  const [copied, setCopied] = useState(false);
  const [environment, setEnvironment] = useState('QA');
  const [category, setCategory] = useState('Bug:Code');

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!defectData) return;

    const textToCopy = `
Titel: ${defectData.title}
Environment: ${environment}
Category: ${category}
Schweregrad: ${defectData.severity}

Beschreibung:
${defectData.description}

Schritte zur Reproduktion:
${defectData.stepsToReproduce}

Erwartet vs. Tatsächlich:
${defectData.expectedVsActual}
    `;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            ) : defectData ? (
                <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Titel</label>
                        <div className="font-semibold text-slate-800 flex justify-between items-start">
                             {defectData.title}
                             <span className={`text-xs px-2 py-1 rounded font-bold ${
                                 defectData.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                 defectData.severity === 'Major' ? 'bg-orange-100 text-orange-700' :
                                 'bg-blue-100 text-blue-700'
                             }`}>
                                 {defectData.severity}
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
                                readOnly 
                                className="w-full h-32 p-3 text-sm bg-slate-50 border border-slate-200 rounded resize-none focus:outline-none"
                                value={defectData.description}
                            />
                        </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                                <AlertTriangle size={14} /> Erwartet vs. Tatsächlich
                            </label>
                            <textarea 
                                readOnly 
                                className="w-full h-32 p-3 text-sm bg-slate-50 border border-slate-200 rounded resize-none focus:outline-none"
                                value={defectData.expectedVsActual}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Schritte zur Reproduktion</label>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm whitespace-pre-line text-slate-700">
                            {defectData.stepsToReproduce}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
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
