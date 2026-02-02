
import React from 'react';
import { CartItem, Language } from '../types';

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
      title: "Warenkorb",
      empty: "Keine Artikel",
      total: "Gesamt",
      buyAll: "Bei Amazon kaufen",
      clear: "Leeren",
      remove: "Entfernen"
    },
    en: {
      title: "Cart",
      empty: "No items",
      total: "Total",
      buyAll: "Buy on Amazon",
      clear: "Clear",
      remove: "Remove"
    }
  }[lang];

  const totalPrice = items.reduce((sum, item) => {
    const price = typeof item.product.price === 'number' ? item.product.price : 0;
    return sum + (price * (item.quantity || 1));
  }, 0);

  const handleCheckout = () => {
    items.forEach(item => {
      window.open(item.product.url, '_blank');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">{t.title}</h2>
          <button 
            onClick={onToggle} 
            className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500">
              <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-sm font-medium">{t.empty}</span>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{item.product.name}</h4>
                    <p className="text-xs text-slate-400">{item.product.brand}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-white">
                        €{(typeof item.product.price === 'number' ? item.product.price : 0).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => onRemove(item.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        title={t.remove}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-400">{t.total}</span>
              <span className="text-xl font-black text-white">€{totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={onClear}
                className="flex-1 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
              >
                {t.clear}
              </button>
              <button 
                onClick={handleCheckout}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-colors"
              >
                {t.buyAll}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
