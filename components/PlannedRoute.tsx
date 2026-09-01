import React from 'react';
import { Construction } from 'lucide-react';
import { PRODUCT_NAME } from '../theme/brand';

interface PlannedRouteProps {
  title: string;
}

const PlannedRoute: React.FC<PlannedRouteProps> = ({ title }) => (
  <section className="glass-panel rounded-xl border border-slate-200 p-8 shadow-sm dark:border-slate-700">
    <div className="flex items-start gap-4">
      <div className="rounded-lg bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <Construction size={24} aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{PRODUCT_NAME}</p>
        <h2 className="mt-1 text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Dieser Bereich wird in einer kommenden Migrationsphase aktiviert.
        </p>
      </div>
    </div>
  </section>
);

export default PlannedRoute;
