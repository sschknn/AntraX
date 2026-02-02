
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Language } from '../types';
import { Button } from './ui/Button';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  lang: Language;
  voiceActive?: boolean;
}

export interface CameraViewRef {
  capture: () => void;
}

export const CameraView = forwardRef<CameraViewRef, CameraViewProps>(({ onCapture, lang, voiceActive }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [rotation, setRotation] = useState<number>(0); 
  const [confidence, setConfidence] = useState(0); 

  const [checks, setChecks] = useState({ 
    centered: false, 
    personDetected: false, 
    upright: true 
  });

  const t = {
    de: {
      searching: 'Suche...',
      center: 'Bitte zentrieren',
      ready: 'READY',
      hud: 'AX STUDIO',
      permTitle: 'Kamera erforderlich',
      permRetry: 'Erneut versuchen',
      manual: 'AUFNEHMEN',
      upload: 'UPLOAD',
      voiceActive: 'STYLIST AKTIV'
    },
    en: {
      searching: 'Searching...',
      center: 'Center yourself',
      ready: 'READY',
      hud: 'AX STUDIO',
      permTitle: 'Camera Required',
      permRetry: 'Retry',
      manual: 'CAPTURE',
      upload: 'UPLOAD',
      voiceActive: 'STYLIST ACTIVE'
    }
  }[lang];

  const capture = () => {
    if (isCapturing || !videoRef.current || !captureCanvasRef.current) return;
    
    setIsCapturing(true); 

    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;
    const isVertical = rotation === 90 || rotation === 270;
    
    canvas.width = isVertical ? vHeight : vWidth;
    canvas.height = isVertical ? vWidth : vHeight;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(-1, 1);
    ctx.drawImage(video, -vWidth / 2, -vHeight / 2, vWidth, vHeight);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onCapture(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useImperativeHandle(ref, () => ({
    capture
  }));

  const startCamera = async () => {
    setIsReady(false);
    setHasPermissionError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      setHasPermissionError(true);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady || isCapturing) return;

    let lastFrame: ImageData | null = null;
    let accumulatedConfidence = 0;
    
    const analyzeFrame = () => {
      if (!videoRef.current || !hiddenCanvasRef.current || isCapturing) return;

      const video = videoRef.current;
      const canvas = hiddenCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx || video.paused || video.ended) return;

      canvas.width = 160;
      canvas.height = 120;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (lastFrame) {
        let activePixels = 0;
        let minX = 160, maxX = 0;

        for (let i = 0; i < currentFrame.data.length; i += 4) {
          const delta = Math.abs(currentFrame.data[i] - lastFrame.data[i]);
          if (delta > 20) { 
            activePixels++;
            const x = (i / 4) % 160;
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          }
        }
        
        const personDetected = activePixels > 100;
        const centered = minX > 2 && maxX < 158; 

        setChecks(prev => ({ ...prev, personDetected, centered }));

        if (personDetected && centered) {
          accumulatedConfidence += 5; 
          setConfidence(Math.min(100, accumulatedConfidence));
          if (accumulatedConfidence >= 100) {
            capture();
            return;
          }
        } else {
          accumulatedConfidence = Math.max(0, accumulatedConfidence - 4);
          setConfidence(accumulatedConfidence);
        }
      }

      lastFrame = currentFrame;
      requestAnimationFrame(analyzeFrame);
    };

    const frameId = requestAnimationFrame(analyzeFrame);
    return () => cancelAnimationFrame(frameId);
  }, [isReady, isCapturing]);

  return (
    <div className="relative w-full h-full bg-[#020617] flex items-center justify-center overflow-hidden">
      <video 
        ref={videoRef} 
        autoPlay playsInline muted
        className={`w-full h-full object-contain transition-opacity duration-700 ${isCapturing ? 'opacity-0' : 'opacity-100'} scale-x-[-1]`}
      />

      {/* Camera UI Overlay - Re-designed for clear face view */}
      <div className="absolute inset-0 pointer-events-none p-6 md:p-10 flex flex-col justify-between z-10">
        
        {/* Top Bar: Minimalist and out of face way */}
        <div className="flex justify-between items-center w-full">
          <div className="bg-slate-900/60 backdrop-blur-3xl px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${checks.personDetected ? 'bg-indigo-500 animate-pulse' : 'bg-slate-700'}`}></div>
             <span className="text-[9px] font-black text-white tracking-[0.3em] uppercase">{t.hud}</span>
          </div>

          {/* Status in the center top instead of middle */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className={`px-6 py-2 rounded-full border backdrop-blur-3xl transition-all duration-700
              ${checks.personDetected ? 'bg-indigo-600/60 border-indigo-400/30' : 'bg-slate-950/60 border-white/5'}`}>
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                {checks.personDetected ? t.ready : t.searching}
              </span>
            </div>
            {confidence > 0 && (
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${confidence}%` }}></div>
              </div>
            )}
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setRotation(r => (r + 90) % 360); }} 
            className="p-4 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 text-white active:scale-90 transition-all pointer-events-auto hover:bg-white/10"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        {/* Bottom Bar: Compact and lowered */}
        <div className="flex flex-col items-center gap-4 w-full pointer-events-auto">
          <div className="flex items-center gap-12 mb-4">
             {/* Upload as smaller side button */}
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 text-slate-400"
                title={t.upload}
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
             </button>

             {/* Main Capture Button */}
             <button 
                onClick={capture}
                className="group relative flex items-center justify-center"
             >
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity"></div>
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center p-1.5 border-2 border-white/30 backdrop-blur-xl group-hover:scale-110 transition-transform shadow-2xl">
                   <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-slate-900/5 rounded-full"></div>
                   </div>
                </div>
                <span className="absolute -bottom-8 whitespace-nowrap text-[8px] font-black text-white uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity">
                   {t.manual}
                </span>
             </button>

             <div className="w-12"></div> {/* Spacer to balance upload button */}
          </div>
        </div>
      </div>

      {/* Permissions/Errors */}
      {hasPermissionError && (
        <div className="absolute inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-12 text-center gap-8">
          <div className="w-20 h-20 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center text-red-500 border border-red-500/20">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{t.permTitle}</h2>
          <Button variant="primary" size="lg" onClick={startCamera}>{t.permRetry}</Button>
        </div>
      )}

      {isCapturing && <div className="absolute inset-0 bg-white z-[150] animate-flash"></div>}
      <canvas ref={hiddenCanvasRef} className="hidden" />
      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
});
