
import React, { useState } from 'react';
import { Product, Language } from '../types';
import { Button } from './ui/Button';

interface ProductQuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string) => void;
  lang: Language;
}

export const ProductQuickView: React.FC<ProductQuickViewProps> = ({ product, isOpen, onClose, onAddToCart, lang }) => {
  // Fix: safely access length when calculating initial state to avoid potential crash if sizes is undefined
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[Math.floor((product.sizes?.length || 0) / 2)] || 'M');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '#000000');

  if (!isOpen) return null;

  const t = {
    de: {
      addToCart: "In den Warenkorb",
      size: "Größe wählen",
      color: "Farbe wählen",
      details: "Produktdetails",
      brandInfo: "Diese Marke passt perfekt zu Ihrem aktuellen Style-Profil.",
      priceMatch: "Bestpreis-Garantie auf Amazon"
    },
    en: {
      addToCart: "Add to Cart",
      size: "Select Size",
      color: "Select Color",
      details: "Product Details",
      brandInfo: "This brand matches your current style profile perfectly.",
      priceMatch: "Best price guaranteed on Amazon"
    }
  }[lang];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-slate-900 w-full max-w-4xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Visuals */}
          <div className="bg-slate-950 p-8 flex items-center justify-center relative">
            <div className="text-[12rem] filter drop-shadow-[0_0_50px_rgba(79,70,229,0.3)] select-none">
              {product.thumbnail}
            </div>
            <div className="absolute bottom-8 left-8">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Authentic Picks</span>
            </div>
          </div>

          {/* Right: Info */}
          <div className="p-10 flex flex-col">
            <div className="mb-8">
              <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-2 block">{product.brand}</span>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-4">{product.name}</h2>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-white">{product.price}</span>
                <span className="text-xs text-slate-500 line-through">€{(product.priceValue * 1.4).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-8 flex-1">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">{t.size}</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes?.map(size => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 w-12 flex items-center justify-center rounded-xl text-[10px] font-black uppercase transition-all
                        ${selectedSize === size ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">{t.color}</span>
                <div className="flex gap-4">
                  {product.colors?.map(color => (
                    <button 
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`h-8 w-8 rounded-full border-2 transition-all p-0.5
                        ${selectedColor === color ? 'border-indigo-500 scale-110' : 'border-transparent'}
                      `}
                    >
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: color }}></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] leading-relaxed text-slate-400 font-medium italic">
                  "{t.brandInfo}"
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full h-16 text-xs font-black uppercase tracking-[0.2em]"
                onClick={() => {
                  onAddToCart(product, selectedSize, selectedColor);
                  onClose();
                }}
              >
                {t.addToCart}
              </Button>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t.priceMatch}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
