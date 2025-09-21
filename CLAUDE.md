# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on port 3000 with hot reload
- `npm run build` - Production build 
- `npm run start` - Start production server
- `npm run lint` - ESLint code checking
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run type-check` - TypeScript type checking without emit

### Testing Commands  
- `npm run test:smoke` - Fast essential functionality tests (2-3 minutes)
- `npm run test:e2e` - Full E2E test suite with Playwright (15-20 minutes)
- `npm run test:visual` - Visual regression tests with screenshot comparison
- `npm run test:performance` - Performance benchmarks and metrics
- `npm run test:headed` - Run tests with browser UI visible for debugging

### Debugging Commands
- `npx playwright test --debug` - Debug E2E tests with browser tools
- `npx playwright show-report` - View latest test report
- `npm run build:analyze` - Bundle size analysis with webpack-bundle-analyzer

## Architecture Overview

### Core Tech Stack
- **Next.js 15** with App Router - Server and client components
- **React 19** - Latest React features with concurrent rendering  
- **Three.js ^0.178** - 3D rendering with WebGPU support
- **Zustand** - Lightweight state management (primitives only)
- **Tone.js** - Web Audio API synthesis and effects
- **Magenta.js** - AI music generation
- **GSAP ^3.12** - Animation engine (replaces Framer Motion)
- **Tailwind CSS** - Utility-first styling

### Project Structure
```
app/                     # Next.js App Router
├── layout.tsx          # Global layout with error boundaries
├── page.tsx            # Main 3D canvas application
└── ClientLayout.tsx    # Client-side hydration wrapper

src/
├── components/         # React components
│   ├── CanvasScene.tsx           # Main 3D scene with WebGL/WebGPU
│   ├── AudioReactiveShaderBackground.tsx # Audio-driven visual effects
│   ├── BottomDrawer.tsx          # Main UI drawer
│   ├── ui/ModernStartOverlay.tsx # Hydration-safe initialization
│   └── ui/                       # Modern UI components
├── lib/                # Core utilities
│   ├── audio.ts                  # Tone.js audio engine
│   ├── webgpu-renderer.ts        # WebGPU/WebGL abstraction
│   ├── performance.ts            # Performance monitoring
│   └── audio/                    # Audio utilities
├── plugins/             # Runtime plugin system
│   ├── pluginManager.ts         # Plugin registry & events
│   └── PluginLoader.tsx         # Initializes plugins after audio gate
├── store/              # Zustand state stores (primitives only)
├── shaders/            # GLSL/WGSL shader files
└── types/              # TypeScript definitions
```

### State Management with Zustand

**CRITICAL**: Zustand stores must only contain primitives (strings, numbers, booleans) and plain arrays/objects. Never store:
- Three.js objects (meshes, materials, geometries)
- Tone.js instances (synths, effects, transport)
- DOM nodes or React refs
- Functions (except store actions)

Use IDs to reference complex objects managed elsewhere. See `docs/store-guidelines.md` for details.

### Audio Architecture
The audio system uses Tone.js for synthesis with a multi-stage pipeline:
```
AudioContext → AnalyserNode → FFT Analysis → Visual Reactivity
           ↓
Tone.js Synths → Effect Chain → Master Output
```

Effects chain: Reverb → Delay → Chorus → Distortion → Bitcrusher

### 3D Rendering Pipeline
- WebGPU detection with WebGL fallback
- WGSL shaders (metaball, voronoi, water, glitch effects)
- Audio-reactive uniforms updated at 60fps
- Adaptive quality based on device performance

### Performance Considerations
- Target 60fps on desktop, 30fps on mobile
- Dynamic LOD (Level of Detail) scaling
- Memory management with automatic cleanup
- Bundle size target: <3MB total, <500KB initial load

## Key Development Patterns

### Component Architecture
- Use `'use client'` directive for interactive components
- Wrap 3D components in `<Suspense>` for loading states
- Error boundaries for WebGL context loss recovery
- Hydration-safe initialization via `ModernStartOverlay`

### Audio Development
- Always check audio context state before operations
- Use `startAudio()` from `src/lib/audio/startAudio.ts` for initialization
- Implement exponential backoff for WebGL context restoration
- Monitor performance with `usePerformance` store

### Shader Development
- Shaders located in `src/shaders/` with TypeScript exports
- Use `webgpu-renderer.ts` for cross-platform compatibility
- Audio uniforms updated via `useAudioStore`
- Fallback shaders for lower-end devices

### Testing Strategy
- Smoke tests for CI (essential functionality only)
- Full E2E suite for staging deployments
- Visual regression testing with Playwright
- Performance benchmarks for frame rate validation

## Common Issues & Solutions

### Audio Problems
- User interaction required before audio can start
- Check Web Audio API compatibility in browser
- Safari requires special handling via `webkitAudioFix.ts`

### WebGL/WebGPU Issues  
- Context loss recovery implemented with exponential backoff
- Automatic fallback from WebGPU to WebGL
- GPU performance detection for quality scaling

### Build Issues
- Use `--legacy-peer-deps` for npm install due to Three.js peer dependencies
- TypeScript paths configured for `@/*` imports to `src/*`
- Bundle analysis available via `npm run build:analyze`

### Mobile Performance
- Touch interactions optimized via `mobileOptimizations.ts`
- Reduced shader complexity on mobile devices
- Adaptive frame rate targeting

## Deployment Notes

- Production builds use Next.js standalone output
- Docker configuration in `Dockerfile` and `docker-compose.yml`
- Health checks available at `/api/health` endpoints
- PWA manifest for installable app experience
- Service worker for offline functionality
