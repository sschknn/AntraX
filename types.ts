
export enum Step {
  CAMERA = 'CAMERA',
  EDITING = 'EDITING'
}

export type Language = 'de' | 'en';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isProcessing?: boolean;
}

export interface DynamicSuggestion {
  label: string;
  prompt: string;
  category: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface StyleState {
  hair: string;
  outfit: string;
  accessories: string;
  gender: 'male' | 'female';
  ageGroup: 'young' | 'adult' | 'mature';
  baseStyle: 'modern' | 'vintage' | 'opera' | 'casual';
}

export interface Product {
  id: string;
  name: string;
  price: string;
  brand: string;
  url: string;
  thumbnail: string;
}

export interface StylingResult {
  imageUrl: string;
  products: Product[];
}

export interface LiveSessionConfig {
  onTranscription: (text: string, role: 'user' | 'assistant') => void;
  onApplyStyle: (description: string) => void;
  onTakePhoto: () => void;
  onReset?: () => void;
  onError: (error: any) => void;
}
