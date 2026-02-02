
import React, { useState } from 'react';
import { WardrobeItem, WardrobeCategory, Language } from '../types';
import { Button } from './ui/Button';

interface DigitalWardrobeProps {
  items: WardrobeItem[];
  onUpload: (item: WardrobeItem) => void;
  onDelete: (id: string) => void;
  lang: Language;
}

export const DigitalWardrobe: React.FC<DigitalWardrobeProps> = ({ items, onUpload, onDelete, lang }) => {
  const [filter, setFilter] = useState<WardrobeCategory>('All');
  
  const t = {
    de: { title: "Mein Kleiderschrank", add: "Teil hinzufügen", empty: "Keine Teile hochgeladen." },
    en: { title: "Digital Wardrobe", add: "Add Item", empty: "No items uploaded yet." }
  }[lang];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload({
          id: Date.now().toString(),
          category: 'Tops',
          imageUrl: reader.result as string,
          tags: []
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const categories: WardrobeCategory[] = ['All', 'Tops', 'Bottoms', 'Jackets', 'Shoes', 'Accessories'];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">{t.title}</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            {items.length} {lang === 'de' ? 'Gespeicherte Teile' : 'Saved items'}
          </p>
        </div>
        <div className="relative">
          <Button variant="primary" className="h-12 px-8 text-[10px] font-black uppercase tracking-widest gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            {t.add}
          </Button>
          <input type="file" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map(c => (
          <button 
            key={c}
            onClick={() => setFilter(c)}
            className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all
              ${filter === c ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}
            `}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.filter(i => filter === 'All' || i.category === filter).map(item => (
          <div key={item.id} className="aspect-square bg-slate-900 rounded-[2rem] border border-white/5 relative group overflow-hidden">
            <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
               <button onClick={() => onDelete(item.id)} className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="py-20 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center opacity-30">
          <span className="text-[10px] font-black uppercase tracking-widest">{t.empty}</span>
        </div>
      )}
    </div>
  );
};
