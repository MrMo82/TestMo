import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { HAYS_BRAND_COLORS, HAYS_ORGANIZATION_THEME, PRODUCT_NAME } from '../theme/brand';
import StatusBadge from './StatusBadge';
import { CaseStatus, ConfirmationStatus, Readiness } from '../types';
import BrandLogo from './BrandLogo';

interface DesignSystemPageProps {
  currentUserRole: string;
}

const ColorSwatch: React.FC<{ name: string; hex: string }> = ({ name, hex }) => (
  <div className="flex items-center gap-3 rounded-lg border border-[color:var(--color-border-default)] p-3">
    <div className="h-10 w-10 rounded-md border border-black/10" style={{ backgroundColor: hex }} aria-hidden="true" />
    <div>
      <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">{name}</p>
      <p className="font-mono text-xs text-[color:var(--color-text-secondary)]">{hex}</p>
    </div>
  </div>
);

/**
 * Nur für Admins zugängliche Styleguide-Seite (Abschnitt SS). Zeigt Tokens/Komponenten,
 * enthält keine produktiven Daten. Route: /admin/design-system (in App.tsx verdrahtet).
 */
const DesignSystemPage: React.FC<DesignSystemPageProps> = ({ currentUserRole }) => {
  if (currentUserRole !== 'Admin') {
    return (
      <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-[color:var(--color-border-default)] bg-[color:var(--color-background-surface)] p-8 text-center">
        <ShieldAlert className="text-[color:var(--color-warning)]" size={32} />
        <h2 className="text-lg font-bold text-[color:var(--color-text-primary)]">Kein Zugriff</h2>
        <p className="text-sm text-[color:var(--color-text-secondary)]">Diese Seite ist nur für Administrator:innen sichtbar.</p>
      </div>
    );
  }

  return (
    <section className="space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-text-secondary)]">Nur für Admins</p>
        <h2 className="mt-1 text-2xl font-bold text-[color:var(--color-text-primary)]">Design System – {PRODUCT_NAME}</h2>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">Referenz für Brand-/semantische Tokens und Komponenten. Keine produktiven Daten.</p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[color:var(--color-text-secondary)]">Logo</h3>
        <div className="flex flex-wrap gap-6">
          <div className="rounded-lg border border-[color:var(--color-border-default)] p-4"><BrandLogo variant="symbol" showProductName /></div>
          <div className="rounded-lg bg-[color:var(--color-text-primary)] p-4"><BrandLogo variant="reversed" showProductName /></div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[color:var(--color-text-secondary)]">Brandfarben</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Object.entries(HAYS_BRAND_COLORS).map(([name, hex]) => <ColorSwatch key={name} name={name} hex={hex} />)}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[color:var(--color-text-secondary)]">Semantische Farben (Light)</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Object.entries(HAYS_ORGANIZATION_THEME.semanticColors.light).map(([name, hex]) => <ColorSwatch key={name} name={name} hex={hex} />)}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[color:var(--color-text-secondary)]">Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg bg-[color:var(--color-action-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-action-primary-hover)]">Primary</button>
          <button className="rounded-lg bg-[color:var(--color-action-secondary)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-primary)]">Secondary</button>
          <button className="rounded-lg border border-[color:var(--color-border-default)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-primary)]">Tertiary</button>
          <button className="rounded-lg bg-[color:var(--color-error)] px-4 py-2 text-sm font-semibold text-white">Destructive</button>
          <button className="rounded-lg bg-[color:var(--color-success)] px-4 py-2 text-sm font-semibold text-white">Success</button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[color:var(--color-text-secondary)]">Status-Badges</h3>
        <div className="flex flex-wrap gap-2">
          {[CaseStatus.Draft, CaseStatus.NotStarted, CaseStatus.InProgress, CaseStatus.Passed, CaseStatus.Failed, CaseStatus.Blocked].map(s => <StatusBadge key={s} status={s} />)}
          {[ConfirmationStatus.Confirmed, ConfirmationStatus.ReviewRequired, ConfirmationStatus.Deprecated].map(s => <StatusBadge key={s} status={s} />)}
          {[Readiness.Confirmed, Readiness.ConditionalReady, Readiness.Draft].map(s => <StatusBadge key={s} status={s} />)}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[color:var(--color-text-secondary)]">Chart-Palette</h3>
        <div className="flex flex-wrap gap-3">
          {HAYS_ORGANIZATION_THEME.chartPalette.map((hex, i) => <ColorSwatch key={hex} name={`Serie ${i + 1}`} hex={hex} />)}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[color:var(--color-text-secondary)]">Typografie</h3>
        <div className="space-y-2">
          <p className={HAYS_ORGANIZATION_THEME.typography.pageTitle}>Seitentitel</p>
          <p className={HAYS_ORGANIZATION_THEME.typography.sectionTitle}>Bereichsüberschrift</p>
          <p className={HAYS_ORGANIZATION_THEME.typography.body}>Fließtext für normale Inhalte.</p>
          <p className="font-mono text-xs">DXFNM · IRIS-ID/BPID · Correlation-ID (Monospace)</p>
        </div>
      </div>
    </section>
  );
};

export default DesignSystemPage;
