
import { TestCase, User, ProjectSettings, ActivityLog, DefectTicket } from '../types';

const STORAGE_KEY_CASES = 'testmo_cases_v1';
const STORAGE_KEY_USERS_DB = 'testmo_users_db';
const STORAGE_KEY_SETTINGS = 'testmo_project_settings';
const STORAGE_KEY_ACTIVITY = 'testmo_activity_log';
const STORAGE_KEY_DEFECTS = 'testmo_defect_tickets_v1';

export const storageService = {
  // --- AUTHENTICATION & USER MANAGEMENT ---
  
  getUsers: (): User[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_USERS_DB);
          if (stored) return JSON.parse(stored);
          
            return [];
      } catch (e) {
            return [];
      }
  },

  saveUser: (user: User) => {
      const users = storageService.getUsers();
      const existingIndex = users.findIndex(u => u.username === user.username);
      
      if (existingIndex >= 0) {
          users[existingIndex] = user;
      } else {
          users.push(user);
      }
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
  },

  deleteUser: (username: string) => {
      const users = storageService.getUsers().filter(u => u.username !== username);
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
  },

  // --- DATABASE (LocalStorage) ---

  saveCases: (cases: TestCase[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
    } catch (e) {
      console.error("Storage Quota Exceeded or Error", e);
    }
  },

  loadCases: (initialData: TestCase[]): TestCase[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CASES);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with default data if empty
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(initialData));
      return initialData;
    } catch (e) {
      console.error("Error loading cases", e);
      return initialData;
    }
  },

  clearDatabase: () => {
    localStorage.removeItem(STORAGE_KEY_CASES);
  },

  // --- PROJECT SETTINGS ---

  saveProjectSettings: (settings: ProjectSettings) => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  },

  loadProjectSettings: (): ProjectSettings | null => {
    const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return stored ? JSON.parse(stored) : null;
  },

  saveDefect: (ticket: DefectTicket) => {
    const tickets = storageService.loadDefects();
    const existingIndex = tickets.findIndex(existing => existing.id === ticket.id);
    if (existingIndex >= 0) tickets[existingIndex] = ticket;
    else tickets.unshift(ticket);
    localStorage.setItem(STORAGE_KEY_DEFECTS, JSON.stringify(tickets));
  },

  loadDefects: (): DefectTicket[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DEFECTS);
      return stored ? JSON.parse(stored) as DefectTicket[] : [];
    } catch (e) {
      console.error('Error loading defects', e);
      return [];
    }
  },

  // --- ACTIVITY LOG ---

  logActivity: (user: string, action: ActivityLog['action'], target: string, details?: string) => {
    try {
        const newLog: ActivityLog = {
            id: Date.now().toString(),
            user,
            action,
            target,
            details,
            timestamp: new Date().toISOString()
        };
        
        const existingLogs = storageService.getActivities();
        const updatedLogs = [newLog, ...existingLogs].slice(0, 50); // Keep last 50
        localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(updatedLogs));
    } catch (e) {
        console.error("Error logging activity", e);
    }
  },

  getActivities: (): ActivityLog[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_ACTIVITY);
          return stored ? JSON.parse(stored) : [];
      } catch (e) {
          return [];
      }
  }
};
