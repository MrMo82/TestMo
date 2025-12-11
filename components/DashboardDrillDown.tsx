
import React from 'react';
import { TestCase, Priority, CaseStatus } from '../types';
import { X, ArrowRight, User, Tag, AlertTriangle, CheckCircle, Ban, PlayCircle, Clock, Archive } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DrillDownProps {
  title: string;
  cases: TestCase[];
  onClose: () => void;
  colorClass: string; // e.g., 'text-red-600'
}

const COLORS = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#22c55e'
};

const DashboardDrillDown: React.FC<DrillDownProps> = ({ title, cases, onClose, colorClass }) => {
  
  // 1. Prepare Data for Pie Chart (Priority Breakdown)
  const priorityData = [
      { name: 'High', value: cases.filter(c => c.priority === Priority.High).length },
      { name: 'Medium', value: cases.filter(c => c.priority === Priority.Medium).length },
      { name: 'Low', value: cases.filter(c => c.priority === Priority.Low).length },
  ].filter(d => d.value > 0);

  // 2. Prepare Top Tags (System Breakdown)
  const tagCounts: Record<string, number> = {};
  cases.forEach(c => {
      (c.tags || []).forEach(tag => {
          if (['Regression', 'Smoke', 'Automated'].includes(tag)) return; // Filter generic tags
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
  });
  const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

  const getStatusIcon = (status: CaseStatus) => {
      switch (status) {
          case CaseStatus.Failed: return <AlertTriangle size={16} />;
          case CaseStatus.Passed: return <CheckCircle size={16} />;
          case CaseStatus.Blocked: return <Ban size={16} />;
          case CaseStatus.InProgress: return <PlayCircle size={16} />;
          case CaseStatus.Draft: return <Archive size={16} />;
          default: return <Clock size={16} />;
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
            <div>
                <h2 className={`text-2xl font-bold ${colorClass} flex items-center gap-2`}>
                    {title}
                    <span className="bg-slate-200 text-slate-600 text-sm px-3 py-1 rounded-full">{cases.length}</span>
                </h2>
                <p className="text-slate-500 text-sm mt-1">Detaillierte Analyse der betroffenen Testfälle</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X size={24} />
            </button>
        </div>

        {/* Content Grid */}
        <div className="flex-grow overflow-hidden grid grid-cols-1 lg:grid-cols-3">
            
            {/* Left Col: List of Cases */}
            <div className="lg:col-span-2 overflow-y-auto p-6 border-r border-slate-100 bg-white">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Betroffene Testfälle</h3>
                
                {cases.length > 0 ? (
                    <div className="space-y-3">
                        {cases.map(c => (
                            <div key={c.caseId} className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-${c.caseStatus === CaseStatus.Failed ? 'red' : 'slate'}-500`}>
                                            {getStatusIcon(c.caseStatus)}
                                        </span>
                                        <h4 className="font-semibold text-slate-800">{c.title}</h4>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{c.caseId}</span>
                                </div>
                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{c.summary}</p>
                                
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className={`px-2 py-0.5 rounded border ${
                                        c.priority === Priority.High ? 'bg-red-50 border-red-100 text-red-700' :
                                        c.priority === Priority.Medium ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                        'bg-green-50 border-green-100 text-green-700'
                                    }`}>
                                        {c.priority}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User size={12} /> {c.createdBy}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} /> {new Date(c.lastUpdated).toLocaleDateString('de-DE')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <p>Keine Daten vorhanden.</p>
                    </div>
                )}
            </div>

            {/* Right Col: Insights */}
            <div className="bg-slate-50/50 p-6 overflow-y-auto space-y-8">
                
                {/* Priority Breakdown Chart */}
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Verteilung nach Priorität</h3>
                    <div className="h-48 w-full bg-white rounded-xl shadow-sm border border-slate-100 p-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={priorityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={60}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Tags / Systems */}
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Häufigste Systeme / Tags</h3>
                    <div className="space-y-3">
                        {topTags.length > 0 ? topTags.map(([tag, count], i) => (
                            <div key={tag} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 text-blue-600 p-1.5 rounded text-xs font-bold">#{i+1}</div>
                                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                        <Tag size={14} className="text-slate-400" /> {tag}
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-slate-800">{count}x</span>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-400 italic">Keine Tags verfügbar.</p>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="text-xs font-bold text-blue-600 uppercase mb-2">Insight</h3>
                    <p className="text-sm text-blue-800">
                        {cases.length > 0 
                            ? `${Math.round((cases.filter(c => c.priority === Priority.High).length / cases.length) * 100)}% dieser Fälle haben hohe Priorität.`
                            : "Keine Daten für Insights."
                        }
                    </p>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardDrillDown;
