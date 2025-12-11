import { CaseStatus, StepStatus, TestStep } from '../types';

export const calculateCaseStatus = (steps: TestStep[]): CaseStatus => {
  if (steps.length === 0) return CaseStatus.NotStarted;

  // Regel: Wenn alle Steps NotStarted → NotStarted.
  const allNotStarted = steps.every(s => s.status === StepStatus.NotStarted);
  if (allNotStarted) return CaseStatus.NotStarted;

  // Regel: Wenn alle Steps Passed → Passed.
  const allPassed = steps.every(s => s.status === StepStatus.Passed);
  if (allPassed) return CaseStatus.Passed;

  // Regel: Wenn mindestens ein Step Failed → Failed.
  const anyFailed = steps.some(s => s.status === StepStatus.Failed);
  if (anyFailed) return CaseStatus.Failed;

  // Regel: Wenn mindestens ein Step Blocked und kein Failed → Blocked.
  const anyBlocked = steps.some(s => s.status === StepStatus.Blocked);
  if (anyBlocked && !anyFailed) return CaseStatus.Blocked;

  // Regel: Wenn mindestens ein Step InProgress und kein Step Failed → InProgress.
  // Note: Usually "Passed" implies progress has started too.
  const anyInProgress = steps.some(s => s.status === StepStatus.InProgress || s.status === StepStatus.Passed);
  if (anyInProgress && !anyFailed) return CaseStatus.InProgress;

  return CaseStatus.NotStarted;
};

export const calculateProgress = (steps: TestStep[]): number => {
  if (steps.length === 0) return 0;
  const passed = steps.filter(s => s.status === StepStatus.Passed).length;
  const inProgress = steps.filter(s => s.status === StepStatus.InProgress).length;
  
  // Regel: Fortschritt in % = (Anzahl Steps mit Status Passed + 0.5 * Anzahl InProgress) / GesamtSteps * 100.
  return Math.round(((passed + 0.5 * inProgress) / steps.length) * 100);
};