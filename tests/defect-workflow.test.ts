import { describe, expect, it } from 'vitest';
import { CaseStatus, Priority, StepStatus, TestCase, TestStep } from '../types';
import { createDefectTicket, formatDefectTicketMarkdown } from '../services/defectService';

const sourceCase: TestCase = {
  caseId: 'TC-42',
  title: 'Anmeldung prüfen',
  summary: 'Login validieren',
  tags: [],
  priority: Priority.High,
  type: 'functional',
  preconditions: [],
  estimatedDurationMin: 5,
  estimatedEffort: 'S',
  steps: [],
  caseStatus: CaseStatus.Failed,
  lastUpdated: '2026-09-13T09:00:00Z',
  createdBy: 'tester'
};

const failedStep: TestStep = {
  stepId: 'step-2',
  sequence: 2,
  description: 'Anmeldung absenden',
  expectedResult: 'Dashboard wird geöffnet',
  estimatedDurationMin: 1,
  priority: Priority.High,
  status: StepStatus.Failed,
  evidence: 'data:image/png;base64,fixture'
};

const report = {
  title: 'Dashboard wird nicht geöffnet',
  description: 'Der Login bleibt auf der Anmeldeseite.',
  stepsToReproduce: '1. Zugangsdaten eingeben\n2. Absenden',
  expectedVsActual: 'Erwartet: Dashboard. Tatsächlich: Anmeldeseite.',
  severity: 'Major' as const
};

describe('Defect-Workflow', () => {
  it('übernimmt nur vorhandenen Testkontext in ein neues Ticket', () => {
    const ticket = createDefectTicket(report, { testCase: sourceCase, failedStep, projectId: 'project-1' }, '2026-09-13T10:00:00Z');

    expect(ticket.status).toBe('reported');
    expect(ticket.testCaseId).toBe('TC-42');
    expect(ticket.failedStepId).toBe('step-2');
    expect(ticket.evidence).toBe(failedStep.evidence);
    expect(ticket.createdAt).toBe('2026-09-13T10:00:00Z');
  });

  it('hält allgemeine Tickets ohne Testfallverknüpfung möglich', () => {
    const ticket = createDefectTicket(report, {}, '2026-09-13T10:00:00Z');

    expect(ticket.source).toBe('general');
    expect(ticket.testCaseId).toBeUndefined();
    expect(formatDefectTicketMarkdown(ticket)).not.toContain('**Testfall:**');
  });

  it('exportiert editierte Ticketinhalte als kopierfähiges Markdown', () => {
    const ticket = createDefectTicket({ ...report, title: 'Bearbeiteter Titel' }, { testCase: sourceCase }, '2026-09-13T10:00:00Z');
    const markdown = formatDefectTicketMarkdown(ticket);

    expect(markdown).toContain('# Bearbeiteter Titel');
    expect(markdown).toContain('TC-42 - Anmeldung prüfen');
    expect(markdown).toContain('Der Login bleibt auf der Anmeldeseite.');
  });
});