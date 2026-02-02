
// Hinweis: In einer echten Umgebung müssten hier die Firebase Configs stehen.
// Wir implementieren eine robuste Abstraktionsschicht für Auth und Firestore.

import { SavedOutfit, WardrobeItem, UserAuth } from '../types';

// Mock-Datenbank-Simulation für die Demo, bereit für echte Firebase-Anbindung
const COLLECTION_OUTFITS = 'saved_outfits';
const COLLECTION_WARDROBE = 'wardrobe';

export const firebaseService = {
  // Auth
  async signInWithGoogle(): Promise<UserAuth> {
    // Hier würde normalerweise signInWithPopup(auth, provider) stehen
    return {
      uid: 'user_' + Math.random().toString(36).substr(2, 9),
      email: 'fashionista@example.com',
      displayName: 'Fashion Pro',
      plan: 'pro'
    };
  },

  // Firestore: Outfits speichern
  async saveOutfit(userId: string, outfit: SavedOutfit): Promise<void> {
    console.log(`[Firestore] Saving outfit ${outfit.id} for user ${userId}`);
    // await addDoc(collection(db, `users/${userId}/${COLLECTION_OUTFITS}`), outfit);
    const existing = JSON.parse(localStorage.getItem(`outfits_${userId}`) || '[]');
    localStorage.setItem(`outfits_${userId}`, JSON.stringify([...existing, outfit]));
  },

  // Firestore: Outfits laden
  async loadOutfits(userId: string): Promise<SavedOutfit[]> {
    console.log(`[Firestore] Loading outfits for user ${userId}`);
    return JSON.parse(localStorage.getItem(`outfits_${userId}`) || '[]');
  },

  // Firestore: Garderobe speichern
  async saveWardrobeItem(userId: string, item: WardrobeItem): Promise<void> {
    const existing = JSON.parse(localStorage.getItem(`wardrobe_${userId}`) || '[]');
    localStorage.setItem(`wardrobe_${userId}`, JSON.stringify([...existing, item]));
  },

  // Firestore: Garderobe laden
  async loadWardrobe(userId: string): Promise<WardrobeItem[]> {
    return JSON.parse(localStorage.getItem(`wardrobe_${userId}`) || '[]');
  }
};
