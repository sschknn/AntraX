
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Language } from '../types';

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
  const backgroundFrameRef = useRef<ImageData | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode] = useState<'user' | 'environment'>('user');
  
  const [rotation, setRotation] = useState<number>(0); 
  const [confidence, setConfidence] = useState(0); 
  const [countdown, setCountdown] = useState<number | null>(null);

  const [checks, setChecks] = useState({ 
    centered: false, 
    personDetected: false, 
    focus: false, 
    stability: false,
    upright: false 
  });

  const t = {
    de: {
      searching: 'Suche...',
      center: 'Zentrieren',
      holdStill: 'Stillhalten...',
      rotateHint: 'Kamera drehen',
      ready: 'Lächeln!',
      stability: 'RUHE',
      focus: 'SCHÄRFE',
      body: 'BODY',
      pos: 'POS',
      aligned: 'VERT',
      hud: 'AI ENGINE',
      permTitle: 'Kamera erforderlich',
      permRetry: 'Retry',
      manual: 'FOTO',
      voiceActive: 'STYLIST'
    },
    en: {
      searching: 'Searching...',
      center: 'Center yourself',
      holdStill: 'Hold still...',
      rotateHint: 'Rotate camera',
      ready: 'Smile!',
      stability: 'STILL',
      focus: 'SHARP',
      body: 'BODY',
      pos: 'POS',
      aligned: 'VERT',
      hud: 'AI ENGINE',
      permTitle: 'Camera Required',
      permRetry: 'Retry',
      manual: 'PHOTO',
      voiceActive: 'STYLIST'
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
    
    if (facingMode === 'user') {
      if (rotation === 0 || rotation === 180) ctx.scale(-1, 1);
      else ctx.scale(1, -1);
    }
    
    ctx.drawImage(video, -vWidth / 2, -vHeight / 2, vWidth, vHeight);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(dataUrl);
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
          facingMode: facingMode, 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setIsReady(true);
      }
    } catch (err) {
      setHasPermissionError(true);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [facingMode]);

  useEffect(() => {
    if (!isReady || isCapturing) return;

    let lastFrame: ImageData | null = null;
    let framesAnalyzed = 0;
    let accumulatedConfidence = 0;
    let stableFrameCount = 0;
    
    const REQUIRED_STABLE_FRAMES = 8; 
    const MIN_STABILITY_THRESHOLD = 75; 

    const analyzeFrame = () => {
      if (!videoRef.current || !hiddenCanvasRef.current || isCapturing) return;

      const video = videoRef.current;
      const canvas = hiddenCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = 160;
      canvas.height = 120;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (framesAnalyzed % 60 === 0) backgroundFrameRef.current = currentFrame;
      framesAnalyzed++;

      if (lastFrame) {
        let motionDiff = 0;
        let activePixels = 0;
        let minY = 120, maxY = 0, minX = 160, maxX = 0;
        const referenceFrame = backgroundFrameRef.current || lastFrame;

        for (let i = 0; i < currentFrame.data.length; i += 4) {
          const delta = Math.abs(currentFrame.data[i] - referenceFrame.data[i]);
          motionDiff += Math.abs(currentFrame.data[i] - lastFrame.data[i]);
          if (delta > 35) {
            activePixels++;
            const x = (i / 4) % 160;
            const y = Math.floor((i / 4) / 160);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          }
        }
        
        const currentStability = Math.max(0, 100 - (motionDiff / (canvas.width * canvas.height) * 10));
        let clarityScore = 0;
        for (let i = 4; i < currentFrame.data.length; i += 32) clarityScore += Math.abs(currentFrame.data[i] - currentFrame.data[i - 4]);
        const normalizedClarity = Math.min(100, clarityScore / 100);

        const bodyW = maxX - minX;
        const bodyH = maxY - minY;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;

        const personDetected = activePixels > 400 && bodyH > 30;
        const isCurrentlyPortraitBlob = bodyH > (bodyW * 0.85);
        const isStable = currentStability > MIN_STABILITY_THRESHOLD;
        const isSharp = normalizedClarity > 12;
        
        const isVerticalUI = rotation === 90 || rotation === 270;
        const centered = isVerticalUI ? (midY > 20 && midY < 100) : (midX > 35 && midX < 125);

        setChecks({ centered, personDetected, focus: isSharp, stability: isStable, upright: isCurrentlyPortraitBlob });

        if (personDetected && centered && isStable && isSharp && isCurrentlyPortraitBlob) {
          accumulatedConfidence += 12.0; 
          stableFrameCount++;
          setConfidence(Math.min(100, accumulatedConfidence));

          if (accumulatedConfidence >= 100 && stableFrameCount >= REQUIRED_STABLE_FRAMES) {
            capture();
            return;
          }
          setCountdown(Math.ceil((100 - accumulatedConfidence) / 20));
        } else {
          accumulatedConfidence = Math.max(0, accumulatedConfidence - 8);
          stableFrameCount = Math.max(0, stableFrameCount - 2);
          setConfidence(accumulatedConfidence);
          setCountdown(null);
        }
      }

      lastFrame = currentFrame;
      requestAnimationFrame(analyzeFrame);
    };

    const frameId = requestAnimationFrame(analyzeFrame);
    return () => cancelAnimationFrame(frameId);
  }, [isReady, isCapturing, rotation]);

  const getStatusMessage = () => {
    if (!checks.personDetected) return t.searching;
    if (!checks.upright) return t.rotateHint;
    if (!checks.centered) return t.center;
    if (!checks.stability || !checks.focus) return t.holdStill;
    return t.ready;
  };

  if (hasPermissionError) return <div className="w-full h-[40vh] bg-slate-950 rounded-[1.5rem] flex flex-col items-center justify-center p-6 text-center"><button onClick={startCamera} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs">{t.permRetry}</button></div>;

  return (
    <div className="relative w-full h-[45vh] md:h-[50vh] bg-black rounded-[2rem] overflow-hidden shadow-xl border border-white/10">
      <div className="w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden relative">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className={`object-contain transition-all duration-300 ${isCapturing ? 'opacity-0' : 'opacity-100'}`}
          style={{
            transform: `rotate(${rotation}deg) ${facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)'}`,
            width: '100%',
            height: '100%',
            maxHeight: '100%',
            maxWidth: '100%'
          }}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="flex flex-col gap-1.5">
            <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-2">
               <div className={`w-1 h-1 rounded-full ${checks.personDetected ? 'bg-indigo-500 animate-pulse' : 'bg-white/20'}`}></div>
               <span className="text-[7px] font-black text-white tracking-widest uppercase">{t.hud}</span>
            </div>
            {voiceActive && (
              <div className="bg-red-600/30 backdrop-blur-md px-2 py-1 rounded-md border border-red-500/20 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-white animate-ping"></div>
                <span className="text-[6px] font-black text-white uppercase">{t.voiceActive}</span>
              </div>
            )}
          </div>
          <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-white active:scale-90 transition-transform pointer-events-auto">
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-black text-white drop-shadow-xl">{countdown}</span>
          </div>
        )}

        <div className="flex flex-col items-center gap-2.5">
          <div className="grid grid-cols-5 gap-1.5 w-full max-w-[200px]">
            {[
              { label: t.body, ok: checks.personDetected },
              { label: t.pos, ok: checks.centered },
              { label: t.aligned, ok: checks.upright },
              { label: t.focus, ok: checks.focus },
              { label: t.stability, ok: checks.stability }
            ].map((check, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className={`w-full aspect-square rounded-md border transition-all duration-300 flex items-center justify-center 
                  ${check.ok ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-400' : 'bg-white/5 border-white/5 text-white/5'}`}>
                  {check.ok && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className={`text-[5px] font-black uppercase tracking-tighter ${check.ok ? 'text-indigo-400' : 'text-white/20'}`}>{check.label}</span>
              </div>
            ))}
          </div>

          <div className={`w-full max-w-[240px] py-1.5 px-4 rounded-xl border backdrop-blur-md transition-all duration-500 
            ${checks.upright && checks.personDetected ? 'bg-indigo-600/60 border-indigo-400/40' : 'bg-slate-900/60 border-white/5'}`}>
            <span className="text-[9px] font-black text-white text-center block uppercase tracking-[0.1em]">
              {getStatusMessage()}
            </span>
          </div>
          
          <button 
            onClick={capture}
            className="pointer-events-auto group relative flex items-center justify-center mb-2"
          >
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center p-0.5 border border-white group-active:scale-95 transition-transform">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border border-black/5 rounded-full"></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {isCapturing && <div className="absolute inset-0 bg-white z-[100] animate-flash"></div>}

      <canvas ref={hiddenCanvasRef} className="hidden" />
      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
});
