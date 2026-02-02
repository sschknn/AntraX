/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9', 
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        }
      }
    },
  },
  plugins: [],
  safelist: [
    'bg-[#020617]',
    'text-slate-200',
    'text-slate-400',
    'text-slate-500',
    'text-white',
    'text-indigo-400',
    'text-indigo-500',
    'bg-indigo-500',
    'bg-indigo-600',
    'bg-white/5',
    'bg-white/10',
    'border-white/5',
    'border-white/10',
    'hover:bg-white/10',
    'hover:bg-indigo-500',
    'min-h-screen',
    'flex',
    'items-center',
    'justify-center',
    'justify-between',
    'text-center',
    'font-black',
    'font-bold',
    'uppercase',
    'rounded-full',
    'rounded-xl',
    'rounded-2xl',
    'rounded-3xl',
    'animate-spin',
    'transition-all',
    'cursor-pointer',
    'sticky',
    'top-0',
    'backdrop-blur-3xl',
    'shadow-2xl',
    'grid',
    'grid-cols-1',
    'xl:grid-cols-12',
    'xl:col-span-6',
    'flex-1',
    'flex-col',
    'relative',
    'absolute',
    'overflow-hidden',
    'aspect-video'
  ]
}
