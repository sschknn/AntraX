# AntraX-AI Fashion Styling Studio

🚀 **AI-powered fashion styling app with real product recommendations**

## Features

- ✨ **AI Fashion Styling**: Transform your photos with Gemini AI
- 👥 **Multi-Person Support**: Style multiple people simultaneously  
- 🎨 **12 Street Styles**: Random youth-focused outfit generation
- 🛍️ **Real Products**: Authentic items from Nike, Adidas, Zara, H&M
- 🌍 **Multi-Language**: German, English, French, Spanish
- 📱 **Responsive Design**: Optimized for mobile and desktop
- 🛒 **Amazon Integration**: Direct purchase links with affiliate program

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your VITE_GEMINI_API_KEY

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Build**: Vite with optimized chunks
- **Deployment**: Ready for Vercel/Netlify

## Deployment

The app is production-ready and can be deployed to:

### **Vercel** (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variable
vercel env add VITE_GEMINI_API_KEY
```

### **Netlify**
```bash
# Install Netlify CLI  
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Set environment variable in Netlify dashboard
```

### **Manual Deploy**
Upload `dist/` folder to any static hosting service.

## License

Private - All rights reserved

---

Made with ❤️ by AntraX-AI Team
