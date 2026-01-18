
import React from 'react';
import { Product, Language } from '../types';

interface ProductListProps {
  products: Product[];
  lang: Language;
}

export const ProductList: React.FC<ProductListProps> = ({ products, lang }) => {
  if (products.length === 0) return null;

  const t = {
    de: "Passende Produkte gefunden",
    en: "Matching Products Found"
  }[lang];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t}</h4>
        <div className="h-[1px] flex-1 bg-white/10 ml-4"></div>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {products.map((product) => (
          <a 
            key={product.id}
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none w-40 bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all group flex flex-col gap-3"
          >
            <div className="aspect-square bg-slate-800 rounded-xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
              {product.thumbnail}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{product.brand}</span>
              <h5 className="text-[11px] font-bold text-white truncate leading-tight">{product.name}</h5>
              <span className="text-xs font-black text-indigo-400 mt-1">{product.price}</span>
            </div>
            <div className="mt-auto pt-2 border-t border-white/5">
              <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                Shop Now →
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
