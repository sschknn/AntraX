
import React from 'react';
import { Product, Language } from '../types';
import { Button } from './ui/Button';

interface ProductListProps {
  products: Product[];
  lang: Language;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, lang, onQuickView, onAddToCart }) => {
  if (products.length === 0) return null;

  const t = {
    de: {
      title: "Passende Essentials",
      quickView: "Details",
      addToCart: "In den Warenkorb",
      totalPrice: "Look Gesamtpreis"
    },
    en: {
      title: "Matching Essentials",
      quickView: "Quick View",
      addToCart: "Add to Cart",
      totalPrice: "Look Total Price"
    }
  }[lang];

  const lookTotal = products.reduce((sum, p) => sum + (typeof p.price === 'number' ? p.price : 0), 0);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em]">{t.title}</h4>
          <span className="text-[12px] font-black text-white mt-1">€{(lookTotal || 0).toFixed(2)} <span className="text-[8px] text-slate-500 uppercase ml-1 font-bold">{t.totalPrice}</span></span>
        </div>
        <div className="h-[1px] flex-1 bg-white/10 ml-6"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => (
          <div 
            key={product.id}
            className="flex items-center bg-white/5 border border-white/5 rounded-[2rem] p-4 hover:bg-white/10 transition-all group gap-4 relative overflow-hidden"
          >
            <div 
              className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform flex-shrink-0 cursor-pointer"
              onClick={() => onQuickView(product)}
            >
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-2xl">👕</div>
              )}
            </div>
            
            <div className="flex flex-col flex-1 gap-0.5 min-w-0">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{product.brand}</span>
              <h5 className="text-[11px] font-black text-white truncate leading-tight">{product.name}</h5>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-black text-white">€{(typeof product.price === 'number' ? product.price : 0).toFixed(2)}</span>
                <span className="text-[7px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Prime</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => onAddToCart(product)}
                className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                title={t.addToCart}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button 
                onClick={() => onQuickView(product)}
                className="w-8 h-8 rounded-full bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
                title={t.quickView}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
