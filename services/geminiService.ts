
import { GoogleGenAI, Type } from "@google/genai";
import { Language, Product } from "../types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Edits the captured image based on a natural language instruction.
 */
export const editAppearance = async (originalImageBase64: string, instruction: string): Promise<string> => {
  const ai = getAIClient();
  
  // Strip prefix if present
  const base64Data = originalImageBase64.includes(',') ? originalImageBase64.split(',')[1] : originalImageBase64;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: `Edit this person's appearance based on this request: "${instruction}". 
                 Ensure the changes are realistic and follow the person's body shape and pose. 
                 Keep the background and facial identity identical. 
                 Focus only on modifying the clothing or accessories as requested.` }
      ]
    }
  });

  let imageUrl = '';
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) throw new Error("AI failed to modify the image.");
  return imageUrl;
};

/**
 * Provides a conversational response to the user's styling request.
 */
export const getStylistResponse = async (prompt: string, lang: Language): Promise<string> => {
  const ai = getAIClient();
  const languageName = lang === 'de' ? 'German' : 'English';
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are a high-end AI fashion stylist. The user just asked: "${prompt}". 
               Give a short, professional, and encouraging response in ${languageName} (max 15 words) 
               confirming that you are applying that style change now.`
  });
  return response.text || (lang === 'de' ? "Perfekt, ich kümmere mich darum." : "Perfect, I'm on it.");
};

/**
 * Mocks a visual search service that finds products matching the generated style.
 */
export const findMatchingProducts = async (instruction: string, lang: Language): Promise<Product[]> => {
  // Simulating network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // In a real app, we would use the image or text to query a real product API.
  // Here we return realistic placeholders.
  const isSuit = instruction.toLowerCase().includes('anzug') || instruction.toLowerCase().includes('suit');
  const isDress = instruction.toLowerCase().includes('kleid') || instruction.toLowerCase().includes('dress');

  if (isSuit) {
    return [
      { id: '1', name: 'Slim-Fit Wool Suit', brand: 'V-Boutique', price: '499.00€', url: '#', thumbnail: '👔' },
      { id: '2', name: 'Silk Pocket Square', brand: 'Moda AI', price: '45.00€', url: '#', thumbnail: '🧣' },
      { id: '3', name: 'Oxford Leather Shoes', brand: 'Elegance', price: '189.00€', url: '#', thumbnail: '👞' }
    ];
  } else if (isDress) {
    return [
      { id: '4', name: 'Floral Evening Gown', brand: 'V-Boutique', price: '320.00€', url: '#', thumbnail: '👗' },
      { id: '5', name: 'Velvet Clutch Bag', brand: 'Moda AI', price: '89.00€', url: '#', thumbnail: '👜' },
      { id: '6', name: 'Stiletto Sandals', brand: 'Elegance', price: '129.00€', url: '#', thumbnail: '👠' }
    ];
  }

  return [
    { id: '7', name: 'Premium Cotton T-Shirt', brand: 'Essentials', price: '35.00€', url: '#', thumbnail: '👕' },
    { id: '8', name: 'Tailored Chinos', brand: 'V-Boutique', price: '110.00€', url: '#', thumbnail: '👖' }
  ];
};
