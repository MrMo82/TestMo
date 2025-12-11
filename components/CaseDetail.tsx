
import React, { useState, useEffect } from 'react';
import { TestCase, StepStatus, CaseStatus, TestStep, ProjectSettings, User } from '../types';
import { calculateCaseStatus, calculateProgress } from '../utils/statusHelpers';
import { generateDefectReport, DefectReport, refineTestCase, generateVariantsFromCase } from '../services/geminiService';
import DefectModal from './DefectModal';
import FailureDialog from './FailureDialog';
import { ArrowLeft, Clock, Save, Play, CheckCircle, XCircle, Ban, AlertCircle, ChevronDown, ChevronUp, Database, StickyNote, Timer, Bug, Image as ImageIcon, Printer, RotateCcw, Copy, Trash2, Mic, AlertTriangle, Sparkles, Loader2, Bot, GitBranch, UserPlus } from 'lucide-react';
import { storageService } from '../services/storageService';

interface CaseDetailProps {
  testCase: TestCase;
  onUpdate: (updatedCase: TestCase) => void;
  onBack: () => void;
  onStartRunner: () => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (testCase: TestCase) => void;
  onReset?: (testCase: TestCase) => void;
  onUpgrade?: (testCase: TestCase) => void;
  onAddCases?: (newCases: TestCase[]) => void; 
  projectSettings: ProjectSettings | null;
  users: User[];
}

const CaseDetail: React.FC<CaseDetailProps> = ({ testCase, onUpdate, onBack, onStartRunner, onDelete, onDuplicate, onReset, onUpgrade, onAddCases, projectSettings, users }) => {
  const [currentCase, setCurrentCase] = useState<TestCase>(testCase);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [isGeneratingDefect, setIsGeneratingDefect] = useState(false);
  const [currentDefect, setCurrentDefect] = useState<DefectReport | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [isListening, setIsListening] = useState<string | null>(null);
  
  // State for Failure Dialog Interception
  const [failureDialogState, setFailureDialogState] = useState<{ isOpen: boolean, stepId: string | null, mode: 'Failed' | 'Blocked' }>({ 
      isOpen: false, stepId: null, mode: 'Failed' 
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => { 
      setCurrentCase(testCase); 
      setCurrentUser(storageService.getCurrentUser());
  }, [testCase]);

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) newExpanded.delete(stepId); else newExpanded.add(stepId);
    setExpandedSteps(newExpanded);
  };

  const handleStatusClick = (stepId: string, status: StepStatus) => {
      // Intercept Failed and Blocked statuses
      if (status === StepStatus.Failed || status === StepStatus.Blocked) {
          setFailureDialogState({ 
              isOpen: true, 
              stepId: stepId, 
              mode: status === StepStatus.Failed ? 'Failed' : 'Blocked' 
          });
      } else {
          // Direct update for Passed / NotStarted
          updateStepStatus(stepId, status);
      }
  };

  const confirmFailureDialog = (note: string, evidence?: string) => {
      if (failureDialogState.stepId) {
          updateStepStatus(
              failureDialogState.stepId, 
              failureDialogState.mode === 'Failed' ? StepStatus.Failed : StepStatus.Blocked,
              note,
              evidence
          );
      }
      setFailureDialogState({ ...failureDialogState, isOpen: false });
  };

  const updateStepStatus = (stepId: string, status: StepStatus, note?: string, evidence?: string) => {
    const updatedSteps = currentCase.steps.map(step => 
        step.stepId === stepId ? { 
            ...step, 
            status, 
            notes: note || step.notes,
            evidence: evidence || step.evidence
        } : step
    );
    const newStatus = calculateCaseStatus(updatedSteps);
    const updatedCase = { 
        ...currentCase, 
        steps: updatedSteps, 
        caseStatus: newStatus, 
        lastUpdated: new Date().toISOString(),
        executedBy: currentUser?.username 
    };
    setCurrentCase(updatedCase);
    onUpdate(updatedCase);
    storageService.logActivity(currentUser?.name || 'User', 'status_change', currentCase.caseId, `Step updated to ${status}`);
  };

  const updateStepFields = (stepId: string, fields: Partial<TestStep>) => {
    const updatedSteps = currentCase.steps.map(step => step.stepId === stepId ? { ...step, ...fields } : step);
    const updatedCase = { ...currentCase, steps: updatedSteps, lastUpdated: new Date().toISOString() };
    setCurrentCase(updatedCase);
    onUpdate(updatedCase);
  };

  const handleAssignUser = (username: string) => {
      const updatedCase = { ...currentCase, assignedTo: username };
      setCurrentCase(updatedCase);
      onUpdate(updatedCase);
      storageService.logActivity(currentUser?.name || 'User', 'update', currentCase.caseId, `Assigned to ${username}`);
  };

  const handleCreateDefect = async (step: TestStep) => {
      setIsDefectModalOpen(true);
      setIsGeneratingDefect(true);
      setCurrentDefect(null);
      try {
          const report = await generateDefectReport(currentCase, step);
          setCurrentDefect(report);
      } catch (error) { console.error(error); } finally { setIsGeneratingDefect(false); }
  };

  const handleRefineCase = async () => {
      if (!window.confirm("Testfall optimieren?")) return;
      setIsRefining(true);
      try {
          const refinedCase = await refineTestCase(currentCase, projectSettings || undefined);
          setCurrentCase(refinedCase);
          onUpdate(refinedCase);
          storageService.logActivity('AI', 'update', currentCase.caseId, 'Refined with AI');
      } catch (err) { alert("Fehler bei Optimierung."); } finally { setIsRefining(false); }
  };

  const handleGenerateVariants = async () => {
      if (!onAddCases) return;
      setIsGeneratingVariants(true);
      try {
          const variants = await generateVariantsFromCase(currentCase, projectSettings || undefined);
          onAddCases(variants);
          storageService.logActivity('AI', 'create', `${variants.length} Variants`, `Generated from ${currentCase.caseId}`);
          alert(`${variants.length} Varianten erstellt.`);
      } catch (err) { alert("Fehler bei Varianten."); } finally { setIsGeneratingVariants(false); }
  };

  const startVoiceInput = (stepId: string) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) { alert("Browser nicht unterstützt."); return; }
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = false;
    setIsListening(stepId);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const currentNotes = currentCase.steps.find(s => s.stepId === stepId)?.notes || '';
      updateStepFields(stepId, { notes: currentNotes ? currentNotes + ' ' + transcript : transcript });
      setIsListening(null);
    };
    recognition.onerror = () => setIsListening(null);
    recognition.onend = () => setIsListening(null);
    recognition.start();
  };

  const progress = calculateProgress(currentCase.steps);
  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case CaseStatus.Passed: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case CaseStatus.Failed: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case CaseStatus.Blocked: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case CaseStatus.InProgress: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="pb-12 max-w-5xl mx-auto animate-fade-in relative print-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft size={20} className="mr-1" /> Zurück
        </button>
        
        <div className="flex items-center gap-2 admin-toolbar">
           {onUpgrade && (
               <button onClick={() => onUpgrade(currentCase)} className="p-2 rounded-lg transition-colors flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400" title="KI-Upgrade">
                   <Bot size={18} /> <span className="text-xs font-bold hidden md:inline">KI-Assistent</span>
               </button>
           )}
           <button onClick={handleRefineCase} disabled={isRefining} className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isRefining ? 'bg-purple-50 text-purple-600' : 'text-slate-500 hover:bg-purple-50 hover:text-purple-600 dark:text-slate-400'}`} title="Testfall optimieren (KI)"><Sparkles size={18} /></button>
           {onAddCases && (<button onClick={handleGenerateVariants} disabled={isGeneratingVariants} className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isGeneratingVariants ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:text-slate-400'}`} title="KI-Varianten generieren (Negativfälle)"><GitBranch size={18} /></button>)}
           <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
           {onReset && <button onClick={() => onReset(currentCase)} className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg" title="Testfall zurücksetzen (Reset)"><RotateCcw size={18} /></button>}
           {onDuplicate && <button onClick={() => onDuplicate(currentCase)} className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg" title="Duplizieren"><Copy size={18} /></button>}
           <button onClick={() => window.print()} className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg" title="Drucken / PDF"><Printer size={18} /></button>
           {onDelete && <button onClick={() => onDelete(currentCase.caseId)} className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg" title="Löschen"><Trash2 size={18} /></button>}
        </div>
      </div>

      <div className="glass-panel rounded-xl shadow-sm overflow-hidden mb-6 print-container">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-grow">
                    <span className="font-mono text-sm text-slate-400 dark:text-slate-500">{currentCase.caseId}</span>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{currentCase.title}</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">{currentCase.summary}</p>
                    
                    {/* Execution Info */}
                    {currentCase.executedBy && (
                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                            <CheckCircle size={12} className="text-green-500"/>
                            Zuletzt getestet von <span className="font-bold">{currentCase.executedBy}</span>
                        </div>
                    )}
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                    <div className="inline-block"><span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(currentCase.caseStatus)}`}>{currentCase.caseStatus}</span></div>
                    
                    {/* Assignee Selector */}
                    <div className="flex items-center gap-2 mt-1 no-print">
                         <span className="text-xs text-slate-400 uppercase font-bold">Assignee:</span>
                         <div className="relative">
                             <select 
                                value={currentCase.assignedTo || ''}
                                onChange={(e) => handleAssignUser(e.target.value)}
                                className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 pl-2 pr-8 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:border-blue-400 transition-colors"
                             >
                                 <option value="">-- Nicht zugewiesen --</option>
                                 {users.map(u => (
                                     <option key={u.username} value={u.username}>{u.name}</option>
                                 ))}
                             </select>
                             <UserPlus size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                         </div>
                    </div>

                    <div className="flex items-center justify-end text-slate-500 dark:text-slate-400 text-sm mt-1"><Clock size={16} className="mr-1" /> Est. {currentCase.estimatedDurationMin} min ({currentCase.estimatedEffort})</div>
                    <div className="w-32 bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-2 ml-auto no-print"><div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
                </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">{(currentCase.tags || []).map(tag => <span key={tag} className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded text-xs border border-slate-100 dark:border-slate-700">{tag}</span>)}</div>
                <button onClick={onStartRunner} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 hover:shadow-md hover:scale-[1.02] no-print" title="Vollbild-Testmodus starten"><Play size={18} fill="currentColor" /> Focus Run Starten</button>
            </div>
        </div>

        {currentCase.preconditions.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Vorbedingungen</h3>
                <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-2">{currentCase.preconditions.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {currentCase.steps.map((step) => (
                <div key={step.stepId} className={`p-6 transition-colors ${step.status === StepStatus.Passed ? 'bg-white dark:bg-slate-900' : step.status === StepStatus.Failed ? 'bg-red-50/30 dark:bg-red-900/10' : step.status === StepStatus.Blocked ? 'bg-amber-50/30 dark:bg-amber-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 pt-1">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm">{step.sequence}</span>
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-medium text-slate-900 dark:text-slate-200 text-lg mb-1">{step.description}</h4>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-2"><span className="font-medium text-slate-500 dark:text-slate-500">Erwartet:</span> {step.expectedResult}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-2">
                                {step.testData && !expandedSteps.has(step.stepId) && <div className="bg-slate-50 dark:bg-slate-800 inline-block px-3 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-400">Daten: {step.testData}</div>}
                                {step.evidence && !expandedSteps.has(step.stepId) && <div className="bg-blue-50 dark:bg-blue-900/20 inline-flex items-center gap-1 px-3 py-1 rounded border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400"><ImageIcon size={12} /> Bild</div>}
                            </div>
                            
                            {/* Notes Display */}
                            {(step.notes || step.status === StepStatus.Failed || step.status === StepStatus.Blocked) && !expandedSteps.has(step.stepId) && (
                                <div className={`text-sm flex items-start gap-1 mt-1 font-medium ${
                                    step.status === StepStatus.Failed ? 'text-red-600 dark:text-red-400' : 
                                    step.status === StepStatus.Blocked ? 'text-amber-600 dark:text-amber-400' : 
                                    'text-slate-500'
                                }`}>
                                    <AlertCircle size={16} className="mt-0.5" /> 
                                    {step.notes || (step.status === StepStatus.Failed ? 'Fehler gemeldet (keine Notiz)' : step.status === StepStatus.Blocked ? 'Blocker gemeldet' : '')}
                                </div>
                            )}

                            <button onClick={() => toggleStepExpansion(step.stepId)} className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 mt-2 transition-colors focus:outline-none no-print">
                                {expandedSteps.has(step.stepId) ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Details & Bearbeiten
                            </button>

                            <div className={`${expandedSteps.has(step.stepId) ? 'block' : 'hidden'} print-expand`}>
                                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-fade-in space-y-3">
                                    {/* Edit Fields */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Database size={12} /> Testdaten</label>
                                        <input type="text" className="w-full p-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={step.testData || ''} onChange={(e) => updateStepFields(step.stepId, { testData: e.target.value })} placeholder="Daten..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><StickyNote size={12} /> Notizen</label>
                                        <div className="relative">
                                            <textarea className="w-full p-2 pr-10 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[60px]" value={step.notes || ''} onChange={(e) => updateStepFields(step.stepId, { notes: e.target.value })} placeholder="Beobachtungen..." />
                                            <button onClick={() => startVoiceInput(step.stepId)} className={`absolute bottom-2 right-2 p-1.5 rounded-full transition-colors no-print ${isListening === step.stepId ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-600 text-slate-400'}`}><Mic size={14} /></button>
                                        </div>
                                    </div>
                                    {/* Evidence Preview if exists */}
                                    {step.evidence && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><ImageIcon size={12} /> Beweisbild</label>
                                            <img src={step.evidence} alt="Evidence" className="h-32 rounded border border-slate-200" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0 flex flex-col gap-2 no-print">
                            <div className="flex bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <button onClick={() => handleStatusClick(step.stepId, StepStatus.Passed)} className={`p-2 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors ${step.status === StepStatus.Passed ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-slate-300 dark:text-slate-600'}`} title="Passed"><CheckCircle size={24} /></button>
                                <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                                <button onClick={() => handleStatusClick(step.stepId, StepStatus.Failed)} className={`p-2 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ${step.status === StepStatus.Failed ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-slate-300 dark:text-slate-600'}`} title="Failed"><XCircle size={24} /></button>
                                <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                                <button onClick={() => handleStatusClick(step.stepId, StepStatus.Blocked)} className={`p-2 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors ${step.status === StepStatus.Blocked ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-300 dark:text-slate-600'}`} title="Blocked"><Ban size={24} /></button>
                            </div>
                            {step.status === StepStatus.Failed && <button onClick={() => handleCreateDefect(step)} className="w-full p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-100 transition-colors flex items-center justify-center gap-1 shadow-sm" title="Defect erstellen"><Bug size={16} /></button>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
      <DefectModal isOpen={isDefectModalOpen} onClose={() => setIsDefectModalOpen(false)} defectData={currentDefect} isLoading={isGeneratingDefect} />
      
      {/* Interception Dialog */}
      <FailureDialog 
        isOpen={failureDialogState.isOpen}
        mode={failureDialogState.mode}
        onClose={() => setFailureDialogState({ ...failureDialogState, isOpen: false })}
        onConfirm={confirmFailureDialog}
      />
    </div>
  );
};

export default CaseDetail;
