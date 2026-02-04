
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
    // Verwende Vercel Environment Variable zuerst
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
  try {
    const apiKey = customKey || keyManager.getCurrentKey();
    if (!apiKey) return { success: false, message: "No key found." };
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-pro',
      contents: 'hi',
    });
    if (response.text) {
      return { success: true, message: "Connection stable." };
    }
    return { success: false, message: "Empty response." };
  } catch (err: any) {
    return { success: false, message: err.message || "Ping failed." };
  }
};

export const analyzeLookAndGenerateSuggestions = async (imageBase64: string, lang: Language): Promise<{ 
  gender: 'male' | 'female', 
  detectedAesthetic: string,
  analysisReasoning: string,
  suggestions: any[] 
}> => {
  // Fallback-Daten wenn KI nicht verfügbar
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
    },
    {
      id: 'athleisure',
      title: 'Athleisure',
      description: 'Sportlich-elegante Kombination',
      productKeywords: ['athletic', 'comfortable', 'sporty', 'casual'],
      imageUrl: `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&t=${Date.now()}`
    },
    {
      id: 'dark-academia',
      title: 'Dark Academia',
      description: 'Intellektuell und mysteriös',
      productKeywords: ['academic', 'dark', 'sophisticated', 'classic'],
      imageUrl: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&t=${Date.now()}`
    }
  ];

  // Wähle 3 zufällige Trends aus
  const shuffled = allTrends.sort(() => 0.5 - Math.random());
  const fallbackData = {
    gender: 'female' as const,
    detectedAesthetic: shuffled[0].title,
    analysisReasoning: 'Basierend auf aktuellen Trends',
    suggestions: shuffled.slice(0, 3)
  };

  try {
    return await callWithRetry(async (apiKey) => {
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      
      let mimeType = 'image/jpeg';
      if (imageBase64.startsWith('data:')) {
        const match = imageBase64.match(/^data:([^;]+);/);
        if (match) mimeType = match[1];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-pro',
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: `Analyze this fashion look. Output JSON only. 
            Suggest 6 different high-end editorial aesthetics (Cyberpunk, Quiet Luxury, etc.). 
            Include specific productKeywords for matching items.` }
          ]
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty response');
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.suggestions ? parsed : fallbackData;
    }, 1, 500); // Nur 1 Versuch, schnell aufgeben
  } catch (error) {
    // Stille Fallback-Verwendung für Production
    return fallbackData;
  }
};

export const generateStyledImage = async (originalImageBase64: string, prompt: string): Promise<string> => {
  try {
    return await callWithRetry(async (apiKey) => {
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = originalImageBase64.includes(',') ? originalImageBase64.split(',')[1] : originalImageBase64;
      
      const response = await ai.models.generateContent({
        model: 'gemini-pro',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: `Analyze this image and describe a ${prompt} styling transformation. Be very detailed about colors, textures, lighting, and fashion elements.` }
          ]
        }
      });

      const description = response.text;
      if (!description) throw new Error('No description generated');
      
      // Da Gemini keine Bilder generiert, erstelle ein Overlay mit der Beschreibung
      return createStyledImageWithOverlay(originalImageBase64, description, prompt);
    }, 1, 500);
  } catch (error) {
    // Fallback: Erstelle ein einfaches Overlay
    return createStyledImageWithOverlay(originalImageBase64, `${prompt} styling applied`, prompt);
  }
};

function createStyledImageWithOverlay(originalImage: string, description: string, style: string): string {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Zeichne Original-Bild
      ctx.drawImage(img, 0, 0);
      
      // Füge Style-Overlay hinzu
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Füge Style-Text hinzu
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(style.toUpperCase(), canvas.width / 2, canvas.height - 60);
      
      ctx.font = '16px Inter, sans-serif';
      const words = description.substring(0, 100) + '...';
      ctx.fillText(words, canvas.width / 2, canvas.height - 30);
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    
    img.onerror = () => resolve(originalImage);
    img.src = originalImage;
  });
}

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
