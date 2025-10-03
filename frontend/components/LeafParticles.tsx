"use client";

import { useEffect, useState } from "react";

type Particle = {
  left: string;
  delay: string;
  duration: string;
};

export function LeafParticles({ count = 15 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const arr: Particle[] = Array.from({ length: count }).map(() => ({
      left: `${Math.random() * 100}%`,
      delay: `${(Math.random() * 8).toFixed(3)}s`,
      duration: `${(8 + Math.random() * 4).toFixed(3)}s`,
    }));
    setParticles(arr);
  }, [count]);

  if (particles.length === 0) return null; // SSR 渲染为空，避免水合不一致

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" suppressHydrationWarning>
      {particles.map((p, i) => (
        <div
          key={i}
          className="leaf-particle absolute text-green-600 text-4xl opacity-20"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        >
          🍃
        </div>
      ))}
    </div>
  );
}


