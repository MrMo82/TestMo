
import React from 'react';
import { ActivityLog } from '../types';
import { Clock, PlusCircle, Edit, Trash2, PlayCircle, LogIn, FileText } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  
  const getIcon = (action: ActivityLog['action']) => {
      switch (action) {
          case 'create': return <PlusCircle size={14} className="text-green-500" />;
          case 'update': return <Edit size={14} className="text-blue-500" />;
          case 'delete': return <Trash2 size={14} className="text-red-500" />;
          case 'status_change': return <PlayCircle size={14} className="text-purple-500" />;
          case 'import': return <FileText size={14} className="text-amber-500" />;
          case 'login': return <LogIn size={14} className="text-slate-500" />;
          default: return <Clock size={14} className="text-slate-400" />;
      }
  };

  const formatTime = (isoString: string) => {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Gerade eben';
      if (diffMins < 60) return `vor ${diffMins} Min`;
      if (diffHours < 24) return `vor ${diffHours} Std`;
      return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="h-full flex flex-col">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={16} /> Projekt Aktivität
        </h3>
        
        <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {activities.length > 0 ? (
                activities.map(log => (
                    <div key={log.id} className="flex gap-3 items-start group">
                        <div className="mt-1 p-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex-shrink-0 group-hover:scale-110 transition-transform">
                            {getIcon(log.action)}
                        </div>
                        <div className="min-w-0 flex-grow">
                            <p className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate">
                                <span className="text-slate-600 dark:text-slate-400 font-normal">{log.user}</span> {log.action === 'create' ? 'erstellte' : log.action === 'status_change' ? 'änderte Status von' : log.action === 'delete' ? 'löschte' : log.action === 'update' ? 'bearbeitete' : 'Aktion:'} <span className="text-blue-600 dark:text-blue-400">{log.target}</span>
                            </p>
                            {log.details && (
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 truncate">{log.details}</p>
                            )}
                            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">{formatTime(log.timestamp)}</p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center text-slate-400 py-8 text-sm italic">
                    Noch keine Aktivitäten protokolliert.
                </div>
            )}
        </div>
    </div>
  );
};

export default ActivityFeed;
