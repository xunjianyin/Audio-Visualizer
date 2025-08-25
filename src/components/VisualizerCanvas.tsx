import React, { useRef, useEffect, useCallback, useState } from 'react';
import { AudioData } from '../hooks/useAudioManager';

export type VisualizerMode = 'bars' | 'waveform' | 'circular' | 'particles' | 'spectrogram';

interface VisualizerCanvasProps {
  audioData: AudioData | null;
  mode: VisualizerMode;
  width: number;
  height: number;
  className?: string;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  audioData,
  mode,
  width,
  height,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousMode, setPreviousMode] = useState<VisualizerMode>(mode);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const spectrogramDataRef = useRef<ImageData | null>(null);

  // Bar Spectrum Visualizer
  const drawBarSpectrum = useCallback((
    ctx: CanvasRenderingContext2D,
    frequencyData: Uint8Array,
    canvasWidth: number,
    canvasHeight: number,
    beatDetected: boolean = false,
    bassEnergy: number = 0
  ) => {
    const barCount = Math.min(frequencyData.length / 4, 128); // Limit bars for performance
    const barWidth = canvasWidth / barCount;
    const barSpacing = barWidth * 0.1;
    const actualBarWidth = barWidth - barSpacing;

    // Create gradient - brighter on beat
    const gradient = ctx.createLinearGradient(0, canvasHeight, 0, 0);
    if (beatDetected) {
      gradient.addColorStop(0, '#ef4444'); // Bright red on beat
      gradient.addColorStop(0.5, '#f97316'); // Orange
      gradient.addColorStop(1, '#eab308'); // Yellow
    } else {
      const intensity = bassEnergy * 0.5 + 0.5; // Modulate with bass energy
      gradient.addColorStop(0, `rgba(71, 85, 105, ${intensity})`);
      gradient.addColorStop(0.5, `rgba(100, 116, 139, ${intensity})`);
      gradient.addColorStop(1, `rgba(148, 163, 184, ${intensity})`);
    }

    ctx.fillStyle = gradient;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * frequencyData.length);
      let barHeight = (frequencyData[dataIndex] / 255) * canvasHeight * 0.8;
      
      // Scale bars on beat
      if (beatDetected) {
        barHeight *= 1.2; // 20% taller on beat
      }
      
      const x = i * barWidth + barSpacing / 2;
      const y = canvasHeight - barHeight;

      ctx.fillRect(x, y, actualBarWidth, barHeight);
      
      // Add subtle reflection
      ctx.globalAlpha = 0.2;
      ctx.fillRect(x, canvasHeight, actualBarWidth, -barHeight * 0.2);
      ctx.globalAlpha = 1;
    }
  }, []);

  // Waveform Visualizer
  const drawWaveform = useCallback((
    ctx: CanvasRenderingContext2D,
    timeData: Uint8Array,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const centerY = canvasHeight / 2;
    const amplitude = canvasHeight * 0.4;

    // Create gradient for the line
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
    gradient.addColorStop(0, '#475569');
    gradient.addColorStop(0.5, '#64748b');
    gradient.addColorStop(1, '#94a3b8');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;

    ctx.beginPath();
    
    for (let i = 0; i < timeData.length; i++) {
      const x = (i / timeData.length) * canvasWidth;
      const y = centerY + ((timeData[i] - 128) / 128) * amplitude;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }, []);

  // Circular Spectrum Visualizer
  const drawCircularSpectrum = useCallback((
    ctx: CanvasRenderingContext2D,
    frequencyData: Uint8Array,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.3;
    const barCount = Math.min(frequencyData.length / 2, 180);

    // Create radial gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
    gradient.addColorStop(0, '#475569');
    gradient.addColorStop(0.5, '#64748b');
    gradient.addColorStop(1, '#94a3b8');

    ctx.strokeStyle = gradient;

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const dataIndex = Math.floor((i / barCount) * frequencyData.length);
      const barHeight = (frequencyData[dataIndex] / 255) * radius * 0.8;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, []);

  // Simple Particle System
  const drawParticles = useCallback((
    ctx: CanvasRenderingContext2D,
    frequencyData: Uint8Array,
    canvasWidth: number,
    canvasHeight: number,
    beatDetected: boolean = false,
    bassEnergy: number = 0
  ) => {
    let particleCount = 50;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Calculate average frequency for particle behavior
    const avgFreq = frequencyData.reduce((sum, val) => sum + val, 0) / frequencyData.length;
    const intensity = avgFreq / 255;

    // Beat effects
    if (beatDetected) {
      particleCount = 100; // More particles on beat
      ctx.fillStyle = `rgba(239, 68, 68, ${intensity * 1.5})`; // Bright red
    } else {
      ctx.fillStyle = `rgba(100, 116, 139, ${intensity})`;
    }

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      let distance = intensity * 200;
      let size = 2 + intensity * 6;
      
      // Beat expansion
      if (beatDetected) {
        distance *= 1.5;
        size *= 1.3;
      }
      
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // Spectrogram Visualizer
  const drawSpectrogram = useCallback((
    ctx: CanvasRenderingContext2D,
    frequencyData: Uint8Array,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const frequencyBins = Math.min(frequencyData.length / 2, canvasHeight);
    
    // Shift existing spectrogram data to the left
    if (spectrogramDataRef.current) {
      const imageData = spectrogramDataRef.current;
      const newImageData = ctx.createImageData(canvasWidth, canvasHeight);
      
      // Copy existing data shifted left by 1 pixel
      for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth - 1; x++) {
          const srcIndex = ((y * canvasWidth) + (x + 1)) * 4;
          const destIndex = ((y * canvasWidth) + x) * 4;
          
          newImageData.data[destIndex] = imageData.data[srcIndex];     // R
          newImageData.data[destIndex + 1] = imageData.data[srcIndex + 1]; // G
          newImageData.data[destIndex + 2] = imageData.data[srcIndex + 2]; // B
          newImageData.data[destIndex + 3] = imageData.data[srcIndex + 3]; // A
        }
      }
      
      // Add new frequency column on the right
      for (let y = 0; y < frequencyBins; y++) {
        const frequencyIndex = Math.floor((y / frequencyBins) * frequencyData.length);
        const intensity = frequencyData[frequencyIndex] / 255;
        
        // Convert intensity to color (blue to red gradient)
        const r = Math.floor(intensity * 255);
        const g = Math.floor(intensity * 128);
        const b = Math.floor((1 - intensity) * 255);
        
        const pixelIndex = ((y * canvasWidth) + (canvasWidth - 1)) * 4;
        newImageData.data[pixelIndex] = r;
        newImageData.data[pixelIndex + 1] = g;
        newImageData.data[pixelIndex + 2] = b;
        newImageData.data[pixelIndex + 3] = 255;
      }
      
      spectrogramDataRef.current = newImageData;
      ctx.putImageData(newImageData, 0, 0);
    } else {
      // Initialize spectrogram
      const imageData = ctx.createImageData(canvasWidth, canvasHeight);
      
      // Fill with black
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i + 3] = 255; // Alpha
      }
      
      spectrogramDataRef.current = imageData;
    }
  }, []);

  // Render a specific mode with optional opacity
  const renderMode = useCallback((
    ctx: CanvasRenderingContext2D,
    renderMode: VisualizerMode,
    audioData: AudioData,
    opacity: number = 1
  ) => {
    if (opacity < 1) {
      ctx.globalAlpha = opacity;
    }

    switch (renderMode) {
      case 'bars':
        drawBarSpectrum(ctx, audioData.frequencyData, ctx.canvas.width, ctx.canvas.height, audioData.beatDetected, audioData.bassEnergy);
        break;
      case 'waveform':
        drawWaveform(ctx, audioData.timeData, ctx.canvas.width, ctx.canvas.height);
        break;
      case 'circular':
        drawCircularSpectrum(ctx, audioData.frequencyData, ctx.canvas.width, ctx.canvas.height);
        break;
      case 'particles':
        drawParticles(ctx, audioData.frequencyData, ctx.canvas.width, ctx.canvas.height, audioData.beatDetected, audioData.bassEnergy);
        break;
      case 'spectrogram':
        drawSpectrogram(ctx, audioData.frequencyData, ctx.canvas.width, ctx.canvas.height);
        break;
    }

    if (opacity < 1) {
      ctx.globalAlpha = 1;
    }
  }, [drawBarSpectrum, drawWaveform, drawCircularSpectrum, drawParticles, drawSpectrogram]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isTransitioning && transitionProgress < 1) {
      // During transition, render both modes with different opacities
      const fadeOutOpacity = 1 - transitionProgress;
      const fadeInOpacity = transitionProgress;

      // Render previous mode fading out
      if (fadeOutOpacity > 0) {
        renderMode(ctx, previousMode, audioData, fadeOutOpacity);
      }

      // Render current mode fading in
      if (fadeInOpacity > 0) {
        renderMode(ctx, mode, audioData, fadeInOpacity);
      }

      // Update transition progress
      setTransitionProgress(prev => {
        const newProgress = prev + 0.05; // Adjust speed here
        if (newProgress >= 1) {
          setIsTransitioning(false);
          return 1;
        }
        return newProgress;
      });
    } else {
      // Normal rendering
      renderMode(ctx, mode, audioData, 1);
    }

    animationFrameRef.current = requestAnimationFrame(render);
  }, [audioData, mode, previousMode, isTransitioning, transitionProgress, renderMode]);

  // Handle mode changes with transitions
  useEffect(() => {
    if (mode !== previousMode) {
      setIsTransitioning(true);
      setTransitionProgress(0);
      setPreviousMode(mode);
    }
  }, [mode, previousMode]);

  // Start/stop animation based on audio data
  useEffect(() => {
    if (audioData) {
      render();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioData, render]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas on resize
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    }
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`${className} rounded-lg`}
      style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        border: '1px solid rgba(148, 163, 184, 0.2)'
      }}
    />
  );
};
