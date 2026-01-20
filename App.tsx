
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Step, ChatMessage, Language, Product, StyleState, DynamicSuggestion } from './types';
import { Button } from './components/ui/Button';
import { Select } from './components/ui/Select';
import { CameraView, CameraViewRef } from './components/CameraView';
import { ChatInterface } from './components/ChatInterface';
import { ProductList } from './components/ProductList';
import { editAppearance, findMatchingProducts, parseStyleIntent, analyzeLookAndGenerateSuggestions, generateStyledImage, connectStylistLive } from './services/geminiService';

export default function App() {
  const [lang, setLang] = useState<Language>('de');
  const [currentStep, setCurrentStep] = useState<Step>(Step.CAMERA);
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [currentDisplayPhoto, setCurrentDisplayPhoto] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<DynamicSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveSessionRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const cameraRef = useRef<CameraViewRef>(null);
  
  const [styleState, setStyleState] = useState<StyleState>({
    hair: 'original',
    outfit: 'original',
    accessories: 'none',
    gender: 'female',
    ageGroup: 'adult',
    baseStyle: 'modern'
  });

  const t = {
    de: {
      captureSuccess: "Analyse abgeschlossen.",
      aiInsights: "ESTHETIC PREVIEWS",
      generating: "Veredelung...",
      analyzing: "Erfassung...",
      queuing: "Kuratiere...",
      startVoice: "Live Stylist",
      stopVoice: "Beenden",
      voiceChatActive: "Studio Live",
      apiKeyRequired: "API Key erforderlich",
      quotaError: "Limit erreicht. Bitte eigenen Key wählen.",
      manageKey: "Key verwalten",
      labels: {
        gender: "IDENTITÄT",
        age: "TYP",
        style: "AESTHETIC"
      },
      options: {
        gender: [
          { label: "Damenmode", value: "female" },
          { label: "Herrenmode", value: "male" }
        ],
        age: [
          { label: "Contemporary", value: "young" },
          { label: "Sophisticated", value: "adult" },
          { label: "Timeless", value: "mature" }
        ],
        style: [
          { label: "Quiet Luxury", value: "modern" },
          { label: "Vintage Class", value: "vintage" },
          { label: "Evening Gala", value: "opera" },
          { label: "Casual Chic", value: "casual" }
        ]
      }
    },
    en: {
      captureSuccess: "Analysis complete.",
      aiInsights: "ESTHETIC PREVIEWS",
      generating: "Refining...",
      analyzing: "Capturing...",
      queuing: "Curating...",
      startVoice: "Live Stylist",
      stopVoice: "Stop Live",
      voiceChatActive: "Studio Live",
      apiKeyRequired: "API Key Required",
      quotaError: "Quota exceeded. Please select your own key.",
      manageKey: "Manage Key",
      labels: {
        gender: "IDENTITY",
        age: "TYPE",
        style: "AESTHETIC"
      },
      options: {
        gender: [
          { label: "Womenswear", value: "female" },
          { label: "Menswear", value: "male" }
        ],
        age: [
          { label: "Contemporary", value: "young" },
          { label: "Sophisticated", value: "adult" },
          { label: "Timeless", value: "mature" }
        ],
        style: [
          { label: "Quiet Luxury", value: "modern" },
          { label: "Vintage Class", value: "vintage" },
          { label: "Evening Gala", value: "opera" },
          { label: "Casual Chic", value: "casual" }
        ]
      }
    }
  }[lang];

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', text: lang === 'de' ? "Willkommen im V-Styler Atelier." : "Welcome to the V-Styler Atelier." }
  ]);

  const toggleLanguage = () => setLang(l => l === 'de' ? 'en' : 'de');

  const handleApiKeyManagement = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setError(null);
      }
    } catch (err) {
      console.error("Failed to open key selector", err);
    }
  };

  const processStyleUpdate = async (newStyle: StyleState | string) => {
    if (!originalPhoto || isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      let finalImg = '';
      if (typeof newStyle === 'string') {
        finalImg = await generateStyledImage(originalPhoto, newStyle);
      } else {
        setStyleState(newStyle);
        finalImg = await editAppearance(originalPhoto, newStyle);
      }
      
      setCurrentDisplayPhoto(finalImg);
      
      setIsSearchingProducts(true);
      const foundItems = await findMatchingProducts(typeof newStyle === 'string' ? styleState : newStyle, lang);
      setProducts(foundItems);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('429') || err.message?.includes('Quota')) {
        setError(t.quotaError);
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setIsProcessing(false);
      setIsSearchingProducts(false);
    }
  };

  const reset = useCallback(() => {
    setOriginalPhoto(null);
    setCurrentDisplayPhoto(null);
    setProducts([]);
    setDynamicSuggestions([]);
    setStyleState({ hair: 'original', outfit: 'original', accessories: 'none', gender: 'female', ageGroup: 'adult', baseStyle: 'modern' });
    setCurrentStep(Step.CAMERA);
    setError(null);
  }, []);

  const toggleVoiceChat = useCallback(async (forceOn: boolean = false) => {
    if (isLiveActive && !forceOn) {
      await liveSessionRef.current?.stop();
      liveSessionRef.current = null;
      setIsLiveActive(false);
    } else if (!isLiveActive || forceOn) {
      setError(null);
      
      // For Live Session, we strongly recommend a selected key to avoid 429s
      const hasKey = window.aistudio ? await window.aistudio.hasSelectedApiKey() : true;
      if (!hasKey) {
        handleApiKeyManagement();
        // Fall through; guidelines say assume success or proceed
      }

      setIsLiveActive(true);
      try {
        const session = await connectStylistLive({
          onTranscription: (text, role) => {
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last && last.role === role) {
                return [...prev.slice(0, -1), { ...last, text }];
              }
              return [...prev, { id: Date.now().toString(), role, text }];
            });
          },
          onApplyStyle: (desc) => {
            processStyleUpdate(desc);
          },
          onTakePhoto: () => {
            if (cameraRef.current) {
              cameraRef.current.capture();
            } else {
               reset();
               setTimeout(() => {
                 if (cameraRef.current) cameraRef.current.capture();
               }, 1200);
            }
          },
          onReset: () => {
            reset();
          },
          onError: (e: any) => {
            console.error("Live Error", e);
            if (e.message?.includes('429') || e.message?.includes('entity was not found')) {
              setError(t.quotaError);
            }
            setIsLiveActive(false);
          }
        }, lang);
        liveSessionRef.current = session;
      } catch (err: any) {
        console.error(err);
        if (err.message?.includes('429')) setError(t.quotaError);
        setIsLiveActive(false);
      }
    }
  }, [isLiveActive, lang, originalPhoto, reset, t.quotaError]);

  useEffect(() => {
    if (currentStep === Step.CAMERA && !isLiveActive) {
      toggleVoiceChat(true);
    }
  }, [currentStep]);

  const handleCapture = async (base64: string) => {
    setOriginalPhoto(base64);
    setCurrentDisplayPhoto(base64);
    setCurrentStep(Step.EDITING);
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeLookAndGenerateSuggestions(base64, lang);
      setStyleState(prev => ({ ...prev, gender: result.gender }));
      setDynamicSuggestions(result.suggestions);
      setIsAnalyzing(false);
      
      for (const s of result.suggestions) {
         generateStyledImage(base64, s.prompt).then(url => {
            setDynamicSuggestions(current => current.map(item => item.label === s.label ? { ...item, imageUrl: url, isGenerating: false } : item));
         }).catch(err => console.error("Preview generation failed", err));
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('429')) setError(t.quotaError);
      setIsAnalyzing(false);
    }
  };

  const handleApplySuggestion = (suggestion: DynamicSuggestion) => {
    if (suggestion.imageUrl) {
      setCurrentDisplayPhoto(suggestion.imageUrl);
    } else if (!suggestion.isGenerating) {
      handleSendMessage(suggestion.prompt);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!originalPhoto || isProcessing) return;
    setIsProcessing(true);
    try {
      const updatedStyle = await parseStyleIntent(text, styleState, lang);
      setIsProcessing(false);
      processStyleUpdate(updatedStyle);
    } catch (err: any) {
      if (err.message?.includes('429')) setError(t.quotaError);
      setIsProcessing(false);
    }
  };

  const handleFullReset = () => {
    if (liveSessionRef.current) liveSessionRef.current.stop();
    setIsLiveActive(false);
    reset();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,_#1e1b4b_0%,_transparent_40%),radial-gradient(circle_at_80%_80%,_#312e81_0%,_transparent_40%)] -z-10 animate-pulse duration-[10s]"></div>

      <header className="px-6 md:px-8 h-16 py-2 flex items-center justify-between border-b border-white/5 backdrop-blur-3xl sticky top-0 z-[100]">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={handleFullReset}>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-all">
             <span className="font-black text-sm">V</span>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-sm font-black tracking-widest uppercase">V-STYLER</span>
          </div>
        </div>
        
        {currentStep === Step.EDITING && (
          <div className="flex-1 max-w-lg mx-6 hidden lg:flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Select label={t.labels.gender} options={t.options.gender} value={styleState.gender} onChange={(v) => processStyleUpdate({ ...styleState, gender: v as any })} />
              <Select label={t.labels.age} options={t.options.age} value={styleState.ageGroup} onChange={(v) => processStyleUpdate({ ...styleState, ageGroup: v as any })} />
              <Select label={t.labels.style} options={t.options.style} value={styleState.baseStyle} onChange={(v) => processStyleUpdate({ ...styleState, baseStyle: v as any })} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleApiKeyManagement}
            className="text-[8px] font-black border-white/5 uppercase px-2 h-8"
          >
            {t.manageKey}
          </Button>
          <button onClick={toggleLanguage} className="text-[8px] font-black bg-white/5 px-2 py-1.5 rounded-md border border-white/10 hover:bg-white/10 transition-colors uppercase">
            {lang === 'de' ? 'GER' : 'ENG'}
          </button>
          <Button 
            variant={isLiveActive ? 'primary' : 'outline'} 
            size="sm" 
            onClick={() => toggleVoiceChat()} 
            className={`text-[8px] font-black h-8 border-white/10 uppercase px-3 transition-all ${isLiveActive ? 'bg-red-600 border-red-500 animate-pulse' : ''}`}
          >
            {isLiveActive ? t.stopVoice : t.startVoice}
          </Button>
          {currentStep === Step.EDITING && (
            <Button variant="outline" size="sm" onClick={handleFullReset} className="text-[8px] font-black h-8 border-white/10 hover:bg-white/5 uppercase px-3">
              {lang === 'de' ? 'NEU' : 'NEW'}
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div className="w-full bg-red-600/20 backdrop-blur-md border-b border-red-500/30 py-2 px-6 flex items-center justify-between">
           <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{error}</span>
           <Button variant="outline" size="sm" onClick={handleApiKeyManagement} className="h-6 text-[8px] bg-red-600/40 border-red-500">
              {t.manageKey}
           </Button>
        </div>
      )}

      <main className="flex-1 max-w-[1500px] mx-auto w-full p-2 md:p-4 flex flex-col items-center">
        {currentStep === Step.CAMERA ? (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-8 animate-in fade-in duration-700">
              <CameraView ref={cameraRef} onCapture={handleCapture} lang={lang} voiceActive={isLiveActive} />
            </div>
            
            <div className="lg:col-span-4 lg:sticky lg:top-20 h-[450px] animate-in fade-in duration-700 delay-100">
               <ChatInterface 
                  messages={messages} 
                  onSendMessage={handleSendMessage} 
                  isProcessing={false} 
                  lang={lang} 
                  voiceActive={isLiveActive}
               />
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-7 flex flex-col">
                <div className="relative rounded-[2rem] overflow-hidden shadow-xl border border-white/10 bg-slate-900 group min-h-[400px] max-h-[60vh]">
                  {currentDisplayPhoto && (
                    <img src={currentDisplayPhoto} alt="AI" className={`w-full h-full object-cover transition-all duration-700 ${isProcessing ? 'scale-105 blur-lg opacity-50' : 'scale-100 opacity-100'}`} />
                  )}
                  
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex flex-col animate-in fade-in duration-500">
                       <span className="text-[6px] font-black text-indigo-400 uppercase">Status</span>
                       <span className="text-[9px] font-bold text-white uppercase flex items-center gap-2">
                          <div className={`w-1 h-1 rounded-full ${isLiveActive ? 'bg-red-500 shadow-[0_0_3px_red]' : 'bg-green-500 shadow-[0_0_3px_green]'} animate-pulse`}></div>
                          {isLiveActive ? t.voiceChatActive : 'Ready'}
                       </span>
                    </div>
                  </div>

                  {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
                      <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <div className="mt-4 text-center">
                        <span className="text-sm font-black text-white uppercase tracking-widest">{t.generating}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-100px)] overflow-y-auto no-scrollbar pb-4">
                <div className="h-[350px] shrink-0">
                  <ChatInterface 
                    messages={messages} 
                    onSendMessage={handleSendMessage} 
                    isProcessing={isProcessing || isAnalyzing} 
                    lang={lang} 
                    voiceActive={isLiveActive}
                  />
                </div>
                <ProductList products={products} lang={lang} />
              </div>
            </div>

            <section className="w-full bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 py-4 px-6 animate-in slide-in-from-bottom-2 duration-500 shadow-lg">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t.aiInsights}</h3>
                  <div className="h-[1px] flex-1 bg-white/5 ml-4"></div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {dynamicSuggestions.length > 0 ? (
                    dynamicSuggestions.map((s, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleApplySuggestion(s)}
                        disabled={isProcessing || isAnalyzing}
                        className={`group relative flex-none w-48 flex flex-col p-3 bg-slate-900/60 hover:bg-indigo-600/10 border border-white/5 hover:border-indigo-500/20 rounded-[1.5rem] transition-all text-left disabled:opacity-50 overflow-hidden ${s.imageUrl ? 'ring-1 ring-indigo-500/20' : ''}`}
                      >
                        <div className="w-full aspect-square bg-slate-800 rounded-[1.2rem] overflow-hidden mb-3 relative">
                          {s.imageUrl ? (
                            <img src={s.imageUrl} alt={s.label} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 border border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        <div className="px-0.5">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] font-black text-white uppercase truncate mr-1">{s.label}</span>
                            <span className="text-[6px] font-bold text-indigo-300 uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded-full">{s.category}</span>
                          </div>
                          <p className="text-[8px] text-slate-400 line-clamp-1 group-hover:text-slate-200 leading-tight">
                            {s.imageUrl ? s.prompt : t.queuing}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : isAnalyzing ? (
                    <div className="flex gap-3 w-full">
                       {[1,2,3,4].map(i => (
                         <div key={i} className="flex-none w-48 aspect-square bg-white/5 rounded-[1.5rem] animate-pulse flex items-center justify-center">
                            <div className="w-6 h-6 border border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                         </div>
                       ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 right-0 p-4 opacity-5 pointer-events-none -z-10">
         <span className="text-[8vw] font-black leading-none uppercase italic tracking-tighter">AI VISION</span>
      </div>
    </div>
  );
}
