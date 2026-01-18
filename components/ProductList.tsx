
import React from 'react';
import { Product, Language } from '../types';

interface ProductListProps {
  products: Product[];
  lang: Language;
}

export const ProductList: React.FC<ProductListProps> = ({ products, lang }) => {
  if (products.length === 0) return null;

  const t = {
    de: {
      title: "Passende Amazon Fashion-Essentials",
      cta: "Auf Amazon ansehen"
    },
    en: {
      title: "Matching Amazon Fashion Picks",
      cta: "View on Amazon"
    }
  }[lang];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.25em] flex items-center gap-3">
           <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
             <path d="M15.012 11.232c-.312.444-.804.816-1.548 1.152-.732.312-1.632.48-2.652.48-1.464 0-2.676-.408-3.648-1.2-.948-.792-1.428-1.896-1.428-3.276 0-1.452.54-2.58 1.632-3.372 1.08-.792 2.508-1.188 4.284-1.188.828 0 1.584.072 2.268.216V3.84c0-.624-.132-1.056-.396-1.284-.264-.24-.708-.348-1.332-.348-.528 0-.948.108-1.26.312-.3.204-.54.54-.708 1.008l-2.076-.648c.312-.912.876-1.584 1.692-2.004C10.632.456 11.7.24 13.02.24c1.392 0 2.412.312 3.06.924.648.612.972 1.644.972 3.096V10.8c0 .54.108.972.312 1.284.216.3.564.456 1.056.456.192 0 .396-.024.588-.06V14.4c-.42.12-.876.18-1.356.18-1.212 0-2.088-.348-2.64-1.044V11.232zM12.924 9.384V6.216c-.468-.132-.972-.192-1.5-.192-.78 0-1.392.168-1.836.504-.444.336-.66.828-.66 1.488 0 .612.192 1.08.576 1.404.384.324.9.48 1.548.48.66 0 1.284-.132 1.872-.516zM22.716 19.332c-2.316 2.064-5.652 3.204-8.868 3.204-4.548 0-8.628-2.184-11.664-5.592l1.632-1.2c2.616 2.94 6.144 4.8 10.032 4.8 2.76 0 5.64-.912 7.824-2.58l1.044 1.368zm1.044-2.88c-.144-.18-.84-.276-1.188-.324-1.368-.192-4.548-.48-5.328-.528-.312 0-.48.144-.456.36.144.576.732 2.148 1.02 2.628.18.276.42.3.624.084.252-.228.84-1.044.84-1.044s.9.156 1.68.216c.3.024.504-.132.504-.384 0-.156-.372-.636-.732-.996l-.972-.012s-.012 0 0 0z" />
           </svg>
           {t.title}
        </h4>
        <div className="h-[1px] flex-1 bg-white/10 ml-6"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => (
          <a 
            key={product.id}
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center bg-white/5 border border-white/5 rounded-3xl p-5 hover:bg-white/10 transition-all group gap-6 overflow-hidden relative"
          >
            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform flex-shrink-0 shadow-inner">
              {product.thumbnail}
            </div>
            
            <div className="flex flex-col flex-1 gap-1 min-w-0">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{product.brand}</span>
              <h5 className="text-[13px] font-bold text-white truncate leading-tight group-hover:text-amber-500 transition-colors">{product.name}</h5>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-lg font-black text-white">{product.price}</span>
                <span className="text-[8px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Prime</span>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-2">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center group-hover:bg-amber-600 transition-colors shadow-xl shadow-amber-500/20">
                <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
            
            {/* Hover Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] rounded-full translate-x-16 -translate-y-16 group-hover:bg-amber-500/10 transition-all"></div>
          </a>
        ))}
      </div>
      
      <div className="px-2">
        <p className="text-[9px] text-slate-500 leading-relaxed italic">
          * Wir schlagen Produkte vor, die Ihren virtuellen Look am besten widerspiegeln. Klicken Sie auf ein Item, um direkt zu Amazon zu gelangen.
        </p>
      </div>
    </div>
  );
};
