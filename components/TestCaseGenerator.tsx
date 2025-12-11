
import React, { useState, useRef, useEffect } from 'react';
import { generateTestCaseFromAI, MediaInput } from '../services/geminiService';
import { TestCase, Priority, NegativeFlow, StepStatus, CaseStatus, ProjectSettings } from '../types';
import { Sparkles, Loader2, Save, X, Database, Image as ImageIcon, Trash2, FileText, Upload, GitBranch, Plus, Check, Settings, Archive, RefreshCw, Sliders } from 'lucide-react';

interface TestCaseGeneratorProps {
  onSave: (testCases: TestCase | TestCase[]) => void;
  onCancel: () => void;
  projectSettings: ProjectSettings | null;
  initialCase?: TestCase | null; // New Prop for Upgrade Mode
}

type InputMode = 'text' | 'image' | 'pdf';

// CMP Matrix Definition - Full Path Taxonomy
const CMP_MATRIX: Record<string, string[]> = {
  // 1. Core Entities & Channel
  ENTITY_TYPE: ['Individual', 'PSO_Company', 'PSO_Employee'],
  CHANNEL: ['Web', 'Email'],
  WEBSITE: ['CH', 'DE', 'AT', 'DK', 'n/a'],
  APP_TYPE: ['None', 'Initiative', 'OneProspect', 'MultiProspect'],
  
  // 2. User State & Geo
  ACCOUNT_STATE: ['WebOnly', 'KnownEU', 'KnownCH', 'New'],
  PROSPECT_COUNTRY: ['CH', 'DE', 'AT', 'DK', 'mix'],
  CANDIDATE_GEO: ['CH', 'EU'],
  GEO_DETECTION: ['Accurate', 'Mismatch', 'VPN'],

  // 3. Source & Ingestion
  CREATOR: ['InboundDE', 'RecruiterCH', 'RecruiterDE', 'RecruiterAT', 'RecruiterDK'],
  INGESTION: ['Parser', 'Manual'],
  CONTROLLER_SOURCE: ['Domain', 'Creator'],
  EMAIL_ROUTE: ['InboundCentralDE', 'DirectRecruiter'],
  ATTACHMENTS: ['CVOnly', 'MultiDocs', 'None'],

  // 4. Consent & Privacy
  CONSENT_PRE: ['None', 'Active', 'PendingDOI', 'Withdrawn'],
  DOI_REQUIRED: ['Yes', 'No'],
  DOI_OUTCOME: ['NotRequired', 'Sent', 'Confirmed', 'Expired', 'Bounced'],
  MARKETING_CONSENT: ['Active', 'None', 'OptOut'],
  PC_STATE: ['Empty', 'OneActive', 'TwoActive', 'OptedOut', 'ReOptIn'],
  PC_LANGUAGE: ['de-CH', 'en-GB', 'fr-CH', 'it-CH'],
  RETENTION: ['Reset', 'ExpiredDeleteAll', 'ExpiredDeleteCountry'],
  RETENTION_PERIOD: ['CH10y', 'DE3y', 'Default'],
  TEMPLATE_FALLBACK: ['None', 'StandardEN', 'StandardDE'],

  // 5. System Logic
  INTEGRATION: ['OK', 'Delayed', 'Failed', 'OutOfOrder', 'CPAPIMaintenance'],
  DEDUP: ['Unique', 'DuplicateEmail'],
  REFNR: ['Present', 'Missing', 'AmbiguousTitle'],
  PLACEMENT_CH: ['None', 'Temp', 'Perm'],
  AVG2: ['AutoYes', 'ManualYes', 'No_3moDelete', 'SalesBackYes'],

  // 6. PSO Specifics
  PSO_FLOW: ['None', 'APConsentsCompany', 'APConsentsEmployee'],
  PSO_AP_CONSENT: ['Granted', 'Denied', 'Pending'],
  PSO_SCOPE: ['All', 'Specific'],
  PSO_EMP_COUNT: ['Small<10', 'Large>50'],
  PSO_MA_STATUS: ['Active', 'Left', 'New']
};

const TestCaseGenerator: React.FC<TestCaseGeneratorProps> = ({ onSave, onCancel, projectSettings, initialCase }) => {
  const [mode, setMode] = useState<InputMode>('text');
  const [context, setContext] = useState('');
  const [userRole, setUserRole] = useState('Case Manager');
  const [priority, setPriority] = useState<Priority>(Priority.Medium);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCase, setGeneratedCase] = useState<TestCase | null>(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<{name: string, data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [addedFlowIds, setAddedFlowIds] = useState<Set<string>>(new Set());

  // Matrix State
  const [showMatrix, setShowMatrix] = useState(false);
  const [matrixSelection, setMatrixSelection] = useState<Record<string, string>>({});

  // Initialize form if editing an existing case
  useEffect(() => {
      if (initialCase) {
          setContext(`Bestehender Testfall: ${initialCase.title}\n\nAktuelle Zusammenfassung: ${initialCase.summary}\n\nBITTE ERGÄNZEN/ÄNDERN ZU: `);
          setPriority(initialCase.priority);
          // We keep userRole default or extract from createdBy if it matches standard roles
      }
  }, [initialCase]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
          setError("Die Datei ist zu groß (Max 4MB).");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedFile({
            name: file.name,
            data: result,
            mimeType: file.type || (type === 'pdf' ? 'application/pdf' : 'image/png')
        });
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMatrixValue = (category: string, value: string) => {
      setMatrixSelection(prev => {
          if (prev[category] === value) {
              const next = { ...prev };
              delete next[category];
              return next;
          }
          return { ...prev, [category]: value };
      });
  };

  const getFullPrompt = () => {
      let prompt = context;
      
      const matrixParts = Object.entries(matrixSelection).map(([k, v]) => `${k}=${v}`);
      if (matrixParts.length > 0) {
          prompt += `\n\nCMP SZENARIO PARAMETER (Wege-Taxonomie):\n${matrixParts.join('\n')}`;
          prompt += `\n\nANWEISUNG: 
          1. Berücksichtige diese Parameter zwingend bei Vorbedingungen und Testdaten.
          2. Füge die gewählten Parameter als Tags zum Testfall hinzu (z.B. "Channel:Web").`;
      }
      return prompt;
  };

  const handleGenerate = async () => {
    const finalPrompt = getFullPrompt();

    if (mode === 'text' && !finalPrompt.trim()) {
        setError("Bitte beschreibe dein Szenario oder wähle Parameter aus der Matrix.");
        return;
    }
    if ((mode === 'image' || mode === 'pdf') && !selectedFile) {
        setError("Bitte lade eine Datei hoch.");
        return;
    }
    
    setIsGenerating(true);
    setError('');
    setGeneratedCase(null);
    setAddedFlowIds(new Set());

    try {
        let mediaPayload: MediaInput | undefined = undefined;
        
        if (mode !== 'text' && selectedFile) {
            mediaPayload = {
                mimeType: selectedFile.mimeType,
                data: selectedFile.data
            };
        }

        const result = await generateTestCaseFromAI(
            finalPrompt, 
            userRole, 
            priority, 
            mediaPayload,
            projectSettings || undefined
        );

        // If in upgrade mode, preserve the original ID and metadata
        if (initialCase) {
            setGeneratedCase({
                ...result,
                caseId: initialCase.caseId, // KEEP ORIGINAL ID
                caseStatus: initialCase.caseStatus, // KEEP STATUS
                createdBy: initialCase.createdBy,
                lastUpdated: new Date().toISOString()
            });
        } else {
            setGeneratedCase(result);
        }

    } catch (err) {
      console.error(err);
      setError('Fehler bei der Generierung. Bitte prüfe deine Datei oder versuche es erneut.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmSave = () => {
    if (generatedCase) {
      onSave(generatedCase);
      resetForm();
    }
  };

  const handleBulkSaveDrafts = () => {
    if (!generatedCase) return;
    
    const casesToSave: TestCase[] = [];

    // 1. Main Case as Draft (or update if editing)
    const mainCase: TestCase = {
        ...generatedCase,
        caseStatus: initialCase ? initialCase.caseStatus : CaseStatus.Draft, // Keep status if editing, else Draft
        tags: [...generatedCase.tags, 'Backlog']
    };
    casesToSave.push(mainCase);

    // 2. All Negative Flows as Drafts
    if (generatedCase.negativeFlows) {
        generatedCase.negativeFlows.forEach(flow => {
             const flowCaseId = `TC-${Math.floor(Math.random() * 100000)}`;
             const flowDraft: TestCase = {
                 ...generatedCase,
                 caseId: flowCaseId,
                 caseStatus: CaseStatus.Draft,
                 title: `${generatedCase.title} - ${flow.description.substring(0, 30)}...`,
                 summary: `Backlog Entwurf basierend auf Flow: ${flow.description}`,
                 steps: flow.steps.map(s => ({
                    ...s,
                    status: StepStatus.NotStarted,
                    testData: s.testData || "",
                    notes: undefined,
                    evidence: undefined,
                    evidenceAnalysis: undefined
                })),
                negativeFlows: [],
                tags: [...generatedCase.tags, 'AlternativeFlow', 'Backlog']
             };
             casesToSave.push(flowDraft);
        });
    }

    onSave(casesToSave);
    resetForm();
  };

  const resetForm = () => {
      setGeneratedCase(null);
      setContext('');
      setSelectedFile(null);
      setAddedFlowIds(new Set());
      setMatrixSelection({});
  };

  const handleCreateFromFlow = (flow: NegativeFlow) => {
      if (!generatedCase || addedFlowIds.has(flow.flowId)) return;

      const newCaseId = `TC-${Math.floor(Math.random() * 100000)}`;
      
      const newCase: TestCase = {
          ...generatedCase,
          caseId: newCaseId,
          title: `${generatedCase.title} - ${flow.description.substring(0, 30)}...`, 
          summary: `Variante/Negativ-Fall basierend auf: ${generatedCase.title}. Szenario: ${flow.description}`,
          steps: flow.steps.map(s => ({
              ...s,
              status: StepStatus.NotStarted,
              testData: s.testData || "",
              notes: undefined,
              evidence: undefined,
              evidenceAnalysis: undefined
          })),
          negativeFlows: [], 
          caseStatus: CaseStatus.NotStarted,
          lastUpdated: new Date().toISOString(),
          estimatedDurationMin: Math.max(2, Math.round(generatedCase.estimatedDurationMin * 0.5)), 
          estimatedEffort: generatedCase.estimatedEffort,
          tags: [...generatedCase.tags, "AlternativeFlow"]
      };

      onSave(newCase);
      setAddedFlowIds(prev => new Set(prev).add(flow.flowId));
  };

  const selectedCount = Object.keys(matrixSelection).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className={`p-6 rounded-xl shadow-sm border ${initialCase ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {initialCase ? <RefreshCw className="text-indigo-600" size={24} /> : <Sparkles className="text-purple-600" size={24} />}
            {initialCase ? 'KI Upgrade Assistent' : 'KI Testfall-Assistent'}
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>
        
        {initialCase && (
            <div className="mb-4 text-sm text-indigo-700 bg-indigo-100 p-3 rounded-lg border border-indigo-200">
                <strong>Modus: Testfall Aktualisierung.</strong> Du bearbeitest <em>{initialCase.caseId}</em>. 
                Füge Screenshots oder Details hinzu, um den Testfall neu zu generieren. Die ID bleibt erhalten.
            </div>
        )}

        {projectSettings && (
             <div className="mb-6 bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center gap-2 text-sm text-blue-700">
                 <Settings size={16} />
                 <span>Kontext aktiv: <strong>{projectSettings.projectName}</strong> (Release: {projectSettings.releaseVersion || 'N/A'})</span>
             </div>
        )}

        <div className="space-y-4">
          
          {/* Input Mode Tabs */}
          <div className="flex border-b border-slate-200 mb-4">
            <button 
                onClick={() => setMode('text')}
                className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${mode === 'text' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Text Beschreibung
            </button>
            <button 
                onClick={() => setMode('image')}
                className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${mode === 'image' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Bild / Screenshot
            </button>
            <button 
                onClick={() => setMode('pdf')}
                className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${mode === 'pdf' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                PDF / Prozess
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
                {mode === 'text' && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Dein Szenario</label>
                        <textarea
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-40 resize-none"
                            placeholder="z.B. User Story 123: Antrag erfassen. Der User soll einen Antrag speichern, aber das Datum liegt in der Zukunft (Fehler)."
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                        />
                        <p className="text-xs text-slate-500">Tipp: Gib die User Story ID an für korrekte Benennung.</p>
                    </div>
                )}

                {mode === 'image' && (
                     <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Screenshot hochladen</label>
                        <div 
                            className={`border-2 border-dashed rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
                            onClick={() => !selectedFile && fileInputRef.current?.click()}
                        >
                            {selectedFile ? (
                                <>
                                    <img src={selectedFile.data} alt="Preview" className="h-full w-full object-contain opacity-80" />
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="absolute top-2 right-2 bg-white p-1 rounded-full shadow-md text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="text-slate-400 mb-2" size={32} />
                                    <span className="text-sm text-slate-500 font-medium">Zieh dein Bild hierher oder klicke</span>
                                    <span className="text-xs text-slate-400 mt-1">PNG, JPG (Max 4MB)</span>
                                </>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => handleFileUpload(e, 'image')} 
                            />
                        </div>
                        <p className="text-xs text-slate-500">Die KI analysiert das UI und erstellt Testschritte.</p>
                    </div>
                )}

                {mode === 'pdf' && (
                     <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Prozessdokument (PDF)</label>
                        <div 
                            className={`border-2 border-dashed rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
                            onClick={() => !selectedFile && fileInputRef.current?.click()}
                        >
                            {selectedFile ? (
                                <div className="flex flex-col items-center">
                                    <FileText size={40} className="text-red-500 mb-2" />
                                    <span className="font-medium text-slate-700">{selectedFile.name}</span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium"
                                    >
                                        Entfernen
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="text-slate-400 mb-2" size={32} />
                                    <span className="text-sm text-slate-500 font-medium">Zieh deine PDF hierher oder klicke</span>
                                    <span className="text-xs text-slate-400 mt-1">PDF Prozessdiagramme (Max 4MB)</span>
                                </>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="application/pdf" 
                                onChange={(e) => handleFileUpload(e, 'pdf')} 
                            />
                        </div>
                        <p className="text-xs text-slate-500">Die KI liest Signavio/Visio Diagramme und leitet Pfade ab.</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Benutzerrolle</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priorität</label>
                    <select
                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as Priority)}
                    >
                        {Object.values(Priority).map(p => (
                        <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                {mode !== 'text' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Zusatzinfos (Optional)</label>
                         <textarea
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm h-20 resize-none"
                            placeholder="Ergänze Details, die im Bild/PDF fehlen..."
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                        />
                    </div>
                )}
            </div>
          </div>

          {/* CMP Matrix Selector */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
             <button 
                onClick={() => setShowMatrix(!showMatrix)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
             >
                 <div className="flex items-center gap-2 text-slate-700 font-bold">
                     <Sliders size={18} className="text-blue-600" />
                     Szenario Matrix (Wege-Taxonomie)
                     {selectedCount > 0 && (
                         <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                             {selectedCount} gewählt
                         </span>
                     )}
                 </div>
                 <div className="text-slate-400">
                     {showMatrix ? <MinusIcon /> : <PlusIcon />}
                 </div>
             </button>

             {showMatrix && (
                 <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto custom-scrollbar">
                     {Object.entries(CMP_MATRIX).map(([category, values]) => (
                         <div key={category}>
                             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{category.replace(/_/g, ' ')}</h4>
                             <div className="flex flex-wrap gap-2">
                                 {values.map(val => {
                                     const isSelected = matrixSelection[category] === val;
                                     return (
                                        <button
                                            key={val}
                                            onClick={() => toggleMatrixValue(category, val)}
                                            className={`text-xs px-2 py-1 rounded border transition-colors ${
                                                isSelected 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                                            }`}
                                        >
                                            {val}
                                        </button>
                                     );
                                 })}
                             </div>
                         </div>
                     ))}
                 </div>
             )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${initialCase ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" /> Analysiere & Generiere...
              </>
            ) : (
              <>
                {initialCase ? <RefreshCw size={18} /> : <Sparkles size={18} />} 
                {initialCase ? 'Testfall Aktualisieren' : 'Testfall Generieren (KI)'}
              </>
            )}
          </button>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>

      {generatedCase && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-fade-in-up">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{generatedCase.caseId}</span>
              <h3 className="text-2xl font-bold text-slate-900">{generatedCase.title}</h3>
              <p className="text-slate-600 mt-1">{generatedCase.summary}</p>
              {/* Show Matrix Context in Result */}
              {Object.keys(matrixSelection).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(matrixSelection).map(([k, v]) => (
                          <span key={k} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                              <span className="font-bold">{k}:</span> {v}
                          </span>
                      ))}
                  </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                ${generatedCase.priority === Priority.High ? 'bg-red-100 text-red-700' : 
                    generatedCase.priority === Priority.Medium ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                {generatedCase.priority}
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    Aufwand: {generatedCase.estimatedEffort}
                </span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Vorbedingungen</h4>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
              {generatedCase.preconditions.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Testschritte (Happy Path)</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold">
                  <tr>
                    <th className="p-3 border-b w-10">#</th>
                    <th className="p-3 border-b">Aktion</th>
                    <th className="p-3 border-b">Erwartetes Ergebnis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {generatedCase.steps.map((step) => (
                    <tr key={step.stepId} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500 align-top">{step.sequence}</td>
                      <td className="p-3 text-slate-800 align-top">
                          <div className="mb-1">{step.description}</div>
                          {step.testData && (
                              <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 p-2 rounded flex items-start gap-2">
                                  <Database size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span className="font-mono">{step.testData}</span>
                              </div>
                          )}
                      </td>
                      <td className="p-3 text-slate-600 align-top">{step.expectedResult}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {generatedCase.negativeFlows && generatedCase.negativeFlows.length > 0 && (
             <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <GitBranch size={16} className="text-amber-500" />
                    Alternative / Negative Flows (Klicken zum Erstellen)
                </h4>
                <div className="grid grid-cols-1 gap-3">
                    {generatedCase.negativeFlows.map(flow => {
                        const isAdded = addedFlowIds.has(flow.flowId);
                        return (
                            <button 
                                key={flow.flowId} 
                                onClick={() => handleCreateFromFlow(flow)}
                                disabled={isAdded}
                                className={`flex items-center justify-between p-4 rounded-lg border text-left transition-all ${
                                    isAdded 
                                    ? 'bg-green-50 border-green-200 cursor-default' 
                                    : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                                }`}
                            >
                                <div>
                                    <span className={`font-medium text-sm block mb-1 ${isAdded ? 'text-green-800' : 'text-slate-800'}`}>
                                        {flow.description}
                                    </span>
                                    <span className="text-xs text-slate-500">{flow.steps.length} Schritte</span>
                                </div>
                                <div className={`p-2 rounded-full ${isAdded ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {isAdded ? <Check size={18} /> : <Plus size={18} />}
                                </div>
                            </button>
                        );
                    })}
                </div>
             </div>
          )}

          <div className="flex justify-end gap-3 mt-8 border-t pt-4">
            <button 
              onClick={() => setGeneratedCase(null)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Abbrechen
            </button>
            <button 
              onClick={handleBulkSaveDrafts}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors"
              title="Speichert Hauptfall und alle Varianten als Entwürfe"
            >
              <Archive size={18} /> {initialCase ? 'Varianten speichern' : 'Alle als Entwürfe speichern'}
            </button>
            <button 
              onClick={handleConfirmSave}
              className={`px-6 py-2 text-white rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors ${initialCase ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {initialCase ? <RefreshCw size={18} /> : <Save size={18} />}
              {initialCase ? 'Update bestätigen' : 'Nur Haupt-Testfall Speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>;
const MinusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>;

export default TestCaseGenerator;
