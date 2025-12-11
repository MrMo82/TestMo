import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await storageService.login(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Ungültige Zugangsdaten. Versuch es mal mit admin / password');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in-up">
        
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/10 p-3 rounded-xl mb-4 backdrop-blur-sm border border-white/20">
                <ShieldCheck className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">TestMo</h1>
            <p className="text-blue-100 text-sm">by MoFlowSystems</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dein Benutzername</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="z.B. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dein Passwort</label>
              <input
                type="password"
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Anmelden...
                </>
              ) : (
                <>
                  Anmelden <ArrowRight size={20} />
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-slate-400 mt-4">
              Demo Zugang: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">admin</span> / <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">password</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;