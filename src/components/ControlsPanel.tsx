import React, { useRef } from 'react';
import { VisualizerMode } from './VisualizerCanvas';

interface ControlsPanelProps {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  mode: VisualizerMode;
  duration: number;
  currentTime: number;
  volume: number;
  onFileLoad: (file: File) => void;
  onMicrophoneStart: () => void;
  onTogglePlayback: () => void;
  onStop: () => void;
  onModeChange: (mode: VisualizerMode) => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  isPlaying,
  isLoading,
  error,
  mode,
  duration,
  currentTime,
  volume,
  onFileLoad,
  onMicrophoneStart,
  onTogglePlayback,
  onStop,
  onModeChange,
  onVolumeChange,
  onSeek,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileLoad(file);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  const modes: { value: VisualizerMode; label: string }[] = [
    { value: 'bars', label: 'Bar Spectrum' },
    { value: 'waveform', label: 'Waveform' },
    { value: 'circular', label: 'Circular' },
    { value: 'particles', label: 'Particles' },
    { value: 'spectrogram', label: 'Spectrogram' },
  ];

  return (
    <div className="glass-panel p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent">
        Audio Visualizer
      </h2>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* File Input */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-300">Audio Source</h3>
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed
                     text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200
                     flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              'Load Audio File'
            )}
          </button>
          
          <button
            onClick={onMicrophoneStart}
            disabled={isLoading}
            className="flex-1 bg-secondary hover:bg-secondary/80 disabled:bg-gray-600 disabled:cursor-not-allowed
                     text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200
                     flex items-center justify-center gap-2"
          >
            Use Microphone
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Playback Controls */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-300">Playback</h3>
        
        {/* Progress Bar */}
        {duration > 0 && (
          <div className="space-y-2">
            <div 
              className="w-full bg-gray-700 rounded-full h-2 cursor-pointer hover:h-3 transition-all duration-200"
              onClick={handleProgressClick}
            >
              <div
                className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-100"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 w-12">Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full 
                       [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
            />
            <span className="text-sm text-slate-400 w-10 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onTogglePlayback}
            disabled={isLoading || (!duration && !isPlaying)}
            className="flex-1 bg-accent hover:bg-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed
                     text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200
                     flex items-center justify-center gap-2"
          >
{isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={onStop}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed
                     text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200
                     flex items-center justify-center gap-2"
          >
Stop
          </button>
        </div>
      </div>

      {/* Visualizer Mode Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-300">Visualizer Mode</h3>
        <div className="grid grid-cols-2 gap-2">
          {modes.map((modeOption) => (
            <button
              key={modeOption.value}
              onClick={() => onModeChange(modeOption.value)}
              className={`p-3 rounded-lg font-medium transition-all duration-200 text-sm
                         flex items-center justify-center
                         ${mode === modeOption.value
                           ? 'bg-primary text-white'
                           : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                         }`}
            >
              {modeOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
        <div className={`w-2 h-2 rounded-full ${
          isPlaying ? 'bg-green-500 animate-pulse' : 
          isLoading ? 'bg-yellow-500 animate-pulse' : 
          'bg-gray-500'
        }`} />
        <span>
          {isLoading ? 'Loading...' : 
           isPlaying ? 'Playing' : 
           'Ready'}
        </span>
      </div>
    </div>
  );
};
