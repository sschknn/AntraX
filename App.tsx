
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Step, ChatMessage, Language, Product, StyleState, DynamicSuggestion, SavedOutfit, Season, Occasion, WardrobeCategory, CartItem, Toast, UserProfile, WardrobeItem, UserAuth, SavedStyle } from './types';
import { CameraView, CameraViewRef } from './components/CameraView';
import { ChatInterface } from './components/ChatInterface';
import { ProductList } from './components/ProductList';
import { ShoppingCart } from './components/ShoppingCart';
import { ProductQuickView } from './components/ProductQuickView';
import { ToastContainer } from './components/ui/Toast';
import { OutfitGallery } from './components/OutfitGallery';
import { DigitalWardrobe } from './components/DigitalWardrobe';
import { firebaseService } from './services/firebaseService';
import { analyzeLookAndGenerateSuggestions, generateStyledImage, findMatchingProductsForKeywords, validateApiKey, keyManager } from './services/geminiService';
import { Button } from './components/ui/Button';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const SettingsView: React.FC<{ lang: Language; setToasts: React.Dispatch<React.SetStateAction<Toast[]>> }> = ({ lang, setToasts }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [extraKeys, setExtraKeys] = useState<string[]>([]);
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    setExtraKeys(keyManager.getKeys());
  }, []);

  const t = {
    de: {
      title: "KI-Einstellungen & Quoten",
      desc: "Optimiere deine Performance durch Key-Rotation. Die App wechselt bei Limits automatisch zum nächsten Account.",
      changeKey: "AI Studio Haupt-Key",
      validate: "Testen",
      billingLink: "Quota Dokumentation",
      status: "Verbindungs-Ping",
      waiting: "Pinging...",
      success: "Stabil",
      error: "Fehler",
      addKey: "Backup Key hinzufügen",
      keyPlaceholder: "AIzaSy...",
      yourKeys: "Hinterlegte Rotation-Keys",
      none: "Nur Standard-Rotation aktiv.",
      rotatingInfo: "AntraX-AI nutzt intelligente Rotation, um API Rate Limits (429) zu umgehen."
    },
    en: {
      title: "AI Settings & Quota",
      desc: "Optimize performance via key rotation. The app automatically switches accounts when limits are reached.",
      changeKey: "AI Studio Primary Key",
      validate: "Test",
      billingLink: "Quota Documentation",
      status: "Connection Ping",
      waiting: "Pinging...",
      success: "Stable",
      error: "Error",
      addKey: "Add Backup Key",
      keyPlaceholder: "AIzaSy...",
      yourKeys: "Stored Rotation Keys",
      none: "Standard rotation only.",
      rotatingInfo: "AntraX-AI uses smart rotation to bypass API Rate Limits (429)."
    }
  }[lang];

  const handleValidation = async () => {
    setIsValidating(true);
    setValidationResult(null);
    const result = await validateApiKey();
    setValidationResult(result);
    setIsValidating(false);
    setToasts(prev => [...prev, { id: Date.now().toString(), message: result.success ? t.success : t.error, type: result.success ? 'success' : 'error' }]);
  };

  const handleAddKey = () => {
    const key = newKey.trim();
    if (key.startsWith('AIza')) {
      const added = keyManager.addKey(key);
      if (added) {
        setExtraKeys(keyManager.getKeys());
        setNewKey('');
        setToasts(prev => [...prev, { id: Date.now().toString(), message: lang === 'de' ? "Rotation erweitert" : "Rotation expanded", type: 'success' }]);
      } else {
        setToasts(prev => [...prev, { id: Date.now().toString(), message: lang === 'de' ? "Bereits vorhanden" : "Already exists", type: 'info' }]);
      }
    } else if (key) {
      setToasts(prev => [...prev, { id: Date.now().toString(), message: lang === 'de' ? "Ungültig" : "Invalid", type: 'error' }]);
    }
  };

  const handleRemoveKey = (key: string) => {
    keyManager.removeKey(key);
    setExtraKeys(keyManager.getKeys());
    setToasts(prev => [...prev, { id: Date.now().toString(), message: lang === 'de' ? "Entfernt" : "Removed", type: 'info' }]);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30"></div>
        
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">{t.title}</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-2xl">{t.desc}</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Controls */}
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] flex flex-col gap-6">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.status}</span>
                  <div className={`w-2 h-2 rounded-full ${validationResult?.success ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`}></div>
               </div>
               <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-white truncate max-w-[150px]">
                    {isValidating ? t.waiting : validationResult?.message || "Ready"}
                  </span>
                  <Button variant="outline" onClick={handleValidation} isLoading={isValidating} className="h-12 px-6 text-[9px] font-black uppercase tracking-widest">
                    {t.validate}
                  </Button>
               </div>
            </div>

            <Button onClick={() => window.aistudio?.openSelectKey()} variant="primary" className="h-20 w-full text-[11px] font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-xl">
              {t.changeKey}
            </Button>
          </div>

          {/* Backup Rotation */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-col gap-6">
              <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{lang === 'de' ? 'Backup Rotation' : 'Backup Rotation'}</h3>
              <div className="flex gap-2">
                <input 
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder={t.keyPlaceholder}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs text-white outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
                />
                <button onClick={handleAddKey} className="h-14 w-14 bg-purple-600 rounded-2xl flex items-center justify-center hover:bg-purple-500 transition-all text-white active:scale-90">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              
              <div className="bg-black/30 rounded-[2.5rem] p-8 border border-white/5 max-h-[250px] overflow-y-auto no-scrollbar">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 block">{t.yourKeys}</span>
                {extraKeys.length === 0 ? (
                  <div className="py-8 text-center">
                    <span className="text-[10px] font-bold text-slate-700 italic">{t.none}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {extraKeys.map((k, idx) => (
                      <div key={k + idx} className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0 animate-in fade-in slide-in-from-left duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></div>
                           <span className="text-[11px] font-mono text-white/40 truncate max-w-[180px]">AIzaSy...{k.slice(-6)}</span>
                        </div>
                        <button onClick={() => handleRemoveKey(k)} className="p-2 text-red-500/40 hover:text-red-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
          <p className="text-[9px] font-bold text-indigo-300 leading-relaxed text-center uppercase tracking-widest flex items-center justify-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            {t.rotatingInfo}
          </p>
        </div>
      </div>
    </div>
  );
};

const LoginScreen: React.FC<{ onLogin: (user: UserAuth) => void }> = ({ onLogin }) => {
  const handleAuth = async () => {
    try {
      const hasKey = await window.aistudio?.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio?.openSelectKey();
      }
      const user = await firebaseService.signInWithGoogle();
      onLogin(user);
    } catch (err) {
      console.error("Auth Error", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-[#020617] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_50%)]"></div>
      <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in duration-1000">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-[0_0_60px_rgba(79,70,229,0.4)] rotate-12">
          <span className="text-4xl font-black text-white">AX</span>
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">AntraX-AI</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-12">Cloud-Synced Showroom</p>
        
        <button 
          onClick={handleAuth}
          className="w-full h-20 bg-white text-black rounded-[2rem] font-black text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-[1.03] transition-all active:scale-95 shadow-2xl mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google Login
        </button>

        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[8px] font-black text-indigo-400 uppercase tracking-widest hover:underline">Gemini Billing Docs</a>
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>('de');
  const [currentStep, setCurrentStep] = useState<Step>(Step.CAMERA);
  const [user, setUser] = useState<UserAuth | null>(null);
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [currentDisplayPhoto, setCurrentDisplayPhoto] = useState<string | null>(null);
  const [currentOutfitProducts, setCurrentOutfitProducts] = useState<Product[]>([]);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<DynamicSuggestion[]>([]);
  const [savedStyles, setSavedStyles] = useState<SavedStyle[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQueueProcessing, setIsQueueProcessing] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [detectedAesthetic, setDetectedAesthetic] = useState<string | null>(null);

  const t = useMemo(() => ({
    de: {
      studio: "Design Studio", gallery: "Archiv", wardrobe: "Cloud Garderobe", settings: "Setup",
      generating: "KI stylt dich...", aiInsights: "KI TRENDS",
      outfitSaved: "In Cloud gesichert!", 
      styleSaved: "Style-Preset gespeichert!",
      changeAccount: "Konto / API Key wechseln",
      signOut: "Abmelden",
      apiError: "KI überlastet. Warte auf freien Slot...",
      rotating: "Rate Limit! Rotiere Key...",
      safetyError: "Blockiert von KI-Sicherheit.",
      presets: "Style-Bibliothek"
    },
    en: {
      studio: "Design Studio", gallery: "Archive", wardrobe: "Cloud Wardrobe", settings: "Setup",
      generating: "AI Styling...", aiInsights: "AI TRENDS",
      outfitSaved: "Saved to Cloud!", 
      styleSaved: "Style preset saved!",
      changeAccount: "Change Account / Key",
      signOut: "Sign Out",
      apiError: "AI busy. Waiting for free slot...",
      rotating: "Rate Limit! Rotating key...",
      safetyError: "Blocked by AI safety filters.",
      presets: "Style Library"
    }
  }[lang]), [lang]);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        const [cloudOutfits, cloudWardrobe] = await Promise.all([
          firebaseService.loadOutfits(user.uid),
          firebaseService.loadWardrobe(user.uid)
        ]);
        setSavedOutfits(cloudOutfits);
        setWardrobe(cloudWardrobe);
        const localStyles = JSON.parse(localStorage.getItem(`styles_${user.uid}`) || '[]');
        setSavedStyles(localStyles);
      };
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (!originalPhoto || isQueueProcessing) return;

    const processNext = async () => {
      const nextIdx = dynamicSuggestions.findIndex(s => s.status === 'queued');
      if (nextIdx === -1) return;

      setIsQueueProcessing(true);
      setDynamicSuggestions(curr => curr.map((s, i) => i === nextIdx ? { ...s, status: 'processing' } : s));

      try {
        const item = dynamicSuggestions[nextIdx];
        const products = await findMatchingProductsForKeywords(item.productKeywords, item.label);
        const imgUrl = await generateStyledImage(originalPhoto, item.prompt);

        setDynamicSuggestions(curr => curr.map((s, i) => 
          i === nextIdx ? { ...s, imageUrl: imgUrl, products, status: 'success' } : s
        ));
        
        await new Promise(resolve => setTimeout(resolve, 2000)); 
      } catch (err: any) {
        if (err.message === 'API_KEY_INVALID') return;
        const isSafety = err.message === 'SAFETY_BLOCK';
        setDynamicSuggestions(curr => curr.map((s, i) => 
          i === nextIdx ? { ...s, status: isSafety ? 'safety' : 'error', errorMessage: err.message } : s
        ));
      } finally {
        setIsQueueProcessing(false);
      }
    };

    const timer = setTimeout(processNext, 1000);
    return () => clearTimeout(timer);
  }, [dynamicSuggestions, originalPhoto, isQueueProcessing]);

  const handleCapture = async (base64: string) => {
    setOriginalPhoto(base64);
    setCurrentDisplayPhoto(base64);
    setDynamicSuggestions([]);
    setCurrentStep(Step.EDITING);
    setIsProcessing(true);
    setMessages([{ id: 'analyzing', role: 'assistant', text: lang === 'de' ? "Initialisiere High-End Analyse..." : "Initializing high-end analysis..." }]);

    try {
      const result = await analyzeLookAndGenerateSuggestions(base64, lang);
      setDetectedAesthetic(result.detectedAesthetic);
      setMessages(prev => [...prev, { id: 'result', role: 'assistant', text: result.analysisReasoning }]);
      setDynamicSuggestions(result.suggestions.map((s: any) => ({ ...s, status: 'queued' })));
    } catch (err: any) {
      setToasts(prev => [...prev, { id: Date.now().toString(), message: t.apiError, type: 'error' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!originalPhoto || isProcessing) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text }]);
    setIsProcessing(true);

    try {
      const imgUrl = await generateStyledImage(originalPhoto, text);
      setCurrentDisplayPhoto(imgUrl);
      setMessages(prev => [...prev, { id: 'done', role: 'assistant', text: lang === 'de' ? "Look transformiert." : "Look transformed." }]);
      const products = await findMatchingProductsForKeywords([text], "Custom Style");
      setCurrentOutfitProducts(products);
    } catch (err: any) {
      setToasts(prev => [...prev, { id: Date.now().toString(), message: t.apiError, type: 'error' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToCloud = async () => {
    if (!user || !currentDisplayPhoto) return;
    const newOutfit: SavedOutfit = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      imageUrl: currentDisplayPhoto,
      description: detectedAesthetic || 'Custom Studio Look',
      favorite: true,
      rating: 5,
      reactions: 0,
      style: { baseStyle: 'modern' } as any,
      season: 'All',
      occasion: 'Casual',
      category: 'All',
      cartSnapshot: currentOutfitProducts
    };
    await firebaseService.saveOutfit(user.uid, newOutfit);
    setSavedOutfits(prev => [...prev, newOutfit]);
    setToasts(prev => [...prev, { id: Date.now().toString(), message: t.outfitSaved, type: 'success' }]);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500/30">
      {!user && <LoginScreen onLogin={setUser} />}
      
      <header className="px-8 md:px-20 h-28 flex items-center justify-between border-b border-white/5 backdrop-blur-3xl sticky top-0 z-[100]">
        <div className="flex items-center gap-8 cursor-pointer group" onClick={() => setCurrentStep(Step.CAMERA)}>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-800 w-14 h-14 rounded-3xl flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-6">
             <span className="font-black text-2xl">AX</span>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">AntraX-AI</span>
            <span className="text-[12px] font-black tracking-tight text-white uppercase">Show Room</span>
          </div>
        </div>
        
        <nav className="flex items-center gap-12">
          {[Step.CAMERA, Step.GALLERY, Step.WARDROBE].map(step => (
            <button key={step} onClick={() => setCurrentStep(step)} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:text-white ${currentStep === step ? 'text-white border-b-2 border-indigo-500 pb-1' : 'text-slate-500'}`}>
              {step === Step.CAMERA ? t.studio : step === Step.GALLERY ? t.gallery : t.wardrobe}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <div className="group relative">
             <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden hover:bg-white/10 transition-all">
                <span className="text-[10px] font-black">{user?.displayName?.[0]}</span>
             </button>
             {/* Robust bridge for dropdown */}
             <div className="absolute right-0 top-[100%] h-4 w-full pointer-events-auto"></div>
             <div className="absolute right-0 top-full pt-4 w-64 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-[200]">
                <div className="bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <div className="flex flex-col gap-4">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Profile</span>
                    <span className="text-[11px] font-black text-white truncate mb-2">{user?.email}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCurrentStep(Step.SETTINGS); }} 
                      className="w-full py-3.5 bg-indigo-500/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                    >
                      {t.settings}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.location.reload(); }} 
                      className="w-full py-3.5 bg-red-500/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                      {t.signOut}
                    </button>
                  </div>
                </div>
             </div>
          </div>
          <button onClick={() => setIsCartOpen(true)} className="relative p-3.5 bg-white/5 rounded-full hover:bg-white/10 transition-all border border-white/5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-indigo-500 text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950">{cart.length}</span>}
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 md:p-20">
        <ToastContainer toasts={toasts} onRemove={id => setToasts(toasts.filter(t => t.id !== id))} />

        {currentStep === Step.SETTINGS ? (
          <SettingsView lang={lang} setToasts={setToasts} />
        ) : currentStep === Step.GALLERY ? (
          <OutfitGallery outfits={savedOutfits} lang={lang} onDelete={id => setSavedOutfits(savedOutfits.filter(o => o.id !== id))} onReLive={o => { setCurrentDisplayPhoto(o.imageUrl); setCurrentOutfitProducts(o.cartSnapshot || []); setCurrentStep(Step.EDITING); }} />
        ) : currentStep === Step.WARDROBE ? (
          <DigitalWardrobe items={wardrobe} lang={lang} onUpload={async item => { if(user) { await firebaseService.saveWardrobeItem(user.uid, item); setWardrobe(prev => [...prev, item]); } }} onDelete={id => setWardrobe(wardrobe.filter(w => w.id !== id))} />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
            <div className="xl:col-span-8 flex flex-col gap-12">
              <div className="relative aspect-video bg-black rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl">
                {currentStep === Step.CAMERA ? (
                   <CameraView onCapture={handleCapture} lang={lang} />
                ) : (
                   <div className="w-full h-full relative group">
                      {currentDisplayPhoto && <img src={currentDisplayPhoto} className="w-full h-full object-contain" alt="Current Look" />}
                      <div className="absolute top-8 right-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={saveToCloud} className="p-5 bg-white/10 backdrop-blur-xl rounded-2xl hover:bg-white/20 text-white transition-all shadow-xl">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                         </button>
                      </div>
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-50">
                          <div className="w-24 h-24 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                          <span className="mt-10 text-[11px] font-black uppercase tracking-[0.5em] animate-pulse text-indigo-400">{t.generating}</span>
                        </div>
                      )}
                   </div>
                )}
              </div>
              
              <section className="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-12 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em]">{t.aiInsights}</h3>
                  <div className="h-[1px] flex-1 bg-white/5 ml-10"></div>
                </div>
                <div className="flex gap-10 overflow-x-auto no-scrollbar pb-8">
                  {dynamicSuggestions.map((s, idx) => (
                    <div key={idx} className="flex-none w-72 group">
                      <div className="aspect-[3/4] rounded-[2.5rem] bg-slate-900 border border-white/5 mb-6 overflow-hidden relative shadow-2xl cursor-pointer" onClick={() => { if(s.imageUrl) { setCurrentDisplayPhoto(s.imageUrl); setCurrentOutfitProducts(s.products || []); }}}>
                        {s.status === 'success' ? (
                          <img src={s.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={s.label} />
                        ) : s.status === 'safety' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-6">
                             <svg className="w-10 h-10 text-amber-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                             <span className="text-[9px] font-black text-amber-500/50 uppercase tracking-widest">{t.safetyError}</span>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                             <div className={`w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full ${s.status === 'processing' ? 'animate-spin' : ''}`}></div>
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.status === 'queued' ? 'Warten...' : 'Styling...'}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[12px] font-black text-white uppercase block mb-1 truncate tracking-wider">{s.label}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{s.category}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="xl:col-span-4 flex flex-col gap-12 h-full">
               <div className="flex-1 min-h-[600px]">
                 <ChatInterface messages={messages} onSendMessage={handleSendMessage} isProcessing={isProcessing} lang={lang} />
               </div>
               <ProductList products={currentOutfitProducts} lang={lang} onQuickView={setQuickViewProduct} onAddToCart={p => setCart(prev => [...prev, { id: Math.random().toString(), product: p, size: 'M', color: '#000', quantity: 1 }])} />
            </div>
          </div>
        )}
      </main>

      <ShoppingCart items={cart} isOpen={isCartOpen} onToggle={() => setIsCartOpen(!isCartOpen)} onRemove={id => setCart(cart.filter(i => i.id !== id))} onClear={() => setCart([])} lang={lang} />
      {quickViewProduct && <ProductQuickView product={quickViewProduct} isOpen={true} onClose={() => setQuickViewProduct(null)} onAddToCart={p => setCart(prev => [...prev, { id: Math.random().toString(), product: p, size: 'M', color: '#000', quantity: 1 }])} lang={lang} />}
    </div>
  );
}
