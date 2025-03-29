'use client';

import React, { useEffect, useState } from 'react';

const NUM_PARTICLES = 40;

export const Particles = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Skip rendering until after hydration

  const particles = Array.from({ length: NUM_PARTICLES }).map((_, i) => {
    const size = Math.floor(Math.random() * 8) + 4;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const duration = (Math.random() * 6 + 8).toFixed(1);
    const delay = (Math.random() * 5).toFixed(1);

    return (
      <div
        key={i}
        className="particle"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  return <div className="fixed inset-0 z-0 pointer-events-none">{particles}</div>;
};
