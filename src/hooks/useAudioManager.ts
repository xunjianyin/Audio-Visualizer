import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  dataArray: Uint8Array;
  beatDetected: boolean;
  bassEnergy: number;
}

export interface AudioManagerState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  audioData: AudioData | null;
  duration: number;
  currentTime: number;
  volume: number;
}

export const useAudioManager = () => {
  const [state, setState] = useState<AudioManagerState>({
    isPlaying: false,
    isLoading: false,
    error: null,
    audioData: null,
    duration: 0,
    currentTime: 0,
    volume: 1,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const beatHistoryRef = useRef<number[]>([]);
  const lastBeatTimeRef = useRef<number>(0);

  // Initialize Audio Context
  const initializeAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.8;
      }

      if (!gainNodeRef.current) {
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = state.volume;
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }

      analyserRef.current.connect(gainNodeRef.current);

      return true;
    } catch (error) {
      setState(prev => ({ ...prev, error: `Failed to initialize audio context: ${error}` }));
      return false;
    }
  }, []);

  // Beat detection function
  const detectBeat = useCallback((frequencyData: Uint8Array): { beatDetected: boolean; bassEnergy: number } => {
    // Calculate bass energy (low frequencies)
    const bassRange = Math.floor(frequencyData.length * 0.1); // First 10% of frequencies
    let bassSum = 0;
    for (let i = 0; i < bassRange; i++) {
      bassSum += frequencyData[i];
    }
    const bassEnergy = bassSum / bassRange;

    // Keep history of bass energy
    beatHistoryRef.current.push(bassEnergy);
    if (beatHistoryRef.current.length > 20) { // Keep last 20 samples
      beatHistoryRef.current.shift();
    }

    // Calculate average bass energy
    const avgBassEnergy = beatHistoryRef.current.reduce((sum, val) => sum + val, 0) / beatHistoryRef.current.length;
    
    // Beat detection: current bass energy is significantly higher than average
    const beatThreshold = avgBassEnergy * 1.5; // 50% above average
    const currentTime = Date.now();
    const timeSinceLastBeat = currentTime - lastBeatTimeRef.current;
    
    const beatDetected = bassEnergy > beatThreshold && 
                        timeSinceLastBeat > 200 && // Minimum 200ms between beats
                        beatHistoryRef.current.length >= 10; // Need some history

    if (beatDetected) {
      lastBeatTimeRef.current = currentTime;
    }

    return { beatDetected, bassEnergy: bassEnergy / 255 };
  }, []);

  // Update audio data for visualization
  const updateAudioData = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    analyserRef.current.getByteFrequencyData(frequencyData);
    analyserRef.current.getByteTimeDomainData(timeData);

    // Detect beats
    const { beatDetected, bassEnergy } = detectBeat(frequencyData);

    setState(prev => ({
      ...prev,
      audioData: {
        frequencyData,
        timeData,
        dataArray: frequencyData, // For backward compatibility
        beatDetected,
        bassEnergy,
      }
    }));

    if (state.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateAudioData);
    }
  }, [state.isPlaying, detectBeat]);

  // Load audio file
  const loadAudioFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const initialized = await initializeAudioContext();
      if (!initialized) return;

      // Stop current audio
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }

      // Create audio element for file playback
      const audioElement = new Audio();
      audioElement.src = URL.createObjectURL(file);
      audioElementRef.current = audioElement;

      audioElement.addEventListener('loadedmetadata', () => {
        setState(prev => ({ ...prev, duration: audioElement.duration }));
      });

      audioElement.addEventListener('timeupdate', () => {
        setState(prev => ({ ...prev, currentTime: audioElement.currentTime }));
      });

      audioElement.addEventListener('ended', () => {
        setState(prev => ({ ...prev, isPlaying: false }));
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      });

      await new Promise((resolve, reject) => {
        audioElement.addEventListener('canplaythrough', resolve);
        audioElement.addEventListener('error', reject);
        audioElement.load();
      });

      // Connect to analyser
      const source = audioContextRef.current!.createMediaElementSource(audioElement);
      source.connect(analyserRef.current!);
      sourceRef.current = source;

      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Failed to load audio file: ${error}` 
      }));
    }
  }, [initializeAudioContext]);

  // Start microphone input
  const startMicrophone = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const initialized = await initializeAudioContext();
      if (!initialized) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Stop current audio
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }

      const source = audioContextRef.current!.createMediaStreamSource(stream);
      source.connect(analyserRef.current!);
      sourceRef.current = source;

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isPlaying: true 
      }));

      // Start animation loop
      updateAudioData();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Failed to access microphone: ${error}` 
      }));
    }
  }, [initializeAudioContext, updateAudioData]);

  // Play/pause audio
  const togglePlayback = useCallback(() => {
    if (!audioElementRef.current) return;

    if (state.isPlaying) {
      audioElementRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      audioElementRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true }));
      updateAudioData();
    }
  }, [state.isPlaying, updateAudioData]);

  // Stop all audio
  const stopAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentTime: 0 
    }));
  }, []);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState(prev => ({ ...prev, volume: clampedVolume }));
    
    if (audioElementRef.current) {
      audioElementRef.current.volume = clampedVolume;
    }
    
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clampedVolume;
    }
  }, []);

  // Seek to specific time
  const seekTo = useCallback((time: number) => {
    if (!audioElementRef.current) return;
    
    const clampedTime = Math.max(0, Math.min(state.duration, time));
    audioElementRef.current.currentTime = clampedTime;
    setState(prev => ({ ...prev, currentTime: clampedTime }));
  }, [state.duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAudio]);

  return {
    ...state,
    loadAudioFile,
    startMicrophone,
    togglePlayback,
    stopAudio,
    setVolume,
    seekTo,
  };
};
