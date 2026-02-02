
import { GoogleGenAI, Type } from "@google/genai";
import { Language, Product, DynamicSuggestion } from "../types";

const AFFILIATE_TAG = 'antrax-ai-21';
const COMMUNITY_FALLBACK_KEY = 'AIzaSyDqSCZ1GEJ8l-xULFkIg2zJRNAQ7lGzPLw';

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
        this.customKeys = [COMMUNITY_FALLBACK_KEY];
      }
    } else {
      // Default fallback if no user keys exist
      this.customKeys = [COMMUNITY_FALLBACK_KEY];
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
    // Ensure community key isn't removed if it's the only one left and was intended as permanent
    if (this.customKeys.length === 0) this.customKeys = [COMMUNITY_FALLBACK_KEY];
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
    // If index is -1, try process.env.API_KEY, else fallback to first custom key
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

export async function callWithRetry<T>(fn: (apiKey: string) => Promise<T>, retries = 5, delay = 3000): Promise<T> {
  try {
    const activeKey = keyManager.getCurrentKey();
    if (!activeKey) throw new Error("NO_API_KEY_AVAILABLE");
    return await fn(activeKey);
  } catch (err: any) {
    const errorString = JSON.stringify(err).toLowerCase();
    const errorMessage = (err.message || "").toLowerCase();
    
    const isRateLimited = 
      err.status === 429 || 
      errorMessage.includes('429') || 
      errorMessage.includes('too many requests') ||
      errorMessage.includes('quota') ||
      errorString.includes('429');

    if (isRateLimited) {
      const rotated = keyManager.rotateKey();
      if (rotated) {
        console.warn("Gemini Engine: Rate Limit. Rotating key and retrying immediately...");
        return callWithRetry(fn, retries, delay);
      }
    }

    if (errorMessage.includes("requested entity was not found")) {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
      }
      throw new Error("API_KEY_INVALID");
    }

    if (isRateLimited && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 1.5);
    }
    
    if ((err.status >= 500 || errorMessage.includes('500')) && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay + 1000);
    }

    throw err;
  }
}

export const validateApiKey = async (customKey?: string): Promise<{ success: boolean; message: string }> => {
  try {
    const apiKey = customKey || keyManager.getCurrentKey();
    if (!apiKey) return { success: false, message: "No key found." };
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
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
  return callWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    let mimeType = 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:([^;]+);/);
      if (match) mimeType = match[1];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: `Analyze this fashion look. Output JSON only. 
          Suggest 6 different high-end editorial aesthetics (Cyberpunk, Quiet Luxury, etc.). 
          Include specific productKeywords for matching items.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gender: { type: Type.STRING, enum: ['male', 'female'] },
            detectedAesthetic: { type: Type.STRING },
            analysisReasoning: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  category: { type: Type.STRING },
                  productKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  });
};

export const generateStyledImage = async (originalImageBase64: string, prompt: string): Promise<string> => {
  return callWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = originalImageBase64.includes(',') ? originalImageBase64.split(',')[1] : originalImageBase64;
    
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: `High-fashion photography transformation: ${prompt}. Cinematic lighting, 8k resolution, maintaining body proportions.` }
        ]
      }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part) throw new Error("STYLE_TRANSFORM_FAILED");
    return `data:image/png;base64,${part.inlineData.data}`;
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
