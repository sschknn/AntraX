import { Language } from './types';

export const translations = {
  de: {
    // Navigation & UI
    camera: "Studio",
    gallery: "Archiv", 
    wardrobe: "Cloud Garderobe",
    cart: "Warenkorb",
    settings: "Setup",
    
    // Actions
    capture: "Foto aufnehmen",
    retake: "Erneut aufnehmen",
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    share: "Teilen",
    
    // Fashion
    outfit: "Outfit",
    style: "Stil",
    color: "Farbe",
    size: "Größe",
    brand: "Marke",
    price: "Preis",
    
    // Messages
    loading: "Lädt...",
    error: "Fehler",
    success: "Erfolgreich",
    noResults: "Keine Ergebnisse",
    generating: "KI stylt dich...",
    
    // AI Features
    aiSuggestions: "KI-Vorschläge",
    aiInsights: "KI TRENDS",
    styleAnalysis: "Stil-Analyse",
    colorMatch: "Farb-Matching",
    
    // Shopping
    addToCart: "In Warenkorb",
    buyNow: "Jetzt kaufen",
    viewProduct: "Produkt ansehen",
    
    // App specific
    outfitSaved: "In Cloud gesichert!",
    styleSaved: "Style-Preset gespeichert!",
    changeAccount: "Konto / API Key wechseln",
    signOut: "Abmelden",
    apiError: "KI überlastet. Warte auf freien Slot...",
    rotating: "Rate Limit! Rotiere Key...",
    safetyError: "Blockiert von KI-Sicherheit.",
    presets: "Style-Bibliothek",
    
    // Seasons & Occasions
    spring: "Frühling",
    summer: "Sommer",
    autumn: "Herbst", 
    winter: "Winter",
    casual: "Lässig",
    formal: "Formell",
    party: "Party",
    business: "Business"
  },
  
  en: {
    // Navigation & UI
    camera: "Studio",
    gallery: "Archive",
    wardrobe: "Cloud Wardrobe", 
    cart: "Cart",
    settings: "Setup",
    
    // Actions
    capture: "Take Photo",
    retake: "Retake",
    save: "Save",
    cancel: "Cancel", 
    delete: "Delete",
    edit: "Edit",
    share: "Share",
    
    // Fashion
    outfit: "Outfit",
    style: "Style",
    color: "Color",
    size: "Size",
    brand: "Brand", 
    price: "Price",
    
    // Messages
    loading: "Loading...",
    error: "Error",
    success: "Success",
    noResults: "No Results",
    generating: "AI Styling...",
    
    // AI Features
    aiSuggestions: "AI Suggestions",
    aiInsights: "AI TRENDS",
    styleAnalysis: "Style Analysis", 
    colorMatch: "Color Matching",
    
    // Shopping
    addToCart: "Add to Cart",
    buyNow: "Buy Now",
    viewProduct: "View Product",
    
    // App specific
    outfitSaved: "Saved to Cloud!",
    styleSaved: "Style preset saved!",
    changeAccount: "Change Account / Key",
    signOut: "Sign Out",
    apiError: "AI busy. Waiting for free slot...",
    rotating: "Rate Limit! Rotating key...",
    safetyError: "Blocked by AI safety filters.",
    presets: "Style Library",
    
    // Seasons & Occasions
    spring: "Spring",
    summer: "Summer", 
    autumn: "Autumn",
    winter: "Winter",
    casual: "Casual",
    formal: "Formal",
    party: "Party",
    business: "Business"
  },

  fr: {
    camera: "Caméra",
    gallery: "Galerie",
    wardrobe: "Garde-robe",
    cart: "Panier",
    settings: "Paramètres",
    capture: "Prendre Photo",
    retake: "Reprendre",
    save: "Sauvegarder",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    share: "Partager",
    outfit: "Tenue",
    style: "Style",
    color: "Couleur",
    size: "Taille",
    brand: "Marque",
    price: "Prix",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    noResults: "Aucun Résultat",
    aiSuggestions: "Suggestions IA",
    styleAnalysis: "Analyse de Style",
    colorMatch: "Correspondance Couleur",
    addToCart: "Ajouter au Panier",
    buyNow: "Acheter Maintenant",
    viewProduct: "Voir Produit",
    spring: "Printemps",
    summer: "Été",
    autumn: "Automne",
    winter: "Hiver",
    casual: "Décontracté",
    formal: "Formel",
    party: "Fête",
    business: "Affaires"
  },

  es: {
    camera: "Cámara",
    gallery: "Galería",
    wardrobe: "Armario",
    cart: "Carrito",
    settings: "Configuración",
    capture: "Tomar Foto",
    retake: "Repetir",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    share: "Compartir",
    outfit: "Atuendo",
    style: "Estilo",
    color: "Color",
    size: "Talla",
    brand: "Marca",
    price: "Precio",
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    noResults: "Sin Resultados",
    aiSuggestions: "Sugerencias IA",
    styleAnalysis: "Análisis de Estilo",
    colorMatch: "Combinación de Colores",
    addToCart: "Añadir al Carrito",
    buyNow: "Comprar Ahora",
    viewProduct: "Ver Producto",
    spring: "Primavera",
    summer: "Verano",
    autumn: "Otoño",
    winter: "Invierno",
    casual: "Casual",
    formal: "Formal",
    party: "Fiesta",
    business: "Negocios"
  }
};

export const useTranslation = (language: Language) => {
  const t = (key: keyof typeof translations.en): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };
  
  return { t };
};

export const getLanguageFlag = (lang: Language): string => {
  const flags = {
    de: "🇩🇪",
    en: "🇺🇸", 
    fr: "🇫🇷",
    es: "🇪🇸",
    it: "🇮🇹",
    pt: "🇵🇹",
    nl: "🇳🇱",
    pl: "🇵🇱",
    ru: "🇷🇺",
    zh: "🇨🇳",
    ja: "🇯🇵",
    ko: "🇰🇷"
  };
  return flags[lang] || "🌐";
};

export const getLanguageName = (lang: Language): string => {
  const names = {
    de: "Deutsch",
    en: "English",
    fr: "Français", 
    es: "Español",
    it: "Italiano",
    pt: "Português",
    nl: "Nederlands",
    pl: "Polski",
    ru: "Русский",
    zh: "中文",
    ja: "日本語",
    ko: "한국어"
  };
  return names[lang] || lang;
};
