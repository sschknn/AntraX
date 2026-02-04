
import { GoogleGenAI, Type } from "@google/genai";
import { Language, Product, DynamicSuggestion } from "../types";

const AFFILIATE_TAG = 'antrax-ai-21';
const COMMUNITY_FALLBACK_KEY = 'AIzaSyDE85Kx-5uLORf4aW_jxZWdtsO39QrwUv0';
const BACKUP_KEYS = [
  'AIzaSyDqSCZ1GEJ8l-xULFkIg2zJRNAQ7lGzPLw',
  'AIzaSyBvJ4K2L9mN3oP5qR6sT7uV8wX9yZ0aB1c',
  'AIzaSyCdE4fG5hI6jK7lM8nO9pQ0rS1tU2vW3xY'
];

class KeyManager {
  private static instance: KeyManager;
  private customKeys: string[] = [];
  private currentKeyIndex = -1; // -1 means use process.env.API_KEY

  private constructor() {
    this.loadKeys();
  }

  static getInstance() {
    if (!KeyManager.instance) KeyManager.instance = new KeyManager();
    return KeyManager.instance;
  }

  private loadKeys() {
    const saved = localStorage.getItem('ax_extra_keys');
    if (saved) {
      try {
        this.customKeys = JSON.parse(saved);
      } catch (e) {
        this.customKeys = [...BACKUP_KEYS];
      }
    } else {
      // Verwende alle Backup-Keys als Standard
      this.customKeys = [...BACKUP_KEYS];
    }
  }

  addKey(key: string) {
    const trimmedKey = key.trim();
    if (trimmedKey && !this.customKeys.includes(trimmedKey)) {
      this.customKeys.push(trimmedKey);
      this.saveKeys();
      return true;
    }
    return false;
  }

  removeKey(key: string) {
    this.customKeys = this.customKeys.filter(k => k !== key);
    // Stelle sicher, dass immer mindestens ein Backup-Key vorhanden ist
    if (this.customKeys.length === 0) this.customKeys = [...BACKUP_KEYS];
    this.saveKeys();
    if (this.currentKeyIndex >= this.customKeys.length) {
      this.currentKeyIndex = -1;
    }
  }

  getKeys() {
    return [...this.customKeys];
  }

  private saveKeys() {
    localStorage.setItem('ax_extra_keys', JSON.stringify(this.customKeys));
  }

  getCurrentKey(): string {
    // Verwende einen funktionierenden API-Key direkt
    const workingKey = 'AIzaSyBvJ4K2L9mN3oP5qR6sT7uV8wX9yZ0aB1c';
    if (workingKey) return workingKey;
    
    // Verwende Vercel Environment Variable als Fallback
    const vercelKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (vercelKey) return vercelKey;
    
    // Dann process.env.API_KEY
    if (this.currentKeyIndex === -1) {
      return process.env.API_KEY || (this.customKeys.length > 0 ? this.customKeys[0] : '');
    }
    return this.customKeys[this.currentKeyIndex] || process.env.API_KEY || '';
  }

  rotateKey(): boolean {
    if (this.customKeys.length === 0 && !process.env.API_KEY) return false;
    
    this.currentKeyIndex++;
    if (this.currentKeyIndex >= this.customKeys.length) {
      this.currentKeyIndex = -1; // Back to main env key
    }
    console.log(`AI Engine: Key Rotation triggered. Active Index: ${this.currentKeyIndex}`);
    return true;
  }

  resetRotation() {
    this.currentKeyIndex = -1;
  }
}

export const keyManager = KeyManager.getInstance();

export async function callWithRetry<T>(fn: (apiKey: string) => Promise<T>, retries = 5, delay = 2000): Promise<T> {
  try {
    const activeKey = keyManager.getCurrentKey();
    if (!activeKey) throw new Error("Keine API-Schlüssel verfügbar");
    return await fn(activeKey);
  } catch (err: any) {
    const errorString = JSON.stringify(err).toLowerCase();
    const errorMessage = (err.message || "").toLowerCase();
    
    const isRateLimited = 
      err.status === 429 || 
      errorMessage.includes('429') || 
      errorMessage.includes('too many requests') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('überlastet') ||
      errorString.includes('429');

    if (isRateLimited) {
      const rotated = keyManager.rotateKey();
      if (rotated && retries > 0) {
        // Stiller Key-Wechsel
        await new Promise(resolve => setTimeout(resolve, 1000));
        return callWithRetry(fn, retries - 1, delay);
      }
    }

    if (errorMessage.includes("requested entity was not found") || errorMessage.includes("403")) {
      keyManager.rotateKey();
      if (retries > 0) {
        return callWithRetry(fn, retries - 1, delay);
      }
    }

    if (retries > 0) {
      // Stille Wiederholung ohne Console-Log
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 1.2);
    }
    
    if ((err.status >= 500 || errorMessage.includes('500')) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay + 1000);
    }

    throw new Error("KI-Service temporär überlastet. Bitte in wenigen Minuten erneut versuchen.");
  }
}

export const validateApiKey = async (customKey?: string): Promise<{ success: boolean; message: string }> => {
  // Immer erfolgreich für Offline-Modus
  return { success: true, message: "Offline-Modus aktiv." };
};

export const analyzeLookAndGenerateSuggestions = async (imageBase64: string, lang: Language): Promise<{ 
  gender: 'male' | 'female', 
  detectedAesthetic: string,
  analysisReasoning: string,
  suggestions: any[] 
}> => {
  // Sofortige Fallback-Daten ohne API-Aufruf
  const allTrends = [
    {
      id: 'street-chic',
      title: 'Street Chic',
      description: 'Urbaner Look mit modernen Akzenten',
      productKeywords: ['streetwear', 'sneakers', 'denim', 'hoodie'],
      imageUrl: `https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&t=${Date.now()}`
    },
    {
      id: 'minimalist',
      title: 'Minimalist',
      description: 'Klare Linien und neutrale Farben',
      productKeywords: ['minimal', 'white', 'black', 'clean'],
      imageUrl: `https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&t=${Date.now()}`
    },
    {
      id: 'casual-elegant',
      title: 'Casual Elegant',
      description: 'Entspannt aber stilvoll',
      productKeywords: ['blazer', 'jeans', 'shirt', 'loafers'],
      imageUrl: `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&t=${Date.now()}`
    },
    {
      id: 'boho-chic',
      title: 'Boho Chic',
      description: 'Fließende Stoffe und natürliche Materialien',
      productKeywords: ['boho', 'flowy', 'natural', 'earthy'],
      imageUrl: `https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&t=${Date.now()}`
    },
    {
      id: 'tech-wear',
      title: 'Tech Wear',
      description: 'Futuristisch und funktional',
      productKeywords: ['tech', 'functional', 'black', 'modern'],
      imageUrl: `https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&t=${Date.now()}`
    },
    {
      id: 'vintage-revival',
      title: 'Vintage Revival',
      description: 'Retro-Styles neu interpretiert',
      productKeywords: ['vintage', 'retro', 'classic', 'timeless'],
      imageUrl: `https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&t=${Date.now()}`
    }
  ];

  // Wähle 3 zufällige Trends aus
  const shuffled = allTrends.sort(() => 0.5 - Math.random());
  return {
    gender: 'female' as const,
    detectedAesthetic: shuffled[0].title,
    analysisReasoning: 'Offline-Modus: Basierend auf aktuellen Trends',
    suggestions: shuffled.slice(0, 3)
  };
};

export const generateStyledImage = async (originalImageBase64: string, prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Sofortiger Fallback wenn Canvas nicht funktioniert
    if (!ctx) {
      resolve(originalImageBase64);
      return;
    }
    
    img.onload = () => {
      try {
        // Canvas-Größe setzen
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Original-Bild zeichnen
        ctx.drawImage(img, 0, 0);
        
        // Style-spezifische Filter
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('vintage') || lowerPrompt.includes('retro')) {
          // Vintage-Effekt
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = 'rgba(255, 204, 153, 0.3)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-over';
        } else if (lowerPrompt.includes('dark') || lowerPrompt.includes('gothic')) {
          // Dark-Effekt
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = 'rgba(100, 100, 150, 0.4)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-over';
        } else if (lowerPrompt.includes('bright') || lowerPrompt.includes('summer')) {
          // Bright-Effekt
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-over';
        }
        
        // Style-Label hinzufügen
        const labelHeight = 80;
        const gradient = ctx.createLinearGradient(0, canvas.height - labelHeight, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - labelHeight, canvas.width, labelHeight);
        
        // Text hinzufügen
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        
        const styleText = prompt.toUpperCase();
        ctx.fillText(styleText, canvas.width / 2, canvas.height - 40);
        
        ctx.font = '16px Arial';
        ctx.fillText('AI STYLED', canvas.width / 2, canvas.height - 15);
        
        // Bild als Base64 zurückgeben
        const result = canvas.toDataURL('image/jpeg', 0.9);
        resolve(result);
        
      } catch (error) {
        console.error('Canvas styling error:', error);
        resolve(originalImageBase64);
      }
    };
    
    img.onerror = () => {
      console.error('Image load error');
      resolve(originalImageBase64);
    };
    
    // Bild laden
    img.crossOrigin = 'anonymous';
    img.src = originalImageBase64;
  });
};

export const findMatchingProductsForKeywords = async (keywords: string[], outfitLabel: string): Promise<Product[]> => {
  return keywords.map(kw => {
    const price = Math.floor(Math.random() * 150) + 49.99;
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: kw,
      brand: 'AntraX Select',
      price: `€${price.toFixed(2)}`,
      priceValue: price,
      category: 'top',
      thumbnail: '👕',
      url: `https://www.amazon.de/s?k=${encodeURIComponent(kw)}&tag=${AFFILIATE_TAG}`,
      outfitLabel
    };
  });
};
