
import React, { useState, useRef } from 'react';
import { X, Mic, CheckCircle, ChevronDown, ChevronUp, Terminal, FileJson, AlertCircle, Camera, Image as ImageIcon, Trash2, HelpCircle, Ban } from 'lucide-react';

interface FailureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string, evidence?: string) => void; // evidence is base64 string
  mode: 'Failed' | 'Blocked';
}

const FailureDialog: React.FC<FailureDialogProps> = ({ isOpen, onClose, onConfirm, mode }) => {
  const [note, setNote] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setEvidence(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const startVoiceInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Browser nicht unterstützt.");
      return;
    }
    
    try {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'de-DE';
        recognition.interimResults = false;
        
        setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setNote(prev => prev ? prev + ' ' + transcript : transcript);
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    } catch (e) {
        setIsListening(false);
    }
  };

  // Colors based on mode
  const headerColor = mode === 'Blocked' ? 'from-amber-500 to-orange-400' : 'from-red-500 to-orange-500';
  const iconColor = mode === 'Blocked' ? 'text-amber-600' : 'text-red-600';
  const borderColor = mode === 'Blocked' ? 'focus:border-amber-500 focus:ring-amber-500' : 'focus:border-red-500 focus:ring-red-500';

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className={`bg-gradient-to-r ${headerColor} p-6 text-white flex-shrink-0`}>
           <div className="flex justify-between items-start">
              <div>
                  <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                      {mode === 'Blocked' ? <Ban size={28} /> : <AlertCircle size={28} />}
                      {mode === 'Blocked' ? 'Test Blockiert' : 'Fehler Gefunden!'}
                  </h2>
                  <p className="text-white/90 text-sm">
                      {mode === 'Blocked' 
                        ? 'Ein Weiterkommen ist nicht möglich. Dokumentiere warum.' 
                        : 'Gut aufgepasst! Deine Dokumentation hilft den Fehler zu beheben.'}
                  </p>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 rounded-full p-1">
                  <X size={20} />
              </button>
           </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
           
           {/* Guidance Box */}
           <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
               <div className="flex items-center gap-2 font-bold mb-1 text-blue-600">
                   <HelpCircle size={16} /> Was braucht der Entwickler?
               </div>
               <ul className="list-disc list-inside space-y-1 ml-1 opacity-80">
                   <li><strong>Schritte:</strong> Was hast du genau geklickt?</li>
                   <li><strong>Ergebnis:</strong> Was ist passiert (Fehlermeldung, falsche Daten)?</li>
                   <li><strong>Erwartung:</strong> Was hätte passieren sollen?</li>
               </ul>
           </div>

           {/* Description Input */}
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                  Fehlerbeschreibung <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                  <textarea 
                      className={`w-full p-3 pr-12 border border-slate-300 rounded-xl h-32 resize-none focus:ring-2 outline-none transition-all ${borderColor}`}
                      placeholder={mode === 'Blocked' 
                        ? "z.B. Server nicht erreichbar, Testdaten fehlen..." 
                        : "z.B. Schritt 1: Klick auf Speichern.\nErgebnis: Fehler 500.\nErwartet: Erfolgsmeldung."}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                  />
                  <button 
                      type="button"
                      onClick={startVoiceInput}
                      className={`absolute bottom-3 right-3 p-2 rounded-full shadow-sm transition-all ${
                          isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title="Sprechen statt Tippen"
                  >
                      <Mic size={18} />
                  </button>
              </div>
           </div>

           {/* Screenshot Upload */}
           <div>
               <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                   Screenshot / Beweis <span className="text-slate-400 font-normal text-xs">(Empfohlen)</span>
               </label>
               
               {!evidence ? (
                   <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-slate-100 rounded-xl h-24 flex flex-col items-center justify-center cursor-pointer transition-all group"
                   >
                       <Camera className="text-slate-400 group-hover:text-blue-500 mb-1" size={24} />
                       <span className="text-xs text-slate-500 font-medium">Klicke hier um ein Bild hochzuladen</span>
                       <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                   </div>
               ) : (
                   <div className="relative group w-fit">
                       <img src={evidence} alt="Evidence" className="h-32 rounded-lg border border-slate-200 shadow-sm object-cover" />
                       <button 
                           onClick={() => { setEvidence(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                           className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-md hover:bg-red-50"
                       >
                           <Trash2 size={16} />
                       </button>
                   </div>
               )}
           </div>

           {/* Tech Wizard Accordions */}
           <div className="space-y-2 pt-2 border-t border-slate-100">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technische Details (Optional)</h3>
               
               <div className="border border-slate-200 rounded-lg overflow-hidden">
                   <button 
                      onClick={() => toggleAccordion('har')}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                   >
                       <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                           <FileJson size={16} className="text-blue-500" /> HAR Datei speichern (Netzwerk)
                       </span>
                       {activeAccordion === 'har' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                   </button>
                   {activeAccordion === 'har' && (
                       <div className="p-3 bg-white text-xs text-slate-600 space-y-1">
                           <p>1. <strong>F12</strong> drücken (DevTools).</p>
                           <p>2. Reiter <strong>"Netzwerk"</strong> wählen.</p>
                           <p>3. Fehler reproduzieren.</p>
                           <p>4. <strong>Download</strong>-Pfeil klicken (HAR exportieren).</p>
                           <p className="text-slate-400 italic mt-1">Hänge die Datei an das Jira-Ticket an.</p>
                       </div>
                   )}
               </div>

               <div className="border border-slate-200 rounded-lg overflow-hidden">
                   <button 
                      onClick={() => toggleAccordion('console')}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                   >
                       <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                           <Terminal size={16} className="text-amber-500" /> Konsolen-Logs
                       </span>
                       {activeAccordion === 'console' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                   </button>
                   {activeAccordion === 'console' && (
                       <div className="p-3 bg-white text-xs text-slate-600 space-y-1">
                           <p>1. <strong>F12</strong> drücken.</p>
                           <p>2. Reiter <strong>"Konsole"</strong> wählen.</p>
                           <p>3. Screenshot von rotem Text machen.</p>
                       </div>
                   )}
               </div>
           </div>
        </div>

        <div className="p-6 pt-0 flex-shrink-0">
           <button 
              onClick={() => onConfirm(note, evidence || undefined)}
              disabled={!note.trim()}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === 'Blocked' 
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' 
                  : 'bg-red-600 hover:bg-red-700 shadow-red-200'
              }`}
           >
              {mode === 'Blocked' ? <Ban size={20} /> : <AlertCircle size={20} />}
              {mode === 'Blocked' ? 'Blocker melden' : 'Fehler melden'} & Speichern
           </button>
        </div>

      </div>
    </div>
  );
};

export default FailureDialog;
