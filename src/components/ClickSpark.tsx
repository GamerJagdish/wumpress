'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  extraScale?: number;
  children?: React.ReactNode;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

export default function ClickSpark({
  sparkColor = '#5865f2',
  sparkSize = 10,
  sparkRadius = 20,
  sparkCount = 8,
  duration = 400,
  extraScale = 1.0,
  children,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<Spark[]>([]);

  // Adjust canvas size for viewport and high-DPI displays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Animation frame loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (timestamp: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const sparks = sparksRef.current;
      const activeSparks: Spark[] = [];

      for (let i = 0; i < sparks.length; i++) {
        const spark = sparks[i];
        const elapsed = timestamp - spark.startTime;
        const progress = Math.min(1, elapsed / duration);

        if (progress < 1) {
          activeSparks.push(spark);

          // Easing: ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const distance = sparkRadius * extraScale * eased;
          const currentLength = sparkSize * extraScale * (1 - progress);

          const x1 = spark.x + Math.cos(spark.angle) * distance;
          const y1 = spark.y + Math.sin(spark.angle) * distance;
          const x2 = spark.x + Math.cos(spark.angle) * (distance + currentLength);
          const y2 = spark.y + Math.sin(spark.angle) * (distance + currentLength);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = sparkColor;
          ctx.lineWidth = 2 * extraScale;
          ctx.lineCap = 'round';
          ctx.globalAlpha = 1 - progress;
          ctx.stroke();
          ctx.restore();
        }
      }

      sparksRef.current = activeSparks;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [duration, extraScale, sparkColor, sparkRadius, sparkSize]);

  // Click handler to spawn particle burst
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const x = e.clientX;
      const y = e.clientY;
      const now = performance.now();

      const newSparks: Spark[] = [];
      const slice = (Math.PI * 2) / sparkCount;

      for (let i = 0; i < sparkCount; i++) {
        // Distribute evenly with slight organic angle offset
        const angle = i * slice + (Math.random() - 0.5) * 0.2;
        newSparks.push({
          x,
          y,
          angle,
          startTime: now,
        });
      }

      sparksRef.current.push(...newSparks);
    },
    [sparkCount]
  );

  return (
    <div
      onClick={handleClick}
      className="relative w-full min-h-screen"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50 h-screen w-screen"
      />
      {children}
    </div>
  );
}
