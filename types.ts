
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
