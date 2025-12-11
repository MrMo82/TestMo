
import React, { useState, useRef } from 'react';
import { parseCSVToTestCases, refineTestCase } from '../services/geminiService';
import { TestCase, ProjectSettings } from '../types';
import { Upload, FileText, Check, AlertTriangle, Loader2, FileSpreadsheet, Sparkles } from 'lucide-react';

interface BulkUploadProps {
  onImport: (cases: TestCase[]) => void;
  onCancel: () => void;
  projectSettings: ProjectSettings | null;
}

const BulkUpload: React.FC<BulkUploadProps> = ({ onImport, onCancel, projectSettings }) => {
  const [csvContent, setCsvContent] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedCases, setParsedCases] = useState<TestCase[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track which rows are currently being refined by AI
  const [refiningIndices, setRefiningIndices] = useState<Set<number>>(new Set());

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          setCsvContent(content);
      };
      reader.onerror = () => setError("Fehler beim Lesen der Datei.");
      reader.readAsText(file);
  };

  const handleParse = async () => {
    if (!csvContent.trim()) return;
    
    setIsParsing(true);
    setError('');
    setParsedCases([]);
    
    try {
      const result = await parseCSVToTestCases(csvContent);
      setParsedCases(result);
    } catch (err) {
      setError('Fehler beim Analysieren der Daten. Bitte prüfe dein Format.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleRefineRow = async (index: number) => {
      const testCase = parsedCases[index];
      if (!testCase) return;

      setRefiningIndices(prev => new Set(prev).add(index));
      
      try {
          // AI Magic: Refine the raw CSV import using project settings
          const refinedCase = await refineTestCase(testCase, projectSettings || undefined);
          
          setParsedCases(prev => prev.map((c, i) => i === index ? refinedCase : c));
      } catch (err) {
          console.error("Row refinement failed", err);
          // Optional: Show a small error toast or alert
      } finally {
          setRefiningIndices(prev => {
              const next = new Set(prev);
              next.delete(index);
              return next;
          });
      }
  };

  const handleImport = () => {
    onImport(parsedCases);
    setParsedCases([]);
    setCsvContent('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Upload className="text-blue-600" size={24} />
          Massenimport / Bulk Upload
        </h2>

        {!parsedCases.length ? (
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">
              Lade eine CSV-Datei hoch oder kopiere Text hinein. Die KI strukturiert die Daten automatisch.
            </p>
            
            {/* File Upload Zone */}
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
            >
                <FileSpreadsheet className="text-slate-400 mb-2" size={32} />
                <span className="text-sm font-medium text-slate-600">Klicke zum Hochladen einer CSV Datei</span>
                <span className="text-xs text-slate-400 mt-1">oder ziehe sie hierher</span>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv,.txt" 
                    onChange={handleFileUpload}
                />
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Oder Text einfügen:</label>
              <textarea
                className="w-full h-48 p-4 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="caseId,title,summary,tags,priority,stepDescription..."
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={onCancel}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={handleParse}
                disabled={isParsing || !csvContent.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isParsing ? <Loader2 className="animate-spin" /> : <FileText size={18} />}
                {isParsing ? 'Daten analysieren...' : 'Import analysieren (KI)'}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm flex items-center gap-2"><AlertTriangle size={16}/> {error}</p>}
          </div>
        ) : (
          <div className="space-y-6">
             <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-center gap-2">
                <Check size={20} />
                <span className="font-medium">{parsedCases.length} Testfälle erfolgreich erkannt. Überprüfe und optimiere sie jetzt.</span>
             </div>

             <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 sticky top-0">
                        <tr>
                            <th className="p-3 border-b">ID</th>
                            <th className="p-3 border-b">Titel</th>
                            <th className="p-3 border-b text-center">Schritte</th>
                            <th className="p-3 border-b text-center">Prio</th>
                            <th className="p-3 border-b text-right">Aktionen (KI-Opt)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedCases.map((c, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="p-3 font-mono text-xs text-slate-500 align-middle">{c.caseId}</td>
                                <td className="p-3 font-medium text-slate-800 align-middle">
                                    {c.title}
                                    <div className="text-xs text-slate-400 font-normal truncate max-w-[200px]">{c.summary}</div>
                                </td>
                                <td className="p-3 text-slate-600 text-center align-middle">{c.steps.length}</td>
                                <td className="p-3 text-center align-middle">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                        c.priority === 'High' ? 'bg-red-50 border-red-100 text-red-600' :
                                        c.priority === 'Medium' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                        'bg-green-50 border-green-100 text-green-600'
                                    }`}>
                                        {c.priority}
                                    </span>
                                </td>
                                <td className="p-3 text-right align-middle">
                                    <button 
                                        onClick={() => handleRefineRow(i)}
                                        disabled={refiningIndices.has(i)}
                                        className={`p-2 rounded-lg transition-colors border ${
                                            refiningIndices.has(i) 
                                            ? 'bg-purple-50 text-purple-400 border-purple-100 cursor-not-allowed' 
                                            : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200 bg-white border-slate-200'
                                        }`}
                                        title="Mit KI optimieren (Hays Konvention, Testdaten)"
                                    >
                                        {refiningIndices.has(i) ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>

             <div className="flex gap-3 justify-end">
                 <button 
                    onClick={() => setParsedCases([])}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                 >
                    Zurück
                 </button>
                 <button
                    onClick={handleImport}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm"
                 >
                    Alle Importieren
                 </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUpload;
