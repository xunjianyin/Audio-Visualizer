# Audio Visualizer

A beautiful, real-time audio visualizer built with React and the Web Audio API. Experience your music like never before with multiple visualization modes and stunning visual effects.

![Audio Visualizer Demo](https://via.placeholder.com/800x400/6366f1/ffffff?text=Audio+Visualizer+Demo)

## Features

### 🎵 Audio Sources
- **File Upload**: Load your favorite audio files (MP3, WAV, etc.)
- **Microphone Input**: Real-time visualization of microphone audio
- **Playback Controls**: Play, pause, stop, and seek through tracks

### 🎨 Visualization Modes
- **Bar Spectrum**: Classic frequency bars with gradient colors and glow effects
- **Waveform**: Smooth waveform display showing audio amplitude over time
- **Circular Spectrum**: Radial frequency display for a unique perspective
- **Particles**: Dynamic particle system that reacts to audio intensity

### ✨ Visual Effects
- Gradient colors and glow effects
- Smooth animations and transitions
- Responsive design that works on all screen sizes
- Glass morphism UI with modern styling

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Audio**: Web Audio API (AudioContext, AnalyserNode)
- **Visualization**: HTML5 Canvas 2D
- **Styling**: TailwindCSS with custom gradients and animations
- **Build Tool**: Create React App

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd audio-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Usage

1. **Load Audio**: Click "Load Audio File" to select an audio file from your device, or click "Use Microphone" to visualize real-time microphone input.

2. **Choose Visualization**: Select from four different visualization modes:
   - Bar Spectrum for classic frequency bars
   - Waveform for amplitude visualization
   - Circular for radial frequency display
   - Particles for dynamic particle effects

3. **Control Playback**: Use the play/pause/stop controls to manage audio playback. The progress bar shows current position in the track.

## Architecture

```
App
 ├── useAudioManager (Custom hook for Web Audio API)
 │    ├── AudioContext management
 │    ├── AnalyserNode configuration
 │    ├── File loading and microphone access
 │    └── Real-time audio data extraction
 ├── VisualizerCanvas
 │    ├── BarSpectrum renderer
 │    ├── Waveform renderer
 │    ├── CircularSpectrum renderer
 │    └── ParticleSystem renderer
 └── ControlsPanel (UI controls and mode selection)
```

## Browser Compatibility

- Chrome 66+ (recommended)
- Firefox 60+
- Safari 14.1+
- Edge 79+

Note: Microphone access requires HTTPS in production environments.

## Performance

The visualizer is optimized for smooth 60fps performance:
- Efficient Canvas 2D rendering
- Optimized frequency data processing
- Responsive animation frame management
- Memory-efficient audio buffer handling

## Future Enhancements

- [ ] WebGL/Three.js integration for advanced 3D effects
- [ ] Screenshot and video recording capabilities
- [ ] Interactive mouse/touch effects
- [ ] Custom color themes and presets
- [ ] Audio effects and filters
- [ ] Playlist support
- [ ] Full-screen mode

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Web Audio API documentation and examples
- React and TypeScript communities
- TailwindCSS for beautiful styling utilities
- Canvas 2D rendering techniques and optimizations
