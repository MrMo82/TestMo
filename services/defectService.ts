import type { DefectReport } from './geminiService';
import { DefectTicket, TestCase, TestStep } from '../types';

export interface DefectContext {
  testCase?: TestCase;
  failedStep?: TestStep;
  projectId?: string;
  evidence?: string;
}

export const createDefectTicket = (report: DefectReport, context: DefectContext = {}, now = new Date().toISOString()): DefectTicket => ({
  ...report,
  id: `DEF-${Date.now()}`,
  status: 'reported',
  projectId: context.projectId,
  testCaseId: context.testCase?.caseId,
  testCaseTitle: context.testCase?.title,
  failedStepId: context.failedStep?.stepId,
  failedStepDescription: context.failedStep?.description,
  evidence: context.evidence || context.failedStep?.evidence,
  createdAt: now,
  updatedAt: now,
  source: context.testCase ? 'test-case' : 'general'
});

export const formatDefectTicketMarkdown = (ticket: DefectTicket): string => `# ${ticket.title}

- **Ticket-ID:** ${ticket.id}
- **Status:** ${ticket.status}
- **Schweregrad:** ${ticket.severity}
- **Umgebung:** ${ticket.environment || 'Nicht angegeben'}
- **Kategorie:** ${ticket.category || 'Nicht angegeben'}
${ticket.testCaseId ? `- **Testfall:** ${ticket.testCaseId} - ${ticket.testCaseTitle || ''}\n` : ''}

## Beschreibung
${ticket.description}

## Schritte zur Reproduktion
${ticket.stepsToReproduce}

## Erwartetes vs. tatsächliches Ergebnis
${ticket.expectedVsActual}
`;