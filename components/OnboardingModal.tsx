import React from 'react';
import { X, Sparkles, PlayCircle, BarChart3 } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold mb-2">Willkommen im Test Manager! 👋</h2>
          <p className="text-blue-100">Dein KI-gestützter Assistent für CMP Schweiz.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <div className="bg-indigo-100 p-3 rounded-full h-fit text-indigo-600 flex-shrink-0">
                <Sparkles size={24} />
            </div>
            <div>
                <h3 className="font-semibold text-slate-800">1. KI-Testfall Erstellung</h3>
                <p className="text-slate-600 text-sm">
                  Gehe zu <strong>"Neuer Testfall (KI)"</strong>. Beschreibe einfach dein Szenario (z.B. "Antrag mit fehlenden Daten"), und die KI erstellt alle Schritte inklusive Testdaten für dich.
                </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-blue-100 p-3 rounded-full h-fit text-blue-600 flex-shrink-0">
                <PlayCircle size={24} />
            </div>
            <div>
                <h3 className="font-semibold text-slate-800">2. Interaktive Ausführung</h3>
                <p className="text-slate-600 text-sm">
                  Öffne einen Testfall und arbeite die Checkliste ab. Setze Schritte auf <span className="text-green-600 font-medium">Passed</span> oder <span className="text-red-600 font-medium">Failed</span> – der Gesamtstatus aktualisiert sich automatisch.
                </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-slate-100 p-3 rounded-full h-fit text-slate-600 flex-shrink-0">
                <BarChart3 size={24} />
            </div>
            <div>
                <h3 className="font-semibold text-slate-800">3. Dashboard & Export</h3>
                <p className="text-slate-600 text-sm">
                  Behalte den Überblick über Pass-Rates im Dashboard oder importiere bestehende Fälle via CSV im Reiter <strong>"Import"</strong>.
                </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-medium transition-colors shadow-lg mt-2"
          >
            Verstanden, los geht's!
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;