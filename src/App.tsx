import React, { useState, useEffect } from 'react';
import { useAudioManager } from './hooks/useAudioManager';
import { VisualizerCanvas, VisualizerMode } from './components/VisualizerCanvas';
import { ControlsPanel } from './components/ControlsPanel';

function App() {
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });

  const {
    isPlaying,
    isLoading,
    error,
    audioData,
    duration,
    currentTime,
    volume,
    loadAudioFile,
    startMicrophone,
    togglePlayback,
    stopAudio,
    setVolume,
    seekTo,
  } = useAudioManager();

  // Handle window resize for responsive canvas
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('visualizer-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        setCanvasSize({
          width: Math.max(400, rect.width - 32), // Account for padding
          height: Math.max(300, Math.min(500, rect.height - 32))
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (duration > 0) {
            seekTo(Math.max(0, currentTime - 10)); // Seek back 10 seconds
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (duration > 0) {
            seekTo(Math.min(duration, currentTime + 10)); // Seek forward 10 seconds
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1)); // Volume up
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1)); // Volume down
          break;
        case 'Digit1':
          e.preventDefault();
          setVisualizerMode('bars');
          break;
        case 'Digit2':
          e.preventDefault();
          setVisualizerMode('waveform');
          break;
        case 'Digit3':
          e.preventDefault();
          setVisualizerMode('circular');
          break;
        case 'Digit4':
          e.preventDefault();
          setVisualizerMode('particles');
          break;
        case 'Digit5':
          e.preventDefault();
          setVisualizerMode('spectrogram');
          break;
        case 'KeyM':
          e.preventDefault();
          setVolume(volume > 0 ? 0 : 1); // Mute/unmute
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayback, seekTo, setVolume, setVisualizerMode, duration, currentTime, volume]);

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-slate-400 via-slate-300 to-slate-500 bg-clip-text text-transparent mb-4">
            Audio Visualizer
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Experience your music like never before with real-time audio visualization. 
            Load your favorite tracks or use your microphone to see sound come alive.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Visualizer */}
          <div className="lg:col-span-3">
            <div 
              id="visualizer-container"
              className="glass-panel p-4 h-[500px] flex items-center justify-center"
            >
              {audioData ? (
                <VisualizerCanvas
                  audioData={audioData}
                  mode={visualizerMode}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  className="w-full h-full max-w-full max-h-full"
                />
              ) : (
                <div className="text-center text-slate-500 space-y-4">
                  <h3 className="text-xl font-semibold">No Audio Source</h3>
                  <p className="text-sm max-w-md">
                    Load an audio file or start your microphone to begin visualizing audio.
                    The visualization will appear here once audio is detected.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-1">
            <ControlsPanel
              isPlaying={isPlaying}
              isLoading={isLoading}
              error={error}
              mode={visualizerMode}
              duration={duration}
              currentTime={currentTime}
              volume={volume}
              onFileLoad={loadAudioFile}
              onMicrophoneStart={startMicrophone}
              onTogglePlayback={togglePlayback}
              onStop={stopAudio}
              onModeChange={setVisualizerMode}
              onVolumeChange={setVolume}
              onSeek={seekTo}
            />
          </div>
        </div>

       

        {/* Footer */}
        <footer className="text-center mt-12 text-slate-500 text-sm">
          <p>Built with React, Web Audio API, and Canvas 2D</p>
          <p className="mt-1">
            Supports audio files (MP3, WAV, etc.) and real-time microphone input
          </p>
          <div className="mt-4 text-xs opacity-75">
            <p><strong>Keyboard Shortcuts:</strong></p>
            <p>Space: Play/Pause • ←/→: Seek • ↑/↓: Volume • 1-5: Visualizer Modes • M: Mute</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
