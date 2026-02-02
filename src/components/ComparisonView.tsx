
import React from 'react';
import { SavedOutfit, Language } from '../types';

interface ComparisonViewProps {
  outfits: SavedOutfit[];
  lang: Language;
  onClose: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ outfits, lang, onClose }) => {
  const t = {
    de: { title: "Outfit Vergleich" },
    en: { title: "Outfit Comparison" }
  }[lang];

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl p-4 md:p-8 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-black text-white uppercase tracking-widest">{t.title}</h2>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-white hover:bg-white/10 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className={`flex-1 grid gap-6 ${outfits.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {outfits.map((outfit) => (
          <div key={outfit.id} className="flex flex-col gap-4">
            <div className="flex-1 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
              <img src={outfit.imageUrl} className="w-full h-full object-cover" alt="Comparison" />
            </div>
            <div className="px-4 text-center">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{outfit.description || "Variant"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
