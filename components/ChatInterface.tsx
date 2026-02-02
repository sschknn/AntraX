
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Language } from '../types';
import { Button } from './ui/Button';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  lang: Language;
  voiceActive?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isProcessing, lang, voiceActive }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = {
    de: {
      placeholder: 'Stil anpassen...',
      status: 'Style Assistant',
      voiceStatus: 'Live Stylist Aktiv'
    },
    en: {
      placeholder: 'Request style...',
      status: 'Style Assistant',
      voiceStatus: 'Live Stylist Active'
    }
  }[lang];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2.5">
          <div className={`w-1.5 h-1.5 rounded-full ${voiceActive ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'}`}></div>
          <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">{voiceActive ? t.voiceStatus : t.status}</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[12px] leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none font-medium' 
                : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white/5 px-4 py-2 rounded-2xl rounded-tl-none border border-white/5">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {!voiceActive && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 text-white"
          />
          <button type="submit" disabled={isProcessing} className="p-2 h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50">
             <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
};
