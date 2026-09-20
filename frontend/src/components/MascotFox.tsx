import React, { useEffect, useRef, useState } from 'react';

interface MascotFoxProps {
  onFoxClick?: () => void;
}

export const MascotFox: React.FC<MascotFoxProps> = ({ onFoxClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);
  const magnifierRef = useRef<HTMLDivElement>(null);
  const lensGlareRef = useRef<HTMLDivElement>(null);
  const pawRef = useRef<HTMLImageElement>(null);

  const [isBlinking, setIsBlinking] = useState(false);

  // Natural blinking
  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
      blinkTimeout = setTimeout(triggerBlink, Math.random() * 4500 + 3500);
    };
    blinkTimeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Cursor tracking
  useEffect(() => {
    let animFrame: number | null = null;
    let cachedFoxRect: DOMRect | null = null;
    let lastMouseX = window.innerWidth / 2;
    let lastMouseY = window.innerHeight / 2;

    const measureRect = () => {
      if (cardRef.current) {
        cachedFoxRect = cardRef.current.getBoundingClientRect();
      }
    };

    measureRect();
    window.addEventListener('resize', measureRect, { passive: true });
    window.addEventListener('scroll', measureRect, { passive: true });

    const updateTracking = () => {
      animFrame = null;
      if (!leftPupilRef.current || !rightPupilRef.current || !magnifierRef.current) return;
      if (!cachedFoxRect) measureRect();
      const rect = cachedFoxRect;
      if (!rect) return;

      // Note: Background card remains completely still (cardRef transform is disabled)

      // B. Eye Pupil Tracking
      const eyeLX = rect.left + rect.width * 0.33;
      const eyeLY = rect.top + rect.height * 0.357;
      const angleL = Math.atan2(lastMouseY - eyeLY, lastMouseX - eyeLX);
      const distL = Math.min(3.2, Math.hypot(lastMouseX - eyeLX, lastMouseY - eyeLY) / 50);
      leftPupilRef.current.style.transform = `translate(${Math.cos(angleL) * distL}px, ${Math.sin(angleL) * distL * 0.65}px)`;

      const eyeRX = rect.left + rect.width * 0.508;
      const eyeRY = rect.top + rect.height * 0.347;
      const angleR = Math.atan2(lastMouseY - eyeRY, lastMouseX - eyeRX);
      const distR = Math.min(3.2, Math.hypot(lastMouseX - eyeRX, lastMouseY - eyeRY) / 50);
      rightPupilRef.current.style.transform = `translate(${Math.cos(angleR) * distR}px, ${Math.sin(angleR) * distR * 0.65}px)`;

      // C. Magnifying Glass Angular Tilt
      const pivotX = rect.left + rect.width * 0.203;
      const pivotY = rect.top + rect.height * 0.55;
      const cursorAngle = Math.atan2(lastMouseY - pivotY, lastMouseX - pivotX) * (180 / Math.PI);

      let diffAngle = cursorAngle + 86;
      while (diffAngle > 180) diffAngle -= 360;
      while (diffAngle < -180) diffAngle += 360;

      const clampedAngle = Math.max(-20, Math.min(20, diffAngle * 0.42));
      magnifierRef.current.style.transform = `rotate(${clampedAngle}deg)`;

      if (lensGlareRef.current) {
        lensGlareRef.current.style.transform = `translate(${-clampedAngle * 0.35}px, ${-clampedAngle * 0.2}px)`;
      }

      // D. Forepaw Hand Subtle Motion Tracking
      if (pawRef.current) {
        const pawShiftX = Math.max(-2.5, Math.min(2.5, clampedAngle * 0.09));
        const pawShiftY = Math.max(-1.8, Math.min(1.8, Math.abs(clampedAngle) * 0.05));
        pawRef.current.style.transform = `translate(${pawShiftX}px, ${pawShiftY}px)`;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      if (animFrame === null) {
        animFrame = requestAnimationFrame(updateTracking);
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', measureRect);
      window.removeEventListener('scroll', measureRect);
      if (animFrame !== null) cancelAnimationFrame(animFrame);
    };
  }, []);

  const handleCardClick = () => {
    // Subtle tactile magnifying glass inspection animation
    if (magnifierRef.current) {
      magnifierRef.current.style.transform = 'rotate(-15deg) scale(1.15)';
      setTimeout(() => {
        if (magnifierRef.current) magnifierRef.current.style.transform = 'rotate(0deg) scale(1)';
      }, 250);
    }
    if (onFoxClick) {
      onFoxClick();
    }
  };

  return (
    <div className="mascot-companion flex flex-col items-end" id="mascot-widget">
      {/* Interactive Chat Invitation Pill */}
      <button
        onClick={handleCardClick}
        className="mb-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#0c1220]/95 border border-coral/40 shadow-clay hover:scale-105 transition-all text-xs font-mono font-bold text-forest-ink dark:text-white flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
        title="Chat with Rusty AI Legal Assistant"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>🦊 Chat with Rusty AI</span>
      </button>

      {/* 3D Card Shell (Clean without obstructive bottom bubble) */}
      <div className="mascot-card-shell" title="Rusty — AI Legal Inspector (Click to inspect current status)">
        <div 
          className="mascot-card-inner" 
          id="mascot-card" 
          ref={cardRef} 
          onClick={handleCardClick}
        >
          {/* 1. Fox Bust Base Portrait */}
          <img 
            src="/fox_mascot_bust_clean.png" 
            className="fox-base-layer" 
            alt="RegDiff Mascot Fox" 
            draggable={false}
          />

          {/* 2. Left Eye Pupil */}
          <div className={`fox-eye-aperture left ${isBlinking ? 'blinking' : ''}`} id="fox-left-socket">
            <div className="fox-pupil-slit" ref={leftPupilRef} id="fox-left-pupil">
              <svg viewBox="-10 -10 20 20" width="100%" height="100%">
                <ellipse cx="0" cy="0" rx="3.5" ry="8" fill="#080402"/>
                <ellipse cx="0" cy="0" rx="2.2" ry="6.5" fill="#000000"/>
                <circle cx="-1.2" cy="-2.5" r="1.8" fill="#ffffff"/>
                <circle cx="1.0" cy="2.0" r="1.0" fill="rgba(255,255,255,0.75)"/>
              </svg>
            </div>
            <div className="fox-eyelid" id="fox-left-eyelid"></div>
          </div>

          {/* 3. Right Eye Pupil */}
          <div className={`fox-eye-aperture right ${isBlinking ? 'blinking' : ''}`} id="fox-right-socket">
            <div className="fox-pupil-slit" ref={rightPupilRef} id="fox-right-pupil">
              <svg viewBox="-10 -10 20 20" width="100%" height="100%">
                <ellipse cx="0" cy="0" rx="3.5" ry="8" fill="#080402"/>
                <ellipse cx="0" cy="0" rx="2.2" ry="6.5" fill="#000000"/>
                <circle cx="-1.2" cy="-2.5" r="1.8" fill="#ffffff"/>
                <circle cx="1.0" cy="2.0" r="1.0" fill="rgba(255,255,255,0.75)"/>
              </svg>
            </div>
            <div className="fox-eyelid" id="fox-right-eyelid"></div>
          </div>

          {/* 4. Dynamic Cursor-Tracking Magnifying Glass */}
          <div className="fox-magnifier-mount" ref={magnifierRef} id="fox-magnifier">
            <img 
              src="/fox_magnifier.png" 
              className="fox-magnifier-asset" 
              alt="Magnifier" 
              draggable={false}
            />
            <div className="fox-lens-glare-effect" ref={lensGlareRef} id="fox-lens-glare"></div>
            <div className="fox-lens-reticle"></div>
          </div>

          {/* 5. Forepaw Knuckles Layer */}
          <img 
            ref={pawRef}
            src="/fox_paw.png" 
            className="fox-paw-layer" 
            alt="Paw Knuckles" 
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};
