
import React, { useState } from 'react';
import { Step, ChatMessage, Language, Product } from './types';
import { Button } from './components/ui/Button';
import { CameraView } from './components/CameraView';
import { ChatInterface } from './components/ChatInterface';
import { ProductList } from './components/ProductList';
import { editAppearance, getStylistResponse, findMatchingProducts } from './services/geminiService';

export default function App() {
  const [lang, setLang] = useState<Language>('de');
  const [currentStep, setCurrentStep] = useState<Step>(Step.CAMERA);
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [currentDisplayPhoto, setCurrentDisplayPhoto] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  const t = {
    de: {
      welcome: "Willkommen beim V-Styler AI. Ich nutze Computer Vision, um den perfekten Schnappschuss zu erstellen. Tritt zurück, bis mein HUD grün leuchtet!",
      captureSuccess: "KI-Analyse abgeschlossen. Dein Look wurde perfekt erfasst. Welches Outfit darf ich digital für dich schneidern?",
      error: "Styling-Fehler. Versuche es mit einer präziseren Beschreibung (Farbe, Material, Stil).",
      reset: "Neu Starten",
      retake: "Foto wiederholen",
      stepTitle: "AI Vision",
      stepSubtitle: "Autonomous Capture",
      stepDesc: "Unsere KI wartet auf den optimalen Moment: Perfekte Schärfe, Pose und Ganzkörper-Erfassung geschehen vollautomatisch.",
      previewTitle: "Style Rendering",
      previewLabel: "Vorschau",
      generating: "AI Processing",
      rendering: "Stoffe werden simuliert...",
      searching: "Suche passende Produkte...",
      suggestionsLabel: "Trend-Curator",
      suggestions: [
        { label: "Business Elite", prompt: "Ein maßgeschneiderter dunkelblauer Anzug mit weißem Hemd" },
        { label: "Cyberpunk", prompt: "Techwear-Outfit mit leuchtenden violetten Akzenten" },
        { label: "Summer Breeze", prompt: "Ein leichtes Sommerkleid mit floralem Print" },
        { label: "Gala Night", prompt: "Ein klassischer schwarzer Smoking" }
      ]
    },
    en: {
      welcome: "Welcome to V-Styler AI. I use computer vision to capture the perfect snapshot. Step back until the HUD turns green!",
      captureSuccess: "AI analysis complete. Your look was captured perfectly. Which outfit should I digitally tailor for you?",
      error: "Styling failed. Try a more precise description (color, material, style).",
      reset: "Restart",
      retake: "Retake Photo",
      stepTitle: "AI Vision",
      stepSubtitle: "Autonomous Capture",
      stepDesc: "Our AI waits for the optimal moment: Perfect sharpness, pose, and full-body capture happen automatically.",
      previewTitle: "Style Rendering",
      previewLabel: "Preview",
      generating: "AI Processing",
      rendering: "Simulating fabrics...",
      searching: "Searching products...",
      suggestionsLabel: "Trend-Curator",
      suggestions: [
        { label: "Business Elite", prompt: "A tailored navy blue suit with a crisp white shirt" },
        { label: "Cyberpunk", prompt: "Techwear outfit with glowing violet accents" },
        { label: "Summer Breeze", prompt: "A light summer dress with floral print" },
        { label: "Gala Night", prompt: "A classic black tuxedo" }
      ]
    }
  }[lang];

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', text: t.welcome }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  const toggleLanguage = () => {
    const newLang = lang === 'de' ? 'en' : 'de';
    setLang(newLang);
    if (messages.length === 1) {
      const texts = {
        de: "Willkommen beim V-Styler AI. Ich nutze Computer Vision, um den perfekten Schnappschuss zu erstellen. Tritt zurück, bis mein HUD grün leuchtet!",
        en: "Welcome to V-Styler AI. I use computer vision to capture the perfect snapshot. Step back until the HUD turns green!"
      };
      setMessages([{ id: '1', role: 'assistant', text: texts[newLang] }]);
    }
  };

  const handleCapture = (base64: string) => {
    setOriginalPhoto(base64);
    setCurrentDisplayPhoto(base64);
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'assistant', text: t.captureSuccess }
    ]);
    setCurrentStep(Step.EDITING);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    setProducts([]); // Clear old products

    try {
      // 1. Get Stylist Response
      const stylistResponseText = await getStylistResponse(text, lang);
      setMessages(prev => [...prev, { id: 'bot-' + Date.now(), role: 'assistant', text: stylistResponseText }]);

      // 2. Generate Image
      if (originalPhoto) {
        const editedImg = await editAppearance(originalPhoto, text);
        setCurrentDisplayPhoto(editedImg);
        
        // 3. Start Visual Search
        setIsSearchingProducts(true);
        const foundItems = await findMatchingProducts(text, lang);
        setProducts(foundItems);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: 'err-' + Date.now(), role: 'assistant', text: t.error }]);
    } finally {
      setIsProcessing(false);
      setIsSearchingProducts(false);
    }
  };

  const reset = () => {
    setOriginalPhoto(null);
    setCurrentDisplayPhoto(null);
    setProducts([]);
    const initialText = lang === 'de' 
      ? "Bereit für einen neuen Snapshot. Tritt zurück für die KI-Erfassung!"
      : "Ready for a new snapshot. Step back for AI capture!";
    setMessages([
       { id: '1', role: 'assistant', text: initialText }
    ]);
    setCurrentStep(Step.CAMERA);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,_#1e1b4b_0%,_transparent_40%),radial-gradient(circle_at_80%_80%,_#312e81_0%,_transparent_40%)] -z-10"></div>

      <header className="px-6 md:px-8 h-20 flex items-center justify-between border-b border-white/5 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
          <div className="bg-indigo-600 w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight hidden sm:flex">
            <span className="text-base md:text-lg font-black tracking-widest uppercase text-white">V-STYLERS</span>
            <span className="text-[10px] font-bold text-indigo-400 tracking-[0.3em] uppercase underline decoration-indigo-500/50 underline-offset-4">Advanced Vision Core</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <button 
            onClick={toggleLanguage}
            className="text-[10px] md:text-[11px] font-black tracking-[0.2em] bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 uppercase transition-all"
          >
            {lang === 'de' ? 'DE | en' : 'de | EN'}
          </button>
          {currentStep === Step.EDITING && (
            <Button variant="ghost" size="sm" onClick={reset} className="text-[10px] md:text-xs text-white/60 hover:text-white hover:bg-white/5 border border-white/10 rounded-xl px-3 h-9 md:h-10">
              {t.retake}
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-6 py-6 md:py-8 flex flex-col lg:flex-row gap-6 lg:gap-10 items-center lg:items-stretch overflow-hidden">
        {currentStep === Step.CAMERA ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full animate-in fade-in zoom-in duration-1000">
            <div className="mb-6 md:mb-10 text-center">
              <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-tight uppercase px-4 italic">
                {t.stepTitle} <br/><span className="text-indigo-500 not-italic">{t.stepSubtitle}</span>
              </h2>
              <p className="text-slate-400 text-base md:text-lg max-w-lg mx-auto px-6 font-light">
                {t.stepDesc}
              </p>
            </div>
            <div className="w-full max-w-[500px] lg:max-w-none">
              <CameraView onCapture={handleCapture} lang={lang} />
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-8 h-full min-h-0 animate-in slide-in-from-right-12 duration-700">
            <div className="flex-[3] flex flex-col gap-6 relative min-h-[60vh] lg:min-h-0">
              <div className="flex-1 relative rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-2 border-white/5 bg-slate-900 group">
                {currentDisplayPhoto && (
                  <img 
                    src={currentDisplayPhoto} 
                    alt="Style Preview" 
                    className={`w-full h-full object-cover transition-all duration-1000 ${isProcessing ? 'scale-105 blur-2xl opacity-20' : 'scale-100 opacity-100'}`}
                  />
                )}
                
                <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-indigo-400 tracking-[0.3em] uppercase mb-1">{t.previewTitle}</span>
                      <h3 className="text-white font-black text-xl md:text-2xl uppercase tracking-tighter">{t.previewLabel}</h3>
                    </div>
                  </div>
                </div>

                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 z-20">
                    <div className="relative">
                      <div className="w-24 h-24 md:w-32 md:h-32 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 border-t-4 border-white rounded-full animate-spin [animation-duration:1.2s]"></div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center text-center px-6">
                      <span className="text-xl md:text-2xl font-black text-white tracking-[0.2em] uppercase mb-2">{t.generating}</span>
                      <span className="text-xs md:text-sm text-indigo-300 font-bold animate-pulse tracking-widest">{t.rendering}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Discovery Results */}
              {!isProcessing && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                  {isSearchingProducts ? (
                    <div className="flex items-center gap-4 p-6 bg-white/5 rounded-[2rem] border border-white/5">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-slate-400 tracking-widest uppercase animate-pulse">{t.searching}</span>
                    </div>
                  ) : (
                    <ProductList products={products} lang={lang} />
                  )}
                </div>
              )}
            </div>

            <div className="flex-[2] flex flex-col min-w-full md:min-w-[400px] lg:min-w-[400px] gap-6 h-[50vh] lg:h-auto">
              <div className="flex-1 min-h-0">
                <ChatInterface 
                  messages={messages} 
                  onSendMessage={handleSendMessage} 
                  isProcessing={isProcessing}
                  lang={lang}
                />
              </div>

              <div className="bg-slate-900/50 backdrop-blur-3xl p-6 md:p-8 rounded-[3rem] border border-white/5 flex flex-col gap-5 shadow-2xl">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">{t.suggestionsLabel}</span>
                    <div className="flex gap-1.5">
                       <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                       <div className="w-1 h-1 rounded-full bg-indigo-500/40"></div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {t.suggestions.map(s => (
                      <button 
                        key={s.label}
                        onClick={() => handleSendMessage(s.prompt)}
                        disabled={isProcessing}
                        className="text-[10px] md:text-[11px] font-black py-3 md:py-4 px-4 bg-white/5 hover:bg-indigo-600 border border-white/5 rounded-2xl transition-all text-left group disabled:opacity-50 hover:shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                      >
                        <span className="block text-slate-500 group-hover:text-white/60 mb-1 truncate uppercase tracking-tighter">{s.label}</span>
                        <span className="block text-white group-hover:text-indigo-100 truncate">{lang === 'de' ? 'Anwenden' : 'Apply'} →</span>
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
