
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TestCaseGenerator from './components/TestCaseGenerator';
import CaseList from './components/CaseList';
import CaseDetail from './components/CaseDetail';
import BulkUpload from './components/BulkUpload';
import OnboardingModal from './components/OnboardingModal';
import Login from './components/Login';
import TestRunner from './components/TestRunner';
import ProjectSettingsModal from './components/ProjectSettingsModal';
import UserManagementModal from './components/UserManagementModal';
import { TestCase, Priority, CaseStatus, StepStatus, User, ProjectSettings } from './types';
import { storageService } from './services/storageService';
import { Layout, Plus, FileText, Upload, HelpCircle, ShieldCheck, LogOut, User as UserIcon, Settings, Moon, Sun, Users } from 'lucide-react';

const INITIAL_CASES_DATA: TestCase[] = [];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<'dashboard' | 'create' | 'list' | 'detail' | 'import' | 'runner'>('dashboard');
  const [cases, setCases] = useState<TestCase[]>(() => storageService.loadCases(INITIAL_CASES_DATA));
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(() => storageService.loadProjectSettings());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('testmo_theme') === 'dark');

  useEffect(() => {
    const user = storageService.getCurrentUser();
    if (user) setCurrentUser(user);
    if (user && !storageService.loadProjectSettings()) setShowSettingsModal(true);
    if (!localStorage.getItem('cmp_onboarding_seen')) setShowOnboarding(true);
    
    // Load users initially
    setUsers(storageService.getUsers());
  }, []);

  useEffect(() => { storageService.saveCases(cases); }, [cases]);

  // Apply Theme
  useEffect(() => {
      if (isDarkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('testmo_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setUsers(storageService.getUsers()); // Ensure users are loaded on login
    localStorage.setItem('cmp_onboarding_seen', 'true');
    if (!projectSettings) setShowSettingsModal(true);
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
  };

  const handleUserUpdate = () => {
      setUsers(storageService.getUsers());
  };

  const handleSaveSettings = (settings: ProjectSettings) => {
      setProjectSettings(settings);
      storageService.saveProjectSettings(settings);
  };

  const handleSaveCase = (newCases: TestCase | TestCase[]) => {
    const casesToProcess = Array.isArray(newCases) ? newCases : [newCases];
    setCases(prev => {
        const caseMap = new Map(prev.map(c => [c.caseId, c]));
        casesToProcess.forEach(c => caseMap.set(c.caseId, c));
        return Array.from(caseMap.values());
    });

    storageService.logActivity(currentUser?.name || 'User', 'create', casesToProcess.length === 1 ? casesToProcess[0].caseId : `${casesToProcess.length} Cases`);

    if (editingCase && casesToProcess.length === 1) {
         setSelectedCase(casesToProcess[0]);
         setView('detail');
    } else if (view === 'create') setView('list');
    setEditingCase(null);
  };

  const handleUpdateCase = (updatedCase: TestCase) => {
    setCases(prev => prev.map(c => c.caseId === updatedCase.caseId ? updatedCase : c));
    if (selectedCase?.caseId === updatedCase.caseId) setSelectedCase(updatedCase);
  };

  const handleBulkUpdateCases = (updatedCases: TestCase[]) => {
      setCases(prev => {
          const updatedMap = new Map(updatedCases.map(c => [c.caseId, c]));
          return prev.map(c => updatedMap.get(c.caseId) || c);
      });
      storageService.logActivity(currentUser?.name || 'User', 'update', 'Bulk Update', `${updatedCases.length} cases`);
  };

  const handleDeleteCase = (caseId: string) => {
      if (window.confirm("Testfall löschen?")) {
          setCases(prev => prev.filter(c => c.caseId !== caseId));
          if (selectedCase?.caseId === caseId) {
              setView('list');
              setSelectedCase(null);
          }
          storageService.logActivity(currentUser?.name || 'User', 'delete', caseId);
      }
  };

  const handleBulkDeleteCases = (caseIds: string[]) => {
      if (window.confirm(`${caseIds.length} Testfälle löschen?`)) {
          setCases(prev => prev.filter(c => !caseIds.includes(c.caseId)));
          storageService.logActivity(currentUser?.name || 'User', 'delete', 'Bulk Delete', `${caseIds.length} cases`);
      }
  };

  const handleDuplicateCase = (testCase: TestCase) => {
      const newId = `TC-${Math.floor(Math.random() * 10000)}`;
      const duplicatedCase: TestCase = {
          ...testCase,
          caseId: newId,
          title: `${testCase.title} (Kopie)`,
          caseStatus: CaseStatus.NotStarted,
          lastUpdated: new Date().toISOString(),
          steps: testCase.steps.map(s => ({ ...s, status: StepStatus.NotStarted, evidence: undefined, evidenceAnalysis: undefined, notes: undefined }))
      };
      setCases(prev => [duplicatedCase, ...prev]);
      storageService.logActivity(currentUser?.name || 'User', 'create', newId, `Duplicated from ${testCase.caseId}`);
  };

  const handleResetCase = (testCase: TestCase) => {
      if (window.confirm("Reset?")) {
          const resetCase: TestCase = {
              ...testCase,
              caseStatus: CaseStatus.NotStarted,
              lastUpdated: new Date().toISOString(),
              steps: testCase.steps.map(s => ({ ...s, status: StepStatus.NotStarted, evidence: undefined, evidenceAnalysis: undefined, notes: undefined }))
          };
          handleUpdateCase(resetCase);
          storageService.logActivity(currentUser?.name || 'User', 'status_change', testCase.caseId, 'Reset (Regression)');
      }
  };

  const handleSelectCase = (testCase: TestCase) => { setSelectedCase(testCase); setView('detail'); };
  const handleOpenUpgradeAssistant = (testCase: TestCase) => { setEditingCase(testCase); setView('create'); };
  const handleImport = (importedCases: TestCase[]) => { 
      setCases(prev => [...importedCases, ...prev]); 
      setView('list'); 
      storageService.logActivity(currentUser?.name || 'User', 'import', `${importedCases.length} Cases`);
  };

  if (!currentUser) return <Login onLoginSuccess={handleLoginSuccess} />;
  if (view === 'runner' && selectedCase) return <TestRunner testCase={selectedCase} onUpdate={handleUpdateCase} onClose={() => setView('detail')} projectSettings={projectSettings} />;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} animate-fade-in print-container`}>
      <header className="glass-panel sticky top-0 z-30 no-print border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-lg shadow-blue-500/30"><ShieldCheck size={24} /></div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">TestMo</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {currentUser.role === 'Admin' && (
                <button onClick={() => setShowUserModal(true)} className="text-slate-400 hover:text-blue-600 transition-colors"><Users size={22} /></button>
            )}
            <button onClick={() => setShowSettingsModal(true)} className="text-slate-400 hover:text-blue-600 transition-colors"><Settings size={22} /></button>
            <button onClick={() => setShowOnboarding(true)} className="text-slate-400 hover:text-blue-600 transition-colors"><HelpCircle size={22} /></button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end"><span className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentUser.name}</span><span className="text-[10px] text-slate-400 uppercase tracking-wider">{currentUser.role}</span></div>
                {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="User" className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700" /> : <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center"><UserIcon size={18} /></div>}
                <button onClick={handleLogout} className="ml-2 p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      <div className="glass-panel border-b border-white/20 shadow-sm z-20 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button onClick={() => { setView('dashboard'); setEditingCase(null); }} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${view === 'dashboard' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Layout size={18} /> Dashboard</button>
            <button onClick={() => { setView('list'); setEditingCase(null); }} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${view === 'list' || view === 'detail' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><FileText size={18} /> Testfälle</button>
            <button onClick={() => { setView('create'); setEditingCase(null); }} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${view === 'create' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Plus size={18} /> {editingCase ? 'Bearbeiten' : 'Neu (KI)'}</button>
            <button onClick={() => { setView('import'); setEditingCase(null); }} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${view === 'import' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Upload size={18} /> Import</button>
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full print-container">
        {view === 'dashboard' && <Dashboard cases={cases} />}
        {view === 'create' && <TestCaseGenerator onSave={handleSaveCase} onCancel={() => { setView('dashboard'); setEditingCase(null); }} projectSettings={projectSettings} initialCase={editingCase} />}
        {view === 'list' && <CaseList cases={cases} onSelectCase={handleSelectCase} onUpdate={handleBulkUpdateCases} onDelete={handleBulkDeleteCases} users={users} />}
        {view === 'detail' && selectedCase && <CaseDetail testCase={selectedCase} onUpdate={handleUpdateCase} onBack={() => setView('list')} onStartRunner={() => setView('runner')} onDelete={handleDeleteCase} onDuplicate={handleDuplicateCase} onReset={handleResetCase} onUpgrade={handleOpenUpgradeAssistant} onAddCases={handleSaveCase} projectSettings={projectSettings} users={users} />}
        {view === 'import' && <BulkUpload onImport={handleImport} onCancel={() => setView('dashboard')} projectSettings={projectSettings} />}
      </main>

      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      <ProjectSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} onSave={handleSaveSettings} initialSettings={projectSettings} />
      {currentUser.role === 'Admin' && (
          <UserManagementModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} currentUser={currentUser} onUserUpdate={handleUserUpdate} />
      )}
    </div>
  );
}
