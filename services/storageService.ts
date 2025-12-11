
import { TestCase, User, ProjectSettings, ActivityLog } from '../types';

const STORAGE_KEY_CASES = 'testmo_cases_v1';
const STORAGE_KEY_USER = 'testmo_user_session';
const STORAGE_KEY_USERS_DB = 'testmo_users_db';
const STORAGE_KEY_SETTINGS = 'testmo_project_settings';
const STORAGE_KEY_ACTIVITY = 'testmo_activity_log';

// Default Admin
const DEFAULT_ADMIN: User = {
  username: 'admin',
  name: 'MoFlow Admin',
  role: 'Admin',
  initials: 'AD',
  color: '#0ea5e9', // Sky 500
  avatarUrl: 'https://ui-avatars.com/api/?name=Mo+Flow&background=0ea5e9&color=fff'
};

export const storageService = {
  // --- AUTHENTICATION & USER MANAGEMENT ---
  
  getUsers: (): User[] => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY_USERS_DB);
          if (stored) return JSON.parse(stored);
          
          // Init with default admin if empty
          const initialUsers = [DEFAULT_ADMIN];
          localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(initialUsers));
          return initialUsers;
      } catch (e) {
          return [DEFAULT_ADMIN];
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
      if (username === 'admin') return; // Protect admin
      const users = storageService.getUsers().filter(u => u.username !== username);
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(users));
  },

  login: async (username: string, password: string): Promise<User | null> => {
    // Simulating API latency
    await new Promise(resolve => setTimeout(resolve, 600));

    // For MVP: Password check is skipped/mocked. In real app, hash check here.
    // We accept any password for now if username exists.
    const users = storageService.getUsers();
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (foundUser) {
      if (password === 'password') { // Simple mock check
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(foundUser));
          storageService.logActivity(foundUser.name, 'login', 'System', 'Benutzer angemeldet');
          return foundUser;
      }
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_USER);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    return stored ? JSON.parse(stored) : null;
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
