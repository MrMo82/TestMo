
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { X, UserPlus, Trash2, Shield, User as UserIcon, Eye } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdate: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, currentUser, onUserUpdate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ name: '', username: '', role: 'Tester' as User['role'] });

  useEffect(() => {
    if (isOpen) {
        setUsers(storageService.getUsers());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUser.name || !newUser.username) return;

      const userToAdd: User = {
          ...newUser,
          initials: newUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random Hex
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=random`
      };

      storageService.saveUser(userToAdd);
      setUsers(storageService.getUsers());
      onUserUpdate();
      setNewUser({ name: '', username: '', role: 'Tester' });
  };

  const handleDeleteUser = (username: string) => {
      if (confirm(`User ${username} wirklich löschen?`)) {
          storageService.deleteUser(username);
          setUsers(storageService.getUsers());
          onUserUpdate();
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-800">
        
        <div className="bg-slate-100 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserIcon size={20} /> Team Verwaltung
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><X size={20}/></button>
        </div>

        <div className="p-6">
            {/* Add User Form */}
            <form onSubmit={handleAddUser} className="mb-8 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2"><UserPlus size={16}/> Neuen Benutzer einladen</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input 
                        placeholder="Name (z.B. Max Muster)" 
                        className="p-2 rounded border border-blue-200 dark:border-slate-600 text-sm outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                        value={newUser.name}
                        onChange={e => setNewUser({...newUser, name: e.target.value})}
                    />
                    <input 
                        placeholder="Username (Login)" 
                        className="p-2 rounded border border-blue-200 dark:border-slate-600 text-sm outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                        value={newUser.username}
                        onChange={e => setNewUser({...newUser, username: e.target.value})}
                    />
                    <select 
                        className="p-2 rounded border border-blue-200 dark:border-slate-600 text-sm outline-none focus:border-blue-500 dark:bg-slate-800 dark:text-white"
                        value={newUser.role}
                        onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                    >
                        <option value="Tester">Tester</option>
                        <option value="Admin">Admin</option>
                        <option value="Viewer">Viewer</option>
                    </select>
                </div>
                <button type="submit" disabled={!newUser.name} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors">
                    Benutzer hinzufügen
                </button>
            </form>

            {/* User List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {users.map(u => (
                    <div key={u.username} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                            <img src={u.avatarUrl} alt={u.initials} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600" />
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{u.name}</p>
                                <p className="text-xs text-slate-500 font-mono">@{u.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                                u.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 
                                u.role === 'Viewer' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' : 
                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                                {u.role === 'Admin' ? <Shield size={12}/> : u.role === 'Viewer' ? <Eye size={12}/> : <UserIcon size={12}/>}
                                {u.role}
                            </span>
                            {u.username !== 'admin' && u.username !== currentUser.username && (
                                <button onClick={() => handleDeleteUser(u.username)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
