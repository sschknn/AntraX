
export enum Step {
  CAMERA = 'CAMERA',
  EDITING = 'EDITING',
  GALLERY = 'GALLERY',
  WARDROBE = 'WARDROBE',
  SETTINGS = 'SETTINGS'
}

export type Language = 'de' | 'en' | 'fr' | 'es' | 'it' | 'pt' | 'nl' | 'pl' | 'ru' | 'zh' | 'ja' | 'ko';
export type PlanType = 'free' | 'pro';

export interface UserAuth {
  uid: string;
  email: string;
  displayName: string;
  plan: PlanType;
}

export interface UserProfile {
  name: string;
  gender: 'male' | 'female' | 'unisex';
  aesthetic: 'quiet-luxury' | 'streetwear' | 'vintage' | 'minimalist';
  budget: 'budget' | 'standard' | 'premium';
  isSetup: boolean;
}

export interface WardrobeItem {
  id: string;
  category: WardrobeCategory;
  imageUrl: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isProcessing?: boolean;
}

export type SuggestionStatus = 'idle' | 'queued' | 'processing' | 'success' | 'error' | 'safety' | 'rotating';

export interface DynamicSuggestion {
  label: string;
  prompt: string;
  category: string;
  imageUrl?: string;
  status: SuggestionStatus;
  errorMessage?: string;
  products?: Product[];
}

export interface SavedStyle {
  id: string;
  label: string;
  prompt: string;
  aesthetic: string;
}

export interface StyleState {
  hair: string;
  outfit: string;
  accessories: string;
  gender: 'male' | 'female';
  ageGroup: 'young' | 'adult' | 'mature';
  baseStyle: 'modern' | 'vintage' | 'opera' | 'casual' | 'cyberpunk' | 'festival' | 'high-fashion';
  background?: 'studio' | 'street' | 'paris' | 'office' | 'neon' | 'desert';
  customPrompt?: string;
}

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'All';
export type Occasion = 'Business' | 'Casual' | 'Party' | 'Sport' | 'Gala' | 'None';
export type WardrobeCategory = 'Tops' | 'Bottoms' | 'Dresses' | 'Jackets' | 'Shoes' | 'Accessories' | 'All';

export interface SavedOutfit {
  id: string;
  timestamp: number;
  imageUrl: string;
  description: string;
  favorite: boolean;
  rating: number;
  reactions: number;
  style: StyleState;
  season: Season;
  occasion: Occasion;
  category: WardrobeCategory;
  cartSnapshot?: Product[];
  promptUsed?: string;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  brand: string;
  url: string;
  thumbnail: string;
  category: 'top' | 'bottom' | 'shoes' | 'accessories' | 'outerwear';
  outfitId?: string;
  outfitLabel?: string;
  sizes?: string[];
  colors?: string[];
}

export interface CartItem {
  id: string;
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export interface WishlistItem {
  id: string;
  product: Product;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}
