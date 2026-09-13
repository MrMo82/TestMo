import React from 'react';
import { CheckCircle2, Circle, Clock, XCircle, Ban, FileEdit, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CaseStatus, ConfirmationStatus, Readiness } from '../types';

type BadgeKind = CaseStatus | ConfirmationStatus | Readiness | string;

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  className: string;
}

// Semantische Zuordnung Status -> Icon/Text/Farbe. Ein Status wird nie ausschliesslich
// ueber Farbe vermittelt (Abschnitt CC/MM, AC-BRAND-08): Icon + Text + aria-label.
const STATUS_CONFIG: Record<string, StatusConfig> = {
  [CaseStatus.Draft]: { label: 'Entwurf', icon: FileEdit, className: 'bg-[color:var(--color-background-subtle)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border-default)]' },
  [CaseStatus.NotStarted]: { label: 'Noch nicht gestartet', icon: Circle, className: 'bg-[color:var(--color-background-subtle)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border-default)]' },
  [CaseStatus.InProgress]: { label: 'In Bearbeitung', icon: Clock, className: 'bg-[color:var(--color-action-primary)]/10 text-[color:var(--color-action-primary)] border-[color:var(--color-action-primary)]/30' },
  [CaseStatus.Passed]: { label: 'Bestanden', icon: CheckCircle2, className: 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] border-[color:var(--color-success)]/30' },
  [CaseStatus.Failed]: { label: 'Fehlgeschlagen', icon: XCircle, className: 'bg-[color:var(--color-error)]/10 text-[color:var(--color-error)] border-[color:var(--color-error)]/30' },
  [CaseStatus.Blocked]: { label: 'Blockiert', icon: Ban, className: 'bg-[color:var(--color-blocked)]/10 text-[color:var(--color-blocked)] border-[color:var(--color-blocked)]/30' },
  [ConfirmationStatus.Confirmed]: { label: 'Confirmed', icon: ShieldCheck, className: 'bg-[color:var(--color-confirmed)]/10 text-[color:var(--color-confirmed)] border-[color:var(--color-confirmed)]/30' },
  [ConfirmationStatus.ReviewRequired]: { label: 'Review Required', icon: AlertTriangle, className: 'bg-[color:var(--color-review-required)]/10 text-[color:var(--color-review-required)] border-[color:var(--color-review-required)]/30' },
  [ConfirmationStatus.Deprecated]: { label: 'Deprecated', icon: Ban, className: 'bg-[color:var(--color-background-subtle)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border-default)]' },
  // Readiness.Confirmed teilt denselben String-Wert wie ConfirmationStatus.Confirmed (bereits oben definiert).
  [Readiness.ConditionalReady]: { label: 'Conditional Ready', icon: Clock, className: 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/30' },
  [Readiness.Draft]: { label: 'Draft / Blocked', icon: FileEdit, className: 'bg-[color:var(--color-background-subtle)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border-default)]' },
};

interface StatusBadgeProps {
  status: BadgeKind;
  className?: string;
}

/** Wiederverwendbares Status-Badge: Icon + Text + aria-label statt reiner Farbfläche. */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status as string] || { label: String(status), icon: Circle, className: 'bg-[color:var(--color-background-subtle)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border-default)]' };
  const Icon = config.icon;
  return (
    <span
      role="status"
      aria-label={config.label}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
