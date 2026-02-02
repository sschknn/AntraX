
import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { Button } from './ui/Button';

interface StyleProfileWizardProps {
  onComplete: (profile: UserProfile) => void;
  lang: Language;
}

export const StyleProfileWizard: React.FC<StyleProfileWizardProps> = ({ onComplete, lang }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    gender: 'female',
    aesthetic: 'minimalist',
    budget: 'standard',
    isSetup: true
  });

  const t = {
    de: {
      welcome: "DEIN STYLE PROFIL",
      desc: "Lerne dein AI-Styler kennen. Wir personalisieren dein Erlebnis.",
      next: "Weiter",
      done: "Los geht's!",
      q1: "Was ist dein Name?",
      q2: "Deine Identität?",
      q3: "Deine Ästhetik?",
      q4: "Dein Budget-Fokus?"
    },
    en: {
      welcome: "YOUR STYLE PROFILE",
      desc: "Meet your AI-Styler. Let's personalize your journey.",
      next: "Next",
      done: "Let's Go!",
      q1: "What's your name?",
      q2: "Your Identity?",
      q3: "Your Aesthetic?",
      q4: "Your Budget Focus?"
    }
  }[lang];

  const aesthetics = ['minimalist', 'vintage', 'quiet-luxury', 'streetwear'];
  const budgets = ['budget', 'standard', 'premium'];
  const genders = ['male', 'female', 'unisex'];

  const steps = [
    (
      <div className="space-y-6">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{t.welcome}</h2>
        <p className="text-slate-400 text-xs leading-relaxed uppercase tracking-widest">{t.desc}</p>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t.q1}</label>
          <input 
            type="text" 
            value={profile.name} 
            onChange={e => setProfile({...profile, name: e.target.value})}
            className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            placeholder="e.g. Alex"
          />
        </div>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">{t.q2}</h2>
        <div className="flex flex-col gap-3">
          {genders.map(g => (
            <button 
              key={g}
              onClick={() => setProfile({...profile, gender: g as any})}
              className={`h-16 px-6 rounded-2xl border transition-all flex items-center justify-between
                ${profile.gender === g ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}
              `}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">{g}</span>
              <div className={`w-3 h-3 rounded-full border-2 ${profile.gender === g ? 'bg-white border-white' : 'border-slate-700'}`}></div>
            </button>
          ))}
        </div>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">{t.q3}</h2>
        <div className="grid grid-cols-2 gap-3">
          {aesthetics.map(a => (
            <button 
              key={a}
              onClick={() => setProfile({...profile, aesthetic: a as any})}
              className={`h-20 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest
                ${profile.aesthetic === a ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}
              `}
            >
              {a.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>
    ),
    (
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">{t.q4}</h2>
        <div className="flex flex-col gap-3">
          {budgets.map(b => (
            <button 
              key={b}
              onClick={() => setProfile({...profile, budget: b as any})}
              className={`h-16 px-6 rounded-2xl border transition-all flex items-center justify-between
                ${profile.budget === b ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}
              `}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">{b}</span>
              <div className={`w-3 h-3 rounded-full border-2 ${profile.budget === b ? 'bg-white border-white' : 'border-slate-700'}`}></div>
            </button>
          ))}
        </div>
      </div>
    )
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="flex gap-1 mb-10">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-indigo-500' : 'bg-white/5'}`}></div>
          ))}
        </div>

        {steps[step]}

        <div className="mt-12">
          <Button 
            variant="primary" 
            className="w-full h-14 text-[11px] font-black uppercase tracking-widest"
            onClick={() => {
              if (step < steps.length - 1) setStep(step + 1);
              else onComplete(profile);
            }}
          >
            {step === steps.length - 1 ? t.done : t.next}
          </Button>
        </div>
      </div>
    </div>
  );
};
