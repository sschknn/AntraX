
import React from 'react';
import { SavedOutfit, Language } from '../types';
import { Button } from './ui/Button';

interface OutfitGalleryProps {
  outfits: SavedOutfit[];
  lang: Language;
  onDelete: (id: string) => void;
  onReLive: (outfit: SavedOutfit) => void;
}

export const OutfitGallery: React.FC<OutfitGalleryProps> = ({ outfits, lang, onDelete, onReLive }) => {
  const t = {
    de: {
      empty: "Keine archivierten Styles vorhanden.",
      reLive: "Diesen Style anwenden",
      delete: "Löschen",
      justNow: "Gerade eben",
      recipe: "Style Rezept"
    },
    en: {
      empty: "No archived styles yet.",
      reLive: "Apply this Style",
      delete: "Delete",
      justNow: "Just now",
      recipe: "Style Recipe"
    }
  }[lang];

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return t.justNow;
    return new Date(timestamp).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: 'short' });
  };

  if (outfits.length === 0) {
    return (
      <div className="w-full py-40 flex flex-col items-center justify-center bg-white/5 rounded-[4rem] border border-white/5 border-dashed">
        <span className="text-slate-600 text-[11px] font-black uppercase tracking-[0.4em]">{t.empty}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
      {outfits.map((outfit) => (
        <div key={outfit.id} className="group relative bg-white/5 rounded-[4rem] overflow-hidden border border-white/5 hover:border-indigo-500/30 transition-all duration-700 shadow-2xl">
          <div className="aspect-[4/5] relative overflow-hidden">
            <img src={outfit.imageUrl} alt={outfit.description} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute top-8 left-8 px-5 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-white uppercase tracking-widest">{formatDate(outfit.timestamp)}</span>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-10 gap-4">
              <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/5 mb-2">
                 <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-2">{t.recipe}</span>
                 <p className="text-[10px] text-white/80 font-medium leading-relaxed line-clamp-3">
                   {outfit.promptUsed || outfit.description}
                 </p>
              </div>
              <Button variant="primary" onClick={() => onReLive(outfit)} className="h-14 bg-white text-black font-black uppercase tracking-widest text-[10px]">
                {t.reLive}
              </Button>
              <button onClick={() => onDelete(outfit.id)} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-300">
                {t.delete}
              </button>
            </div>
          </div>
          <div className="p-10">
            <h5 className="text-[11px] font-black text-white uppercase truncate tracking-widest">{outfit.description}</h5>
            <div className="flex justify-between items-center mt-4">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">{outfit.style.baseStyle}</span>
              <div className="flex gap-1">
                {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-indigo-500 rounded-full opacity-50"></div>)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
