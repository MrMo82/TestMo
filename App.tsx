
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
import PlannedRoute from './components/PlannedRoute';
import ProjectsPage from './components/ProjectsPage';
import ProjectOverviewPage from './components/ProjectOverviewPage';
import SourcesPage from './components/SourcesPage';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { TestCase, Priority, CaseStatus, StepStatus, User, ProjectSettings } from './types';
import { storageService } from './services/storageService';
import { Layout, Plus, FileText, Upload, HelpCircle, ShieldCheck, LogOut, User as UserIcon, Settings, Moon, Sun, FolderKanban } from 'lucide-react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const INITIAL_CASES_DATA: TestCase[] = [];

type View = 'dashboard' | 'create' | 'list' | 'detail' | 'import' | 'runner';
const PROJECT_ID = 'legacy-project';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile: currentUser, loading: authLoading, signOut } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [cases, setCases] = useState<TestCase[]>(() => storageService.loadCases(INITIAL_CASES_DATA));
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(() => storageService.loadProjectSettings());
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const goTo = (nextView: View, caseId?: string) => {
    setView(nextView);
    const base = `/projects/${PROJECT_ID}`;
    const paths: Record<View, string> = {
      dashboard: base,
      create: `${base}/test-cases/new`,
      list: `${base}/test-cases`,
      detail: `${base}/test-cases/${caseId || selectedCase?.caseId || ''}`,
      import: `${base}/import-export`,
      runner: `${base}/test-cases/${caseId || selectedCase?.caseId || ''}/run`
    };
    navigate(paths[nextView]);
  };

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') return;
    if (path === '/projects' || path === `/projects/${PROJECT_ID}`) setView('dashboard');
    else if (path.endsWith('/test-cases/new')) setView('create');
    else if (path.endsWith('/test-cases')) setView('list');
    else if (path.endsWith('/import-export')) setView('import');
    else if (path.includes('/test-cases/') && path.endsWith('/run')) setView('runner');
    else if (path.includes('/test-cases/')) {
      const caseId = path.split('/').pop();
      const matchingCase = cases.find(testCase => testCase.caseId === caseId);
      if (matchingCase) setSelectedCase(matchingCase);
      setView('detail');
    }
  }, [cases, location.pathname]);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('testmo_theme') === 'dark');

  useEffect(() => {
    if (currentUser && !storageService.loadProjectSettings()) setShowSettingsModal(true);
    if (!localStorage.getItem('testmo_onboarding_seen')) setShowOnboarding(true);
    
    setUsers([]);
  }, [currentUser]);

  useEffect(() => { storageService.saveCases(cases); }, [cases]);

  // Apply Theme
  useEffect(() => {
      if (isDarkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('testmo_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

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
            goTo('detail', casesToProcess[0].caseId);
          } else if (view === 'create') goTo('list');
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
              goTo('list');
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

  const handleSelectCase = (testCase: TestCase) => { setSelectedCase(testCase); goTo('detail', testCase.caseId); };
  const handleOpenUpgradeAssistant = (testCase: TestCase) => { setEditingCase(testCase); goTo('create'); };
  const handleImport = (importedCases: TestCase[]) => { 
      setCases(prev => [...importedCases, ...prev]); 
      goTo('list');
      storageService.logActivity(currentUser?.name || 'User', 'import', `${importedCases.length} Cases`);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Sitzung wird geladen...</div>;
  if (!currentUser) return <Login />;
  if (view === 'runner' && selectedCase) return <TestRunner testCase={selectedCase} onUpdate={handleUpdateCase} onClose={() => goTo('detail', selectedCase.caseId)} projectSettings={projectSettings} />;

  const isPlannedRoute = ['/context', '/sources', '/requirements', '/risks', '/conditions', '/draft-scenarios', '/test-runs', '/defects', '/traceability', '/reports']
    .some(segment => location.pathname.includes(segment));
  const isSourcesRoute = location.pathname.endsWith('/sources');
  const isProjectsRoute = location.pathname === '/projects';
  const isProjectOverviewRoute = /^\/projects\/[^/]+$/.test(location.pathname) && location.pathname !== `/projects/${PROJECT_ID}`;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} animate-fade-in print-container`}>
      <header className="glass-panel sticky top-0 z-30 no-print border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => goTo('dashboard')}>
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-lg shadow-blue-500/30"><ShieldCheck size={24} /></div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">TestMo Next</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setShowSettingsModal(true)} className="text-slate-400 hover:text-blue-600 transition-colors"><Settings size={22} /></button>
            <button onClick={() => setShowOnboarding(true)} className="text-slate-400 hover:text-blue-600 transition-colors"><HelpCircle size={22} /></button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end"><span className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentUser.name}</span><span className="text-[10px] text-slate-400 uppercase tracking-wider">{currentUser.role}</span></div>
                {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="User" className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700" /> : <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center"><UserIcon size={18} /></div>}
                <button onClick={() => void signOut()} className="ml-2 p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      <div className="glass-panel border-b border-white/20 shadow-sm z-20 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button onClick={() => navigate('/projects')} className="flex items-center gap-2 border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"><FolderKanban size={18} /> Projekte</button>
            <button onClick={() => { goTo('dashboard'); setEditingCase(null); }} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${view === 'dashboard' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Layout size={18} /> Dashboard</button>
            <button onClick={() => { goTo('list'); setEditingCase(null); }} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${view === 'list' || view === 'detail' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><FileText size={18} /> Testfälle</button>
            <button onClick={() => { goTo('create'); setEditingCase(null); }} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${view === 'create' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Plus size={18} /> {editingCase ? 'Bearbeiten' : 'Neu (KI)'}</button>
            <button onClick={() => { goTo('import'); setEditingCase(null); }} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${view === 'import' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Upload size={18} /> Import</button>
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full print-container">
        {isProjectsRoute ? <ProjectsPage /> : isProjectOverviewRoute ? <ProjectOverviewPage /> : isSourcesRoute ? <SourcesPage /> : isPlannedRoute ? <PlannedRoute title="Dieser Projektbereich ist vorgemerkt" /> : view === 'dashboard' && <Dashboard cases={cases} />}
        {view === 'create' && <TestCaseGenerator onSave={handleSaveCase} onCancel={() => { goTo('dashboard'); setEditingCase(null); }} projectSettings={projectSettings} initialCase={editingCase} />}
        {view === 'list' && <CaseList cases={cases} onSelectCase={handleSelectCase} onUpdate={handleBulkUpdateCases} onDelete={handleBulkDeleteCases} users={users} />}
        {view === 'detail' && selectedCase && <CaseDetail testCase={selectedCase} onUpdate={handleUpdateCase} onBack={() => goTo('list')} onStartRunner={() => goTo('runner', selectedCase.caseId)} onDelete={handleDeleteCase} onDuplicate={handleDuplicateCase} onReset={handleResetCase} onUpgrade={handleOpenUpgradeAssistant} onAddCases={handleSaveCase} projectSettings={projectSettings} users={users} />}
        {view === 'import' && <BulkUpload onImport={handleImport} onCancel={() => goTo('dashboard')} projectSettings={projectSettings} />}
      </main>

      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      <ProjectSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} onSave={handleSaveSettings} initialSettings={projectSettings} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={`/projects/${PROJECT_ID}`} replace />} />
          <Route path="*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
