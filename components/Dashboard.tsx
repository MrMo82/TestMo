
import React, { useState, useEffect } from 'react';
import { TestCase, CaseStatus, StepStatus, Priority, ActivityLog } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  CheckCircle, AlertTriangle, Activity, Layers, Bug, Ban, AlertCircle, MousePointerClick
} from 'lucide-react';
import DashboardDrillDown from './DashboardDrillDown';
import ActivityFeed from './ActivityFeed';
import { storageService } from '../services/storageService';

interface DashboardProps {
  cases: TestCase[];
}

const COLORS = {
  Passed: '#22c55e',
  Failed: '#ef4444',
  Blocked: '#f59e0b',
  InProgress: '#3b82f6',
  NotStarted: '#94a3b8',
  Draft: '#cbd5e1'
};

const Dashboard: React.FC<DashboardProps> = ({ cases }) => {
  const [drillDownConfig, setDrillDownConfig] = useState<{title: string, data: TestCase[], color: string} | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
      setActivities(storageService.getActivities());
  }, [cases]); // Refresh when cases change as this usually implies activity

  // Data Prep
  const activeCases = cases.filter(c => c.caseStatus !== CaseStatus.Draft);
  const drafts = cases.filter(c => c.caseStatus === CaseStatus.Draft);
  
  const stats = {
    total: activeCases.length,
    passed: activeCases.filter(c => c.caseStatus === CaseStatus.Passed).length,
    failed: activeCases.filter(c => c.caseStatus === CaseStatus.Failed).length,
    blocked: activeCases.filter(c => c.caseStatus === CaseStatus.Blocked).length,
    inProgress: activeCases.filter(c => c.caseStatus === CaseStatus.InProgress).length,
    notStarted: activeCases.filter(c => c.caseStatus === CaseStatus.NotStarted).length,
    drafts: drafts.length
  };

  const startedCases = stats.total - stats.notStarted;
  const passRate = startedCases > 0 ? Math.round(((stats.passed) / startedCases) * 100) : 0;

  // Quality Matrix Data
  const priorities = [Priority.High, Priority.Medium, Priority.Low];
  const matrixData = priorities.map(prio => {
    const subset = activeCases.filter(c => c.priority === prio);
    return {
      name: prio,
      Failed: subset.filter(c => c.caseStatus === CaseStatus.Failed).length,
      Blocked: subset.filter(c => c.caseStatus === CaseStatus.Blocked).length,
      Passed: subset.filter(c => c.caseStatus === CaseStatus.Passed).length,
      InProgress: subset.filter(c => c.caseStatus === CaseStatus.InProgress).length,
      NotStarted: subset.filter(c => c.caseStatus === CaseStatus.NotStarted).length,
    };
  });

  // Hotspots
  const tagFailures: Record<string, number> = {};
  activeCases.filter(c => c.caseStatus === CaseStatus.Failed || c.caseStatus === CaseStatus.Blocked).forEach(c => {
    (c.tags || []).forEach(tag => {
      if (['Regression', 'Smoke', 'Automated'].includes(tag)) return;
      tagFailures[tag] = (tagFailures[tag] || 0) + 1;
    });
  });

  const hotspotData = Object.entries(tagFailures)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Recent Defects
  const recentDefects = activeCases
    .filter(c => c.caseStatus === CaseStatus.Failed || c.caseStatus === CaseStatus.Blocked)
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 5);

  // Execution Trend
  const dateGroups: Record<string, {passed: number, failed: number}> = {};
  activeCases.forEach(c => {
      const date = new Date(c.lastUpdated).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      if (!dateGroups[date]) dateGroups[date] = { passed: 0, failed: 0 };
      if (c.caseStatus === CaseStatus.Passed) dateGroups[date].passed++;
      if (c.caseStatus === CaseStatus.Failed || c.caseStatus === CaseStatus.Blocked) dateGroups[date].failed++;
  });
  
  const trendData = Object.entries(dateGroups)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => new Date(a.date.split('.').reverse().join('-')).getTime() - new Date(b.date.split('.').reverse().join('-')).getTime())
    .slice(-7);

  const handleCardClick = (type: string) => {
      let filtered: TestCase[] = [];
      let color = 'text-slate-800';
      switch(type) {
          case 'Total': filtered = activeCases; break;
          case 'Passed': filtered = activeCases.filter(c => c.caseStatus === CaseStatus.Passed); color = 'text-green-600'; break;
          case 'Failed': filtered = activeCases.filter(c => c.caseStatus === CaseStatus.Failed || c.caseStatus === CaseStatus.Blocked); color = 'text-red-600'; break;
          case 'Drafts': filtered = drafts; color = 'text-purple-600'; break;
      }
      setDrillDownConfig({ title: type, data: filtered, color });
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Management Cockpit</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Echtzeit-Übersicht des Projektstatus.</p>
        </div>
        <div className="text-left md:text-right hidden md:block glass-panel px-4 py-2 rounded-lg">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gesamtfortschritt</span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{passRate}% <span className="text-sm text-slate-400 font-normal">Pass Rate</span></div>
        </div>
      </div>
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Aktive Tests" value={stats.total} icon={<Activity size={20} />} color="blue" onClick={() => handleCardClick('Total')} />
        <KPICard title="Erfolgreich" value={stats.passed} icon={<CheckCircle size={20} />} color="green" onClick={() => handleCardClick('Passed')} subtext={`${Math.round((stats.passed / (stats.total || 1)) * 100)}% Success`} />
        <KPICard title="Blocker / Failed" value={stats.failed + stats.blocked} icon={<AlertTriangle size={20} />} color="red" onClick={() => handleCardClick('Failed')} subtext={stats.failed > 0 ? "Kritische Fehler!" : "System Stabil"} />
        <KPICard title="Backlog" value={stats.drafts} icon={<Layers size={20} />} color="purple" onClick={() => handleCardClick('Drafts')} subtext="Entwürfe" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main Content (Left 3 cols) */}
        <div className="xl:col-span-3 space-y-6">
             {/* Quality Matrix */}
            <div className="glass-panel p-6 rounded-xl shadow-sm min-w-0">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Quality Matrix</h3>
                <p className="text-sm text-slate-500 mb-6">Statusverteilung nach Priorität (Risk Analysis)</p>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={matrixData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.9)', color: '#000'}} />
                        <Legend iconType="circle" />
                        <Bar dataKey="Failed" stackId="a" fill={COLORS.Failed} barSize={50} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Blocked" stackId="a" fill={COLORS.Blocked} barSize={50} />
                        <Bar dataKey="Passed" stackId="a" fill={COLORS.Passed} barSize={50} />
                        <Bar dataKey="InProgress" stackId="a" fill={COLORS.InProgress} barSize={50} />
                        <Bar dataKey="NotStarted" stackId="a" fill={COLORS.NotStarted} radius={[0, 0, 4, 4]} barSize={50} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="glass-panel p-6 rounded-xl shadow-sm min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Execution Velocity</h3>
                    <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.Passed} stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor={COLORS.Passed} stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.Failed} stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor={COLORS.Failed} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                                <Area type="monotone" dataKey="passed" stroke={COLORS.Passed} fillOpacity={1} fill="url(#colorPassed)" />
                                <Area type="monotone" dataKey="failed" stroke={COLORS.Failed} fillOpacity={1} fill="url(#colorFailed)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Hotspots */}
                <div className="glass-panel p-6 rounded-xl shadow-sm min-w-0 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">System Hotspots</h3>
                    <div className="flex-grow space-y-4">
                         {hotspotData.map((item) => (
                             <div key={item.name} className="relative">
                                 <div className="flex justify-between text-sm mb-1 text-slate-700 dark:text-slate-300">
                                     <span>{item.name}</span>
                                     <span className="font-bold text-red-500">{item.value} Fehler</span>
                                 </div>
                                 <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                     <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(item.value / (stats.failed || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         ))}
                         {hotspotData.length === 0 && <p className="text-center text-slate-400 text-sm mt-8">Keine Hotspots erkannt.</p>}
                    </div>
                </div>
            </div>
        </div>

        {/* Right Sidebar (1 col) - Feed & Defects */}
        <div className="space-y-6">
            
            {/* Activity Feed */}
            <div className="glass-panel p-6 rounded-xl shadow-sm h-[400px]">
                <ActivityFeed activities={activities} />
            </div>

            {/* Live Defect Feed */}
            <div className="glass-panel rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-red-50/50 dark:bg-red-900/10 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Bug size={18} className="text-red-500" /> Defects
                    </h3>
                </div>
                <div className="flex-grow overflow-y-auto p-2">
                    {recentDefects.length > 0 ? recentDefects.map(c => (
                        <div key={c.caseId} className="p-3 mb-2 rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-red-200 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-mono text-slate-400">{c.caseId}</span>
                                <span className="text-[10px] px-1.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold">{c.priority}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">{c.title}</p>
                        </div>
                    )) : (
                        <div className="text-center text-slate-400 py-8 text-sm">Keine offenen Fehler.</div>
                    )}
                </div>
            </div>

        </div>

      </div>

      {drillDownConfig && (
          <DashboardDrillDown 
             title={drillDownConfig.title} 
             cases={drillDownConfig.data} 
             onClose={() => setDrillDownConfig(null)} 
             colorClass={drillDownConfig.color}
          />
      )}
    </div>
  );
};

const KPICard = ({ title, value, icon, color, onClick, subtext }: any) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
    };

    return (
        <div onClick={onClick} className="glass-panel p-5 rounded-xl shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
                </div>
                <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} transition-colors`}>
                    {icon}
                </div>
            </div>
            {subtext && (
                <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-slate-400 gap-2">
                    {subtext}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
