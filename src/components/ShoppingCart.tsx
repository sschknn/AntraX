
import React from 'react';
import { CartItem, Language } from '../types';
import { Button } from './ui/Button';

interface ShoppingCartProps {
  items: CartItem[];
  isOpen: boolean;
  onToggle: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  lang: Language;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ items, isOpen, onToggle, onRemove, onClear, lang }) => {
  const t = {
    de: {
      title: "Dein Showroom Warenkorb",
      empty: "Warenkorb leer",
      total: "Gesamtsumme",
      buyAll: "ALLES BEI AMAZON BESTELLEN",
      clear: "Leeren"
    },
    en: {
      title: "Showroom Cart",
      empty: "Cart empty",
      total: "Total",
      buyAll: "ORDER ALL ON AMAZON",
      clear: "Clear"
    }
  }[lang];

  const totalPrice = items.reduce((sum, item) => sum + item.product.priceValue, 0);

  const handleCheckout = () => {
    // Öffnet alle Amazon-Links nacheinander
    items.forEach(item => {
      window.open(item.product.url, '_blank');
    });
  };

  return (
    <div className={`fixed right-0 top-0 h-full bg-[#020617]/95 backdrop-blur-3xl border-l border-white/5 z-[500] transition-all duration-700 flex flex-col
      ${isOpen ? 'w-full md:w-[450px] translate-x-0' : 'w-0 translate-x-full'}
    `}>
      <div className="p-10 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-xl font-black uppercase tracking-tighter text-white">{t.title}</h2>
        <button onClick={onToggle} className="p-3 bg-white/5 rounded-full text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <span className="text-[12px] font-black uppercase tracking-[0.4em]">{t.empty}</span>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex gap-6 group">
              <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center text-4xl border border-white/5 group-hover:border-indigo-500/30 transition-all">
                {item.product.thumbnail}
              </div>
              <div className="flex-1">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">{item.product.outfitLabel || 'Single Item'}</span>
                <h4 className="text-[13px] font-black text-white uppercase leading-tight mb-2">{item.product.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white">{item.product.price}</span>
                  <button onClick={() => onRemove(item.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-10 bg-white/5 border-t border-white/5">
        <div className="flex justify-between items-center mb-10">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.total}</span>
          <span className="text-3xl font-black text-white">€{totalPrice.toFixed(2)}</span>
        </div>
        <button 
          onClick={handleCheckout}
          disabled={items.length === 0}
          className="w-full h-20 bg-white text-black rounded-[2rem] font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20"
        >
          {t.buyAll}
        </button>
        <p className="text-center text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-6">
          Alle Artikel werden in separaten Tabs auf Amazon geöffnet.
        </p>
      </div>
    </div>
  );
};
