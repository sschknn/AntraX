
import React from 'react';
import { WishlistItem, Language } from '../types';
import { Button } from './ui/Button';

interface WishlistProps {
  items: WishlistItem[];
  onRemove: (id: string) => void;
  onMoveToCart: (item: WishlistItem) => void;
  lang: Language;
}

export const Wishlist: React.FC<WishlistProps> = ({ items, onRemove, onMoveToCart, lang }) => {
  const t = {
    de: { title: "Wunschliste", empty: "Deine Wunschliste ist leer", move: "In den Warenkorb" },
    en: { title: "Wishlist", empty: "Your wishlist is empty", move: "Add to Cart" }
  }[lang];

  if (items.length === 0) return null;

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-6">
      <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-4">{t.title}</h3>
      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-xl">
              {item.product.thumbnail}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-[10px] font-black text-white truncate uppercase">{item.product.name}</h5>
              <span className="text-[11px] font-black text-indigo-400">{item.product.price}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onMoveToCart(item)} className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              </button>
              <button onClick={() => onRemove(item.product.id)} className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-500 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
