"use client";

import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, resolvedTheme } = useTheme();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Determine if dark mode is active
    const isDarkMode = theme === 'dark' || resolvedTheme === 'dark';
    
    // Particle class
    class Particle {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      speedX: number = 0;
      speedY: number = 0;
      color: string = '';

      constructor() {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.7 - 0.35;
        this.speedY = Math.random() * 0.7 - 0.35;
        
        // Different colors based on theme with increased opacity
        if (isDarkMode) {
          this.color = `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.1})`;
        } else {
          this.color = `rgba(60, 60, 60, ${Math.random() * 0.4 + 0.1})`;
        }
      }

      update() {
        if (!canvas) return;
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;

        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create particles - increase the number of particles
    const particles: Particle[] = [];
    for (let i = 0; i < 150; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections - different colors based on theme with increased opacity
      ctx.strokeStyle = isDarkMode 
        ? 'rgba(255, 255, 255, 0.2)'
        : 'rgba(60, 60, 60, 0.2)';
      ctx.lineWidth = 0.7;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [theme, resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-10 pointer-events-none"
    />
  );
} 