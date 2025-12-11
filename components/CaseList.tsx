
import React, { useState, useEffect } from 'react';
import { TestCase, Priority, CaseStatus, User } from '../types';
import { Search, ChevronRight, PlayCircle, CheckCircle, AlertCircle, Clock, Ban, Download, Rocket, LayoutGrid, List as ListIcon, GripVertical, Trash2, Archive, User as UserIcon } from 'lucide-react';
import { exportCasesToCSV, exportForZephyr } from '../utils/exportUtils';
import { storageService } from '../services/storageService';

interface CaseListProps {
  cases: TestCase[];
  onSelectCase: (testCase: TestCase) => void;
  onUpdate?: (updatedCases: TestCase[]) => void;
  onDelete?: (caseIds: string[]) => void;
  users: User[];
}

type TabType = 'active' | 'drafts';
type ViewType = 'list' | 'board';

const CaseList: React.FC<CaseListProps> = ({ cases, onSelectCase, onUpdate, onDelete, users }) => {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [viewType, setViewType] = useState<ViewType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  
  const [selectedCaseIds, setSelectedCaseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
      setCurrentUser(storageService.getCurrentUser());
  }, []);

  const getUserAvatar = (username?: string) => {
      const u = users.find(user => user.username === username);
      if (!u) return null;
      return <img src={u.avatarUrl} alt={u.name} title={`Zugewiesen an: ${u.name}`} className="w-6 h-6 rounded-full border border-white dark:border-slate-700 shadow-sm" />;
  };

  // Filter Logic
  const draftCases = cases.filter(c => c.caseStatus === CaseStatus.Draft);
  const activeCasesList = cases.filter(c => c.caseStatus !== CaseStatus.Draft);
  const displayCases = activeTab === 'active' ? activeCasesList : draftCases;

  const filteredCases = displayCases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || c.caseStatus === statusFilter;
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    
    // My Tasks Filter
    const matchesUser = !onlyMyTasks || (currentUser && c.assignedTo === currentUser.username);

    return matchesSearch && matchesStatus && matchesPriority && matchesUser;
  });

  useEffect(() => { setSelectedCaseIds(new Set()); }, [activeTab]);

  const getStatusIcon = (status: CaseStatus) => {
    switch (status) {
        case CaseStatus.Passed: return <CheckCircle className="text-green-500" size={18} />;
        case CaseStatus.Failed: return <AlertCircle className="text-red-500" size={18} />;
        case CaseStatus.Blocked: return <Ban className="text-amber-500" size={18} />;
        case CaseStatus.InProgress: return <PlayCircle className="text-blue-500" size={18} />;
        case CaseStatus.Draft: return <Archive className="text-slate-400" size={18} />;
        default: return <Clock className="text-slate-300" size={18} />;
    }
  };

  // Drag and Drop Logic for Kanban
  const handleDragStart = (e: React.DragEvent, caseId: string) => {
      e.dataTransfer.setData("caseId", caseId);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetStatus: CaseStatus) => {
      e.preventDefault();
      const caseId = e.dataTransfer.getData("caseId");
      if (!caseId || !onUpdate) return;
      
      const draggedCase = cases.find(c => c.caseId === caseId);
      if (draggedCase && draggedCase.caseStatus !== targetStatus) {
          onUpdate([{ ...draggedCase, caseStatus: targetStatus }]);
      }
  };

  // Bulk Actions
  const toggleSelection = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newSet = new Set(selectedCaseIds);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setSelectedCaseIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedCaseIds.size === filteredCases.length) setSelectedCaseIds(new Set());
      else setSelectedCaseIds(new Set(filteredCases.map(c => c.caseId)));
  };

  const handleActivateSelected = () => {
      if (!onUpdate) return;
      const casesToActivate = draftCases.filter(c => selectedCaseIds.has(c.caseId)).map(c => ({
          ...c, caseStatus: CaseStatus.NotStarted
      }));
      onUpdate(casesToActivate);
      setSelectedCaseIds(new Set());
  };

  const handleDeleteSelected = () => {
      if (!onDelete) return;
      onDelete(Array.from(selectedCaseIds));
      setSelectedCaseIds(new Set());
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* View Switcher & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 gap-4">
          <div className="flex space-x-6">
            <button onClick={() => setActiveTab('active')} className={`pb-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'active' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                <PlayCircle size={16} /> Aktive Tests ({activeCasesList.length})
            </button>
            <button onClick={() => setActiveTab('drafts')} className={`pb-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'drafts' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                <Archive size={16} /> Entwürfe ({draftCases.length})
            </button>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => setViewType('list')}
                className={`p-1.5 rounded-md transition-all ${viewType === 'list' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                title="Listenansicht"
              >
                  <ListIcon size={16} />
              </button>
              <button 
                onClick={() => setViewType('board')}
                className={`p-1.5 rounded-md transition-all ${viewType === 'board' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                title="Kanban Board"
              >
                  <LayoutGrid size={16} />
              </button>
          </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 rounded-xl shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-grow max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Suche..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex gap-2 self-end md:self-auto">
                 {selectedCaseIds.size > 0 && (
                    <div className="flex items-center gap-2 animate-fade-in mr-2">
                        {activeTab === 'drafts' && (
                            <button onClick={handleActivateSelected} className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"><Rocket size={16} /> Aktivieren</button>
                        )}
                        <button onClick={handleDeleteSelected} className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100" title="Ausgewählte löschen">
                            <Trash2 size={16} /> <span className="hidden sm:inline">Löschen ({selectedCaseIds.size})</span>
                        </button>
                    </div>
                )}
                <button 
                    onClick={() => setOnlyMyTasks(!onlyMyTasks)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${onlyMyTasks ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-transparent'}`}
                >
                    <UserIcon size={16} /> Meine Aufgaben
                </button>
                <div className="relative">
                    <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm">
                        <Download size={16} /> Export
                    </button>
                    {showExportMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-10 animate-fade-in">
                            <button onClick={() => {exportCasesToCSV(filteredCases); setShowExportMenu(false)}} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">Standard CSV</button>
                            <button onClick={() => {exportForZephyr(filteredCases); setShowExportMenu(false)}} className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">Zephyr Import</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center mr-2 border-r border-slate-200 dark:border-slate-700 pr-4">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={filteredCases.length > 0 && selectedCaseIds.size === filteredCases.length} onChange={toggleSelectAll} />
                <span className="ml-2 text-xs font-bold text-slate-400 uppercase">Alle</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none bg-slate-50 dark:bg-slate-800 dark:text-white">
                    <option value="All">Alle</option>
                    {Object.values(CaseStatus).filter(s => activeTab === 'drafts' ? s === CaseStatus.Draft : s !== CaseStatus.Draft).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Prio:</span>
                 <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none bg-slate-50 dark:bg-slate-800 dark:text-white">
                    <option value="All">Alle</option>
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
        </div>
      </div>

      {/* CONTENT: LIST or BOARD */}
      {viewType === 'list' || activeTab === 'drafts' ? (
          <div className="glass-panel rounded-xl shadow-sm overflow-hidden">
            {filteredCases.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredCases.map((c) => (
                        <div key={c.caseId} onClick={() => onSelectCase(c)} className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between group ${selectedCaseIds.has(c.caseId) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={selectedCaseIds.has(c.caseId)} onChange={(e) => toggleSelection(c.caseId, e as any)} />
                                </div>
                                <div className="flex-shrink-0">{getStatusIcon(c.caseStatus)}</div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{c.caseId}</span>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${c.priority === Priority.High ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' : c.priority === Priority.Medium ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' : 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400'}`}>{c.priority.toUpperCase()}</span>
                                    </div>
                                    <h3 className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.title}</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {getUserAvatar(c.assignedTo)}
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if(onDelete) onDelete([c.caseId]); 
                                    }}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    title="Löschen"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400" size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center text-slate-400 dark:text-slate-500"><p>Keine Testfälle gefunden.</p></div>
            )}
          </div>
      ) : (
          /* KANBAN BOARD VIEW */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-250px)] overflow-hidden">
              {[
                  { id: CaseStatus.NotStarted, label: 'Offen', color: 'border-slate-300' },
                  { id: CaseStatus.InProgress, label: 'In Arbeit', color: 'border-blue-400' },
                  { id: CaseStatus.Passed, label: 'Erledigt', color: 'border-green-400' },
                  { id: 'FailBlock', label: 'Probleme', color: 'border-red-400' }
              ].map(col => (
                  <div 
                    key={col.id} 
                    className="flex flex-col glass-panel rounded-xl h-full bg-slate-50/50 dark:bg-slate-800/30"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id === 'FailBlock' ? CaseStatus.Failed : col.id as CaseStatus)}
                  >
                      <div className={`p-3 border-b border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-300 flex justify-between border-l-4 ${col.color}`}>
                          {col.label}
                          <span className="bg-slate-200 dark:bg-slate-700 text-xs px-2 py-0.5 rounded-full">
                              {filteredCases.filter(c => col.id === 'FailBlock' ? (c.caseStatus === CaseStatus.Failed || c.caseStatus === CaseStatus.Blocked) : c.caseStatus === col.id).length}
                          </span>
                      </div>
                      <div className="p-2 overflow-y-auto space-y-2 flex-grow custom-scrollbar">
                          {filteredCases
                              .filter(c => col.id === 'FailBlock' ? (c.caseStatus === CaseStatus.Failed || c.caseStatus === CaseStatus.Blocked) : c.caseStatus === col.id)
                              .map(c => (
                                  <div 
                                    key={c.caseId}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, c.caseId)}
                                    onClick={() => onSelectCase(c)}
                                    className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 cursor-grab active:cursor-grabbing group relative"
                                  >
                                      <div className="flex justify-between items-start mb-2">
                                          <span className={`text-[10px] font-bold px-1.5 rounded border ${c.priority === Priority.High ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{c.priority}</span>
                                          <div className="flex gap-1">
                                             <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if(onDelete) onDelete([c.caseId]); 
                                                }}
                                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Löschen"
                                             >
                                                <Trash2 size={14} />
                                             </button>
                                             <GripVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100" />
                                          </div>
                                      </div>
                                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 mb-3">{c.title}</p>
                                      <div className="flex items-center justify-between mt-auto">
                                          <div className="flex items-center gap-1 text-xs text-slate-400">
                                              <Clock size={12} />
                                              {c.estimatedDurationMin}m
                                          </div>
                                          {getUserAvatar(c.assignedTo)}
                                      </div>
                                  </div>
                              ))
                          }
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default CaseList;
