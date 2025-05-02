import React, { useRef, useEffect } from 'react';
import { Group, Title } from '@mantine/core';
import classes from './CanvasBackgroud.module.css';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const NetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosition = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number>();
  
  const initializeParticles = (width: number, height: number, count: number = 666) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 1.5 + 1,
      });
    }
    particles.current = newParticles;
  };

  const updateParticles = (width: number, height: number) => {
    particles.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx = -p.vx;
      if (p.y < 0 || p.y > height) p.vy = -p.vy;
    });
  };

    const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.clearRect(0, 0, width, height);
        
        // Draw particles
        particles.current.forEach((p) => {
        ctx.fillStyle = 'rgba(66, 99, 235, 0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        });
        
        // Draw connections between particles that are close to each other
        ctx.lineWidth = 1;
        
        particles.current.forEach((p1, i) => {
        // Connect to mouse if close enough
        const mouseDistance = Math.sqrt(
            Math.pow(p1.x - mousePosition.current.x, 2) + 
            Math.pow(p1.y - mousePosition.current.y, 2)
        );
        
        if (mouseDistance < 120) {
            const opacity = 1 - (mouseDistance / 120);
            ctx.strokeStyle = `rgba(0, 181, 250, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mousePosition.current.x, mousePosition.current.y);
            ctx.stroke();
        }
        
        // Connect to other particles if close
        particles.current.slice(i + 1).forEach((p2) => {
            const distance = Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
            );
            
            if (distance < 80) {
            const opacity = 0.5 * (1 - (distance / 80));
            ctx.strokeStyle = `rgba(66, 99, 235, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            }
        });
        });
    };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    updateParticles(width, height);
    draw(ctx, width, height);
    
    animationFrameId.current = requestAnimationFrame(animate);
  };

  const handleResize = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const { innerWidth, innerHeight } = window;
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    initializeParticles(innerWidth, innerHeight);
  };

  const handleMouseMove = (e: MouseEvent) => {
    mousePosition.current = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      mousePosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    animationFrameId.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
        <>
            <header 
                className={classes.header}
            >
                <Group justify="space-between" h="100%">
                    <Group className={classes.logo}>
                        <img 
                            src="/hina_icon_only.ico" 
                            alt="HINA icon"
                            width={32}
                            height={32}
                        />
                        <Title 
                            className={classes.title}
                        >
                            HINA: A Learning Analytics Tool for Heterogenous Interaction Network Analysis
                        </Title>
                    </Group>
                </Group>
            </header>
            <canvas
                ref={canvasRef}
                className={classes.backgroundCanvas}
            />
        </>
    );
};


export default NetworkBackground;