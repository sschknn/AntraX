
import React from 'react';
import { Language, Season, Occasion, WardrobeCategory } from '../types';

interface WardrobeCategoriesProps {
  lang: Language;
  selectedCategory: WardrobeCategory;
  onSelectCategory: (c: WardrobeCategory) => void;
  selectedSeason: Season;
  onSelectSeason: (s: Season) => void;
  selectedOccasion: Occasion;
  onSelectOccasion: (o: Occasion) => void;
}

export const WardrobeCategories: React.FC<WardrobeCategoriesProps> = ({
  lang,
  selectedCategory, onSelectCategory,
  selectedSeason, onSelectSeason,
  selectedOccasion, onSelectOccasion
}) => {
  const categories: WardrobeCategory[] = ['All', 'Tops', 'Bottoms', 'Dresses', 'Jackets', 'Shoes', 'Accessories'];
  const seasons: Season[] = ['All', 'Spring', 'Summer', 'Autumn', 'Winter'];
  const occasions: Occasion[] = ['None', 'Business', 'Casual', 'Party', 'Sport', 'Gala'];

  const t = {
    de: { cat: "Kategorien", sea: "Saison", occ: "Anlass" },
    en: { cat: "Categories", sea: "Season", occ: "Occasion" }
  }[lang];

  const Pill = ({ active, onClick, children }: any) => (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
        ${active ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]' : 'bg-white/5 text-slate-400 hover:bg-white/10'}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.cat}</span>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => <Pill key={c} active={selectedCategory === c} onClick={() => onSelectCategory(c)}>{c}</Pill>)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.sea}</span>
          <div className="flex flex-wrap gap-2">
            {seasons.map(s => <Pill key={s} active={selectedSeason === s} onClick={() => onSelectSeason(s)}>{s}</Pill>)}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.occ}</span>
          <div className="flex flex-wrap gap-2">
            {occasions.map(o => <Pill key={o} active={selectedOccasion === o} onClick={() => onSelectOccasion(o)}>{o}</Pill>)}
          </div>
        </div>
      </div>
    </div>
  );
};
