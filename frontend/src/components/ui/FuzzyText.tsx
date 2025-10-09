import React, { useEffect, useRef, useCallback } from 'react';

interface FuzzyTextProps {
  children: React.ReactNode;
  fontSize?: number | string;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
}

const FuzzyText: React.FC<FuzzyTextProps> = ({
  children,
  fontSize = 'clamp(2rem, 8vw, 8rem)',
  fontWeight = 900,
  fontFamily = 'inherit',
  color = '#fff',
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(undefined);
  const isHoveringRef = useRef(false);

  const init = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const computedFontFamily = fontFamily === 'inherit' 
      ? window.getComputedStyle(canvas).fontFamily || 'sans-serif' 
      : fontFamily;

    const fontSizeStr = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;
    let numericFontSize: number;
    
    if (typeof fontSize === 'number') {
      numericFontSize = fontSize;
    } else {
      const temp = document.createElement('span');
      temp.style.fontSize = fontSize;
      temp.style.position = 'absolute';
      temp.style.visibility = 'hidden';
      document.body.appendChild(temp);
      numericFontSize = parseFloat(window.getComputedStyle(temp).fontSize);
      document.body.removeChild(temp);
    }

    const text = React.Children.toArray(children).join('');

    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!offCtx) return;

    offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
    offCtx.textBaseline = 'alphabetic';
    const metrics = offCtx.measureText(text);

    const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
    const actualRight = metrics.actualBoundingBoxRight ?? metrics.width;
    const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
    const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;

    const textBoundingWidth = Math.ceil(actualLeft + actualRight);
    const tightHeight = Math.ceil(actualAscent + actualDescent);
    const extraWidthBuffer = 10;
    const offscreenWidth = textBoundingWidth + extraWidthBuffer;

    offscreen.width = offscreenWidth;
    offscreen.height = tightHeight;

    const xOffset = extraWidthBuffer / 2;
    offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
    offCtx.textBaseline = 'alphabetic';
    offCtx.fillStyle = color;
    offCtx.fillText(text, xOffset - actualLeft, actualAscent);

    const horizontalMargin = 50;
    const verticalMargin = 0;
    canvas.width = offscreenWidth + horizontalMargin * 2;
    canvas.height = tightHeight + verticalMargin * 2;
    ctx.translate(horizontalMargin, verticalMargin);

    const interactiveLeft = horizontalMargin + xOffset;
    const interactiveTop = verticalMargin;
    const interactiveRight = interactiveLeft + textBoundingWidth;
    const interactiveBottom = interactiveTop + tightHeight;

    const fuzzRange = 30;
    const clearRect = [-fuzzRange, -fuzzRange, offscreenWidth + 2 * fuzzRange, tightHeight + 2 * fuzzRange] as const;

    const run = () => {
      ctx.clearRect(...clearRect);
      const intensity = isHoveringRef.current ? hoverIntensity : baseIntensity;
      
      for (let j = 0; j < tightHeight; j++) {
        const dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange);
        ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j, offscreenWidth, 1);
      }
      
      animationFrameRef.current = requestAnimationFrame(run);
    };

    run();

    const isInsideTextArea = (x: number, y: number) =>
      x >= interactiveLeft && x <= interactiveRight && y >= interactiveTop && y <= interactiveBottom;

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableHover) return;
      const rect = canvas.getBoundingClientRect();
      isHoveringRef.current = isInsideTextArea(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleMouseLeave = () => {
      isHoveringRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!enableHover) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      isHoveringRef.current = isInsideTextArea(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    const handleTouchEnd = () => {
      isHoveringRef.current = false;
    };

    if (enableHover) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (enableHover) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [children, fontSize, fontWeight, fontFamily, color, enableHover, baseIntensity, hoverIntensity]);

  useEffect(() => {
    const cleanup = init();
    return () => {
      cleanup?.then(fn => fn?.());
    };
  }, [init]);

  return <canvas ref={canvasRef} />;
};

export default FuzzyText;