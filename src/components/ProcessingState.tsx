
import React, { useState, useEffect } from 'react';

interface ProcessingStateProps {
  phase: 'detecting' | 'transforming' | 'searching';
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({ phase }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 10 : prev));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  const messages = {
    detecting: "Analyzing pose & lighting...",
    transforming: "Stitching garment to body...",
    searching: "Finding matching items..."
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
        <div 
          className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"
          style={{ animationDuration: '1s' }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-indigo-600">{Math.round(progress)}%</span>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">{messages[phase]}</h3>
      <p className="text-slate-500 text-center max-w-sm">
        Our AI is processing your request. This typically takes 5-10 seconds for high-quality results.
      </p>
      
      <div className="w-full max-w-md mt-10 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};
