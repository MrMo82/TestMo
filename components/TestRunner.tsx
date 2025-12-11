
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TestCase, TestStep, StepStatus, CaseStatus, EvidenceAnalysis, ProjectSettings } from '../types';
import { calculateCaseStatus } from '../utils/statusHelpers';
import { analyzeScreenshot } from '../services/geminiService';
import FailureDialog from './FailureDialog';
import { X, CheckCircle, XCircle, Ban, ArrowRight, ArrowLeft, Trophy, Keyboard, Camera, Image as ImageIcon, Trash2, ScanEye, Loader2, AlertTriangle, Check, ChevronDown, ChevronUp, Database, StickyNote, Timer, Mic } from 'lucide-react';

interface TestRunnerProps {
  testCase: TestCase;
  onUpdate: (updatedCase: TestCase) => void;
  onClose: () => void;
  projectSettings: ProjectSettings | null;
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'];

const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<{id: number, left: string, bg: string, duration: string}[]>([]);

  useEffect(() => {
    const count = 50;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + 'vw',
      bg: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: Math.random() * 2 + 2 + 's'
    }));
    setParticles(newParticles);
  }, []);

  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti"
          style={{
            left: p.left,
            backgroundColor: p.bg,
            animationDuration: p.duration,
            animationDelay: Math.random() * 1 + 's'
          }}
        />
      ))}
    </>
  );
};

const TestRunner: React.FC<TestRunnerProps> = ({ testCase, onUpdate, onClose, projectSettings }) => {
  const initialIndex = testCase.steps.findIndex(s => s.status !== StepStatus.Passed);
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Failure Dialog State
  const [showFailDialog, setShowFailDialog] = useState(false);
  const [failMode, setFailMode] = useState<'Failed' | 'Blocked'>('Failed');

  // Toggle Details State
  const [showDetails, setShowDetails] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const currentStep = testCase.steps[currentIndex];

  const handleStatusUpdate = useCallback((status: StepStatus, note?: string, evidence?: string) => {
    // Intercept Fail/Block to show dialog
    if ((status === StepStatus.Failed || status === StepStatus.Blocked) && !note && !showFailDialog) {
        setFailMode(status === StepStatus.Failed ? 'Failed' : 'Blocked');
        setShowFailDialog(true);
        return;
    }

    const updatedSteps = testCase.steps.map((step, index) => 
      index === currentIndex ? { 
          ...step, 
          status, 
          notes: note || step.notes,
          evidence: evidence || step.evidence
      } : step
    );

    const newCaseStatus = calculateCaseStatus(updatedSteps);
    const updatedCase = {
      ...testCase,
      steps: updatedSteps,
      caseStatus: newCaseStatus,
      lastUpdated: new Date().toISOString()
    };

    onUpdate(updatedCase);

    // Auto-advance logic (Pass or Block advances)
    if ((status === StepStatus.Passed || status === StepStatus.Blocked) && currentIndex < testCase.steps.length - 1) {
      setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setShowDetails(false); // Reset details view for next step
      }, 150);
    } else if ((status === StepStatus.Passed || status === StepStatus.Blocked) && currentIndex === testCase.steps.length - 1) {
        setIsFinished(true);
        if (newCaseStatus === CaseStatus.Passed) {
            setShowConfetti(true);
        }
    }
    
    // Failed stays on screen to allow review
    if (status === StepStatus.Failed && currentIndex === testCase.steps.length - 1) {
        setIsFinished(true);
    }
  }, [currentIndex, onUpdate, testCase, showFailDialog]);

  const updateStepFields = (fields: Partial<TestStep>) => {
    const updatedSteps = testCase.steps.map((step, index) => 
        index === currentIndex ? { ...step, ...fields } : step
    );

    const updatedCase = {
        ...testCase,
        steps: updatedSteps,
        lastUpdated: new Date().toISOString()
    };
    onUpdate(updatedCase);
  };

  const confirmFail = (note: string, evidence?: string) => {
      setShowFailDialog(false);
      handleStatusUpdate(failMode === 'Failed' ? StepStatus.Failed : StepStatus.Blocked, note, evidence);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Browser nicht unterstützt.");
        return;
    }
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = false;
    
    setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const currentNotes = currentStep.notes || '';
      updateStepFields({ notes: currentNotes ? currentNotes + ' ' + transcript : transcript });
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            
            const updatedSteps = testCase.steps.map((step, index) => 
                index === currentIndex ? { ...step, evidence: result, evidenceAnalysis: undefined } : step
            );
            
            const updatedCase = {
                ...testCase,
                steps: updatedSteps,
                lastUpdated: new Date().toISOString()
            };
            onUpdate(updatedCase);
        };
        reader.readAsDataURL(file);
    }
  };

  const runAICheck = async () => {
      if (!currentStep.evidence) return;
      
      setIsAnalyzing(true);
      try {
          const analysis = await analyzeScreenshot(
              currentStep.expectedResult, 
              currentStep.evidence,
              projectSettings || undefined
          );
          
          const updatedSteps = testCase.steps.map((step, index) => 
            index === currentIndex ? { ...step, evidenceAnalysis: analysis } : step
          );
          
          const updatedCase = {
              ...testCase,
              steps: updatedSteps,
              lastUpdated: new Date().toISOString()
          };
          onUpdate(updatedCase);

      } catch (err) {
          console.error(err);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const removeEvidence = () => {
      const updatedSteps = testCase.steps.map((step, index) => 
        index === currentIndex ? { ...step, evidence: undefined, evidenceAnalysis: undefined } : step
      );
      const updatedCase = {
          ...testCase,
          steps: updatedSteps,
          lastUpdated: new Date().toISOString()
      };
      onUpdate(updatedCase);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || showFailDialog) return;
      
      switch(e.key.toLowerCase()) {
        case 'p': handleStatusUpdate(StepStatus.Passed); break;
        case 'f': handleStatusUpdate(StepStatus.Failed); break;
        case 'b': handleStatusUpdate(StepStatus.Blocked); break;
        case 'arrowright': 
          if (currentIndex < testCase.steps.length - 1) {
              setCurrentIndex(prev => prev + 1);
              setShowDetails(false);
          }
          break;
        case 'arrowleft': 
          if (currentIndex > 0) {
              setCurrentIndex(prev => prev - 1);
              setShowDetails(false);
          }
          break;
        case 'escape': onClose(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStatusUpdate, isFinished, onClose, currentIndex, testCase.steps.length, showFailDialog]);

  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        {showConfetti && <Confetti />}
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${showConfetti ? 'bg-green-100 text-green-600 animate-pulse-ring' : 'bg-slate-100 text-slate-600'}`}>
              <Trophy size={48} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Testlauf beendet!</h2>
          <p className="text-slate-600 mb-8">
            Du hast alle Schritte für <strong>{testCase.caseId}</strong> durchlaufen.
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium shadow-lg transition-transform hover:scale-[1.02]"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded font-mono">{testCase.caseId}</span>
              Focus Runner
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
          <span className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            <Keyboard size={14} /> Shortcuts: P, F, B
          </span>
          <span>Schritt {currentIndex + 1} von {testCase.steps.length}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100 w-full">
        <div 
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${((currentIndex + 1) / testCase.steps.length) * 100}%` }}
        ></div>
      </div>

      {/* Content */}
      <div className="flex-grow flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 min-h-[400px] flex flex-col relative overflow-hidden animate-fade-in-up key-{currentIndex}">
          
          <div className="absolute top-0 right-0 p-4 opacity-10 font-bold text-9xl text-slate-300 select-none">
            {currentStep.sequence}
          </div>

          <div className="mb-8 relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Aktion</h3>
            <p className="text-3xl font-medium text-slate-900 leading-tight">
              {currentStep.description}
            </p>
          </div>

          {currentStep.testData && (
            <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100 relative z-10">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Eingabe-Daten</h3>
              <p className="text-xl font-mono text-blue-800">{currentStep.testData}</p>
            </div>
          )}

          <div className="mb-auto relative z-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Erwartetes Ergebnis</h3>
            <p className="text-xl text-slate-600">
              {currentStep.expectedResult}
            </p>
          </div>

          {/* Collapsible Details & Edit Section */}
          <div className="mt-6 border-t border-slate-100 pt-4 relative z-20">
              <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors focus:outline-none"
              >
                  {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  Details & Bearbeiten
              </button>

              {showDetails && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in space-y-4">
                      
                      {/* Test Data Edit */}
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                              <Database size={12} /> Testdaten
                          </label>
                          <input 
                              type="text"
                              className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={currentStep.testData || ''}
                              onChange={(e) => updateStepFields({ testData: e.target.value })}
                              placeholder="Testdaten bearbeiten..."
                          />
                      </div>

                      {/* Notes Edit */}
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                              <StickyNote size={12} /> Notizen
                          </label>
                          <div className="relative">
                              <textarea 
                                  className="w-full p-2 pr-10 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                                  value={currentStep.notes || ''}
                                  onChange={(e) => updateStepFields({ notes: e.target.value })}
                                  placeholder="Beobachtungen notieren..."
                              />
                              <button 
                                  onClick={startVoiceInput}
                                  className={`absolute bottom-2 right-2 p-1.5 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:text-blue-600'}`}
                                  title="Sprachaufnahme"
                              >
                                  <Mic size={14} />
                              </button>
                          </div>
                      </div>

                      {/* Duration Edit */}
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                              <Timer size={12} /> Geschätzte Dauer (Min)
                          </label>
                          <input 
                              type="number"
                              min="0"
                              className="w-24 p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={currentStep.estimatedDurationMin}
                              onChange={(e) => updateStepFields({ estimatedDurationMin: parseInt(e.target.value) || 0 })}
                          />
                      </div>

                  </div>
              )}
          </div>

          {/* Evidence Section with AI Vision */}
          <div className="mt-6 pt-6 border-t border-slate-100 relative z-10">
            {currentStep.evidence ? (
                <div className="space-y-3">
                    <div className="relative group w-fit">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <ImageIcon size={12} /> Beweisbild
                        </h3>
                        <img src={currentStep.evidence} alt="Evidence" className="h-40 w-auto rounded-lg border border-slate-200 shadow-sm" />
                        <button 
                            onClick={removeEvidence}
                            className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    {/* AI Analysis Result */}
                    {currentStep.evidenceAnalysis && (
                        <div className={`p-4 rounded-xl border ${currentStep.evidenceAnalysis.isMatch ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                             <div className="flex items-center gap-2 mb-1">
                                 {currentStep.evidenceAnalysis.isMatch ? (
                                     <CheckCircle size={18} className="text-green-600" />
                                 ) : (
                                     <AlertTriangle size={18} className="text-red-600" />
                                 )}
                                 <span className={`font-bold ${currentStep.evidenceAnalysis.isMatch ? 'text-green-800' : 'text-red-800'}`}>
                                     KI-Analyse: {currentStep.evidenceAnalysis.isMatch ? 'Übereinstimmung' : 'Abweichung erkannt!'}
                                 </span>
                             </div>
                             <p className="text-sm text-slate-700">{currentStep.evidenceAnalysis.reasoning}</p>
                        </div>
                    )}

                    {!currentStep.evidenceAnalysis && (
                         <button
                            onClick={runAICheck}
                            disabled={isAnalyzing}
                            className="flex items-center gap-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg transition-colors border border-purple-200"
                         >
                             {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <ScanEye size={16} />}
                             KI-Check (Vision)
                         </button>
                    )}
                </div>
            ) : (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors w-fit p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100"
                >
                    <Camera size={20} />
                    <span className="text-sm font-medium">Screenshot hinzufügen (für Failures)</span>
                </div>
            )}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleEvidenceUpload}
            />
          </div>

        </div>
      </div>

      {/* Footer / Controls */}
      <div className="h-24 bg-white border-t border-slate-200 flex items-center justify-center gap-4 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        
        <button 
          onClick={() => {
              if (currentIndex > 0) {
                  setCurrentIndex(prev => prev - 1);
                  setShowDetails(false);
              }
          }}
          disabled={currentIndex === 0}
          className="p-4 rounded-xl hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex gap-4">
          <button 
            onClick={() => handleStatusUpdate(StepStatus.Failed)}
            className={`flex flex-col items-center justify-center w-24 h-20 rounded-xl border transition-all group ${
                currentStep.status === StepStatus.Failed 
                ? 'bg-red-100 text-red-700 border-red-200 scale-105'
                : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:scale-105 active:scale-95'
            }`}
          >
            <XCircle size={28} className="mb-1" />
            <span className="text-xs font-bold">Fail (F)</span>
          </button>

          <button 
            onClick={() => handleStatusUpdate(StepStatus.Blocked)}
            className={`flex flex-col items-center justify-center w-24 h-20 rounded-xl border transition-all ${
                currentStep.status === StepStatus.Blocked
                ? 'bg-amber-100 text-amber-700 border-amber-200 scale-105'
                : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 hover:scale-105 active:scale-95'
            }`}
          >
            <Ban size={28} className="mb-1" />
            <span className="text-xs font-bold">Block (B)</span>
          </button>

          <button 
            onClick={() => handleStatusUpdate(StepStatus.Passed)}
            className={`flex flex-col items-center justify-center w-32 h-20 rounded-xl shadow-lg transition-all ${
                currentStep.status === StepStatus.Passed
                ? 'bg-green-700 text-white scale-105 shadow-green-200'
                : 'bg-green-600 text-white shadow-green-200 hover:bg-green-700 hover:scale-105 active:scale-95'
            }`}
          >
            <CheckCircle size={32} className="mb-1" />
            <span className="text-sm font-bold">Pass (P)</span>
          </button>
        </div>

        <button 
           onClick={() => {
               if (currentIndex < testCase.steps.length - 1) {
                   setCurrentIndex(prev => prev + 1);
                   setShowDetails(false);
               }
           }}
           disabled={currentIndex === testCase.steps.length - 1}
           className="p-4 rounded-xl hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors"
        >
          <ArrowRight size={24} />
        </button>

      </div>
      
      {/* Failure/Block Dialog Overlay */}
      <FailureDialog 
        isOpen={showFailDialog} 
        mode={failMode}
        onClose={() => setShowFailDialog(false)} 
        onConfirm={confirmFail}
      />
    </div>
  );
};

export default TestRunner;
