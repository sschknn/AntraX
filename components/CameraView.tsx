
import React, { useRef, useEffect, useState } from 'react';
import { Language } from '../types';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  lang: Language;
}

type AIStatus = 'SEARCHING' | 'POSITIONING' | 'STABILIZING' | 'READY' | 'COUNTDOWN';

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, lang }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const bestFrameCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundFrameRef = useRef<ImageData | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [stability, setStability] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [rotation, setRotation] = useState<number>(0);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0); // 0 to 100
  const [checks, setChecks] = useState({ 
    centered: false, 
    personDetected: false, 
    focus: false, 
    stability: false 
  });

  const t = {
    de: {
      searching: 'Suche Silhouette...',
      stepBack: 'Person positionieren',
      center: 'Bitte mittig ausrichten',
      holdStill: 'Stillhalten für Scan...',
      ready: 'Optimaler Moment...',
      stability: 'Ruhe',
      focus: 'Schärfe',
      body: 'Körper',
      pos: 'Mittig',
      hud: 'AI VISION ENGINE'
    },
    en: {
      searching: 'Finding silhouette...',
      stepBack: 'Position yourself',
      center: 'Center yourself',
      holdStill: 'Hold still for scan...',
      ready: 'Ideal moment...',
      stability: 'Still',
      focus: 'Sharp',
      body: 'Body',
      pos: 'Center',
      hud: 'AI VISION ENGINE'
    }
  }[lang];

  const startCamera = async () => {
    setIsReady(false);
    backgroundFrameRef.current = null;
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
        videoRef.current.onloadedmetadata = () => {
          const video = videoRef.current;
          if (video) {
            const videoIsLandscape = video.videoWidth > video.videoHeight;
            const isPortraitUI = window.innerHeight > window.innerWidth;
            if (videoIsLandscape && isPortraitUI) {
              setRotation(90);
            } else {
              setRotation(0);
            }
            setIsReady(true);
          }
        };
      }
    } catch (err) {
      console.error("Camera access denied:", err);
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
    let bestScore = 0;
    let accumulatedConfidence = 0;
    
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

      if (framesAnalyzed % 120 === 15) {
        backgroundFrameRef.current = currentFrame;
      }
      framesAnalyzed++;

      if (lastFrame) {
        let motionDiff = 0;
        let activePixels = 0;
        let minY = 120, maxY = 0, minX = 160, maxX = 0;
        const referenceFrame = backgroundFrameRef.current || lastFrame;

        for (let i = 0; i < currentFrame.data.length; i += 4) {
          const delta = Math.abs(currentFrame.data[i] - referenceFrame.data[i]);
          const frameDelta = Math.abs(currentFrame.data[i] - lastFrame.data[i]);
          motionDiff += frameDelta;
          
          if (delta > 35) {
            activePixels++;
            const x = (i / 4) % 160;
            const y = Math.floor((i / 4) / 160);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          }
        }
        
        const motionScore = motionDiff / (canvas.width * canvas.height);
        const currentStability = Math.max(0, 100 - (motionScore * 15));
        setStability(Math.round(currentStability));

        let clarityScore = 0;
        for (let i = 4; i < currentFrame.data.length; i += 16) {
           clarityScore += Math.abs(currentFrame.data[i] - currentFrame.data[i - 4]);
        }
        const normalizedClarity = Math.min(100, clarityScore / 200);
        setClarity(Math.round(normalizedClarity));

        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const bodyW = maxX - minX;
        const bodyH = maxY - minY;
        const isVertical = rotation === 90 || rotation === 270;
        
        let centered = isVertical ? (midY > 35 && midY < 85) : (midX > 55 && midX < 105);

        const aspect = isVertical ? bodyW / bodyH : bodyH / bodyW;
        const isPersonShape = aspect > 1.3 && aspect < 5.5; 
        const isFramedWell = isVertical ? bodyW > 45 && bodyW < 105 : bodyH > 45 && bodyH < 105;
        const personDetected = isPersonShape && isFramedWell && activePixels > 700;

        const isStable = currentStability > 90;
        const isSharp = normalizedClarity > 30;

        setChecks({ centered, personDetected, focus: isSharp, stability: isStable });

        if (personDetected && centered && isStable && isSharp) {
          // Calculate a combined frame quality score
          const frameScore = (currentStability * 0.7) + (normalizedClarity * 0.3);
          
          // If this is the "best moment" so far, buffer it
          if (frameScore > bestScore) {
            bestScore = frameScore;
            updateBestFrameBuffer();
          }

          // Confidence grows faster if the frame is higher quality
          accumulatedConfidence += (frameScore / 100) * 4;
          setConfidence(Math.min(100, accumulatedConfidence));

          if (accumulatedConfidence >= 100) {
            setIsCapturing(true);
            triggerFinalCapture();
            return;
          }
          
          const secondsLeft = Math.ceil((100 - accumulatedConfidence) / 33);
          setCountdown(secondsLeft > 0 ? secondsLeft : null);
        } else {
          accumulatedConfidence = Math.max(0, accumulatedConfidence - 2);
          setConfidence(accumulatedConfidence);
          setCountdown(null);
          // If we lose tracking significantly, reset the best score to find a new one
          if (!personDetected) bestScore = 0;
        }
      }

      lastFrame = currentFrame;
      requestAnimationFrame(analyzeFrame);
    };

    const frameId = requestAnimationFrame(analyzeFrame);
    return () => cancelAnimationFrame(frameId);
  }, [isReady, isCapturing, rotation]);

  const updateBestFrameBuffer = () => {
    if (videoRef.current && bestFrameCanvasRef.current) {
      const video = videoRef.current;
      const canvas = bestFrameCanvasRef.current;
      const ctx = canvas.getContext('2d');
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
    }
  };

  const triggerFinalCapture = () => {
    // We use the best buffered frame instead of the current one to ensure peak quality
    if (bestFrameCanvasRef.current) {
      onCapture(bestFrameCanvasRef.current.toDataURL('image/jpeg', 0.95));
    }
  };

  const cycleRotation = () => {
    setRotation(prev => (prev + 90) % 360);
    backgroundFrameRef.current = null;
  };

  const getStatusMessage = () => {
    if (!checks.personDetected) return t.searching;
    if (!checks.centered) return t.center;
    if (!checks.stability || !checks.focus) return t.holdStill;
    return t.ready;
  };

  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] bg-slate-950 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10">
      <div className="w-full h-full flex items-center justify-center overflow-hidden bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`object-cover transition-all duration-700 
            ${isCapturing ? 'scale-110 blur-2xl opacity-0' : 'scale-100 opacity-100'}`}
          style={{
            transform: `rotate(${rotation}deg) scale(${
              (rotation === 90 || rotation === 270) 
                ? window.innerHeight / (window.innerWidth || 1) 
                : 1
            }) ${facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)'}`,
            width: '100%',
            height: '100%'
          }}
        />
      </div>

      {/* Frame HUD */}
      {!isCapturing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500">
           <div className={`w-[70%] h-[80%] border-2 border-dashed rounded-[3rem] transition-all duration-700 
             ${checks.personDetected && checks.centered ? 'border-indigo-400 opacity-50 scale-105' : 'border-white/10 opacity-20 scale-100'}`}>
           </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-8">
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${confidence > 0 ? 'bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]' : 'bg-white/20'}`}></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black tracking-widest text-white uppercase">{t.hud}</span>
              <span className="text-[7px] font-bold text-indigo-400 tracking-[0.2em] uppercase">Ready for Best Moment</span>
            </div>
          </div>
          
          <button 
            onClick={cycleRotation}
            className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-white/10 transition-all pointer-events-auto active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {countdown !== null && !isCapturing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(79,70,229,0.5)] animate-bounce">
              {countdown}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          <div className="grid grid-cols-4 gap-3 w-full max-w-[280px]">
            {[
              { label: t.body, ok: checks.personDetected },
              { label: t.pos, ok: checks.centered },
              { label: t.focus, ok: checks.focus },
              { label: t.stability, ok: checks.stability }
            ].map((check, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div className={`w-full aspect-square rounded-xl border flex items-center justify-center transition-all duration-500 
                  ${check.ok ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-white/10'}`}>
                  {check.ok && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className={`text-[7px] font-black uppercase tracking-widest ${check.ok ? 'text-indigo-400' : 'text-white/20'}`}>{check.label}</span>
              </div>
            ))}
          </div>
          
          <div className="relative w-full max-w-xs flex flex-col items-center">
            <div className={`px-8 py-4 rounded-3xl border transition-all duration-500 backdrop-blur-2xl shadow-2xl
              ${confidence > 0 ? 'bg-indigo-600/90 border-indigo-400' : 'bg-slate-900/80 border-white/5'}`}>
              <span className="text-[11px] font-black text-white tracking-[0.2em] uppercase text-center block">
                {getStatusMessage()}
              </span>
            </div>
            
            {/* Confidence Progress Bar */}
            <div className="w-32 h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
               <div 
                 className="h-full bg-indigo-500 transition-all duration-300" 
                 style={{ width: `${confidence}%` }}
               ></div>
            </div>
          </div>
        </div>
      </div>

      {isCapturing && (
        <div className="absolute inset-0 bg-white z-50 animate-[shutter_0.4s_ease-out_forwards]"></div>
      )}

      {/* Analysis & Buffer Canvases */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={hiddenCanvasRef} className="hidden" />
      <canvas ref={bestFrameCanvasRef} className="hidden" />

      <style>{`
        @keyframes shutter {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
