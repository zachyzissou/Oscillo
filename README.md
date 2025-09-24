# 🌟 Oscillo - World-Class Interactive 3D Music Platform

🎵 **Next-generation audio-reactive, generative music playground with cutting-edge WebGPU shaders, AI-powered composition, and immersive 3D visualization — all in real time.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](README.md)
[![E2E Tests](https://img.shields.io/badge/e2e%20tests-15%2F15%20passing-brightgreen)](README.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](README.md)
[![WebGPU](https://img.shields.io/badge/WebGPU-enabled-purple)](README.md)
[![AI Music](https://img.shields.io/badge/Magenta.js-integrated-orange)](README.md)

## Project Links

- Live tracking board (GitLab): http://192.168.4.225:9080/codex/oscillo/-/boards
- Tracking board handbook: `docs/tracking-board.md`

## 🚀 Major Platform Transformation (January 2025)

### ⚡ **Tech Stack Modernization**

- 🔥 **React 19** + **Next.js 15** - Latest React features with App Router
- 🎨 **Three.js ^0.178** - Advanced 3D rendering and WebGPU support
- 🎬 **GSAP ^3.12** - Professional animation engine (replaced Framer Motion)
- ❌ **Framer Motion removed** - Animations now handled via CSS and GSAP
- 🧠 **Magenta.js** - Google's AI music generation library
- 🎧 **Enhanced Web Audio API** - Real-time audio analysis and effects
- 💎 **Zustand** - Lightweight, performant state management

### 🎨 **Visual & Audio Revolution**

- ✨ **WebGPU Shaders** - Metaball, Voronoi, Water, Glitch effects with WGSL
- 🌊 **Audio-Reactive Backgrounds** - Real-time FFT analysis driving visuals
- 🎵 **AI Music Generation** - Magenta.js powered composition and melodies
- 🎛️ **Advanced Audio Pipeline** - Multi-band analysis, spectral features
- 🌈 **Neon/Glassmorphism UI** - Modern design with backdrop filters
- 🎮 **60fps Performance** - Optimized rendering with adaptive quality

### 🛠️ **Enterprise-Grade Features**

- 🔒 **Production Ready** - Docker deployment with health checks
- 🧪 **Comprehensive Testing** - Playwright E2E and visual regression tests
- ♿ **WCAG 2.1 Accessibility** - Screen reader support, keyboard navigation
- 📊 **Performance Analytics** - Real-time FPS, memory, and audio metrics
- 🔄 **Auto-Recovery** - WebGL context restoration with exponential backoff
- 📱 **Cross-Platform** - Desktop, mobile, and PWA support

---

## 🎯 Core Features

### 🎮 **Interactive 3D Playground**

- **Full-screen WebGL/WebGPU Canvas** — Immersive viewport that fills your entire browser
- **Procedural Shape Spawning** — Click the 3D "+" to create physics-enabled musical objects
- **Intelligent UI System** — Dynamic bottom drawer that expands with contextual controls
- **Real-time Audio Synthesis** — Per-shape Note, Chord, Beat, and Loop modes
- **Advanced Effect Chain** — Bitcrusher, reverb, delay, chorus, distortion with live parameter control

### 🧠 **AI-Powered Music Generation**

- **Magenta.js Integration** — Google's machine learning models for melody generation
- **Intelligent Composition** — AI-assisted chord progressions and harmonic structures  
- **Adaptive Rhythm Generation** — Context-aware beat patterns and polyrhythms
- **Real-time Improvisation** — AI responds to user input with musical variations

### 🎨 **Next-Gen Visual Effects**

- **WebGPU Shader Pipeline** — Advanced WGSL shaders with fallback to WebGL
- **Audio-Reactive Backgrounds** — Real-time FFT analysis drives visual effects
- **Professional Shader Library**:
  - **Metaball Effects** — Organic, fluid blob animations
  - **Voronoi Patterns** — Crystalline, procedural geometries  
  - **Water Simulation** — Realistic ripple and wave effects
  - **Glitch Distortion** — Digital corruption and datamoshing
- **Neon Glassmorphism UI** — Modern design with backdrop filters and smooth animations

### 🎧 **Advanced Audio Engine**

- **Real-time Spectral Analysis** — Multi-band FFT with frequency domain processing
- **Audio Feature Extraction** — RMS, spectral centroid, zero-crossing rate analysis
- **Professional Effects Pipeline** — Studio-quality audio processing chain
- **Adaptive Performance** — Dynamic quality scaling based on device capabilities
- **Cross-platform Audio** — Optimized for desktop and mobile browsers

### 🚀 **Production-Ready Platform**

- **Enterprise Deployment** — Docker containerization with health monitoring and GHCR publishing
- **Comprehensive Testing** — Unit, E2E, accessibility, and performance test suites
- **Accessibility First** — WCAG 2.1 compliance with screen reader support  
- **Performance Monitoring** — Real-time FPS, memory, and audio metrics (toggle with `?perf=1`)
- **Plugin System** — Extensible architecture for custom instruments, effects, and visuals
- **Progressive Web App** — Installable with offline capabilities and service worker

---

## 🏗️ Getting Started

### **Prerequisites**

- Node.js **20.17.0** LTS (npm 10.8+)
- npm **10.x** or yarn **4.x**
- Modern browser with WebGL 2.0 support
- For WebGPU features: Chrome 113+, Firefox 121+, or Safari 18+

### **Installation**

1. **Clone & install dependencies**

   ```bash
   git clone https://github.com/zachyzissou/INTERACTIVE-MUSIC-3D.git
   cd INTERACTIVE-MUSIC-3D
   npm ci --legacy-peer-deps
   ```

2. **Security audit & fixes**

   ```bash
   npm audit fix
   # Review and apply security patches
   ```

3. **Download AI model (optional)**

   ```bash
   curl -L "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn.tar" -o basic_rnn.tar
   mkdir -p public/models/basic_rnn && tar -xf basic_rnn.tar -C public/models/basic_rnn
   ```

### **Development**

1. **Local development server**

   ```bash
   npm run dev
   # → http://localhost:3000
   # Hot reload enabled with TypeScript checking
   ```

2. **Production build & test**

   ```bash
   npm run build
   npm run start
   # → http://localhost:3000 (production mode)
   ```

3. **Testing & validation**

   ```bash
   npm run lint          # ESLint + Prettier
   npm run test:unit     # Vitest unit tests
   npm run test:e2e      # Playwright E2E tests
   ```

### **PWA Installation**

- Desktop: Look for "Install" button in address bar
- Mobile: Use "Add to Home Screen" from browser menu
- Offline mode: Basic caching via service worker
  Service worker files (`public/sw.js`, `public/workbox-*.js`) are generated
  during `next build` and are ignored in version control.

### **Environment Configuration**

Environment defaults live in **`.env.example`**. Copy it to `.env.local` (or the deployment secret store) and adjust as needed.

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_ENABLE_PWA` | `false` | Toggle service worker registration; keep disabled until PWA is vetted |
| `NEXT_PUBLIC_WEB_VITALS_ENDPOINT` | _(blank)_ | Optional client override for Web Vitals ingestion route |
| `ANALYTICS_FORWARD_URL` | _(blank)_ | Optional server-to-server forwarding target for Web Vitals metrics |
| `ANALYTICS_FORWARD_TOKEN` | _(blank)_ | Bearer token paired with `ANALYTICS_FORWARD_URL` when required |
| `LOG_DIR` | `./logs` | Directory where server-side log files are written |
| `LOG_FILE` | `app.log` | Log filename when `LOG_TO_FILE=true` |
| `LOG_LEVEL` | `info` | Structured logging level (`info`, `debug`, `error`, etc.) |
| `LOG_TO_FILE` | `true` | Persist logs to disk; set `false` when shipping logs via stdout collectors |
| `LOG_PRETTY` | `false` | Pretty-print logs locally; leave `false` in production for JSON ingestion |
| `GITLAB_URL` / `GITLAB_PROJECT_ID` | `http://192.168.4.225:9080` / `2` | Used by automation scripts to interact with the self-hosted GitLab |
| `GITLAB_TOKEN` | _(blank)_ | Personal access token (`read_api`/`write_api`) for GitLab automation scripts |

See `docs/SECURITY.md`, `docs/logging-strategy.md`, and `docs/DEPLOYMENT.md` for per-environment guidance and hardening steps.
For a complete list of tooling expectations, refer to `docs/environment-assumptions.md`.

### **Operational Checklists**

- `docs/security-checklist.md` — release security runbook and WS auth verification
- `docs/DEPLOYMENT.md` — build/publish/rollback workflow
- `docs/metrics/README.md` — template for capturing performance/bundle deltas per phase
- `docs/design-system.md` — canonical design tokens and theming guidelines
- `unraid/oscillo.xml` — Unraid Docker template referencing `ghcr.io/zachgonser/oscillo:latest`
- Docker: See `docker-compose.yml` for container deployment

---

## 🎮 User Interface & Controls

### **3D Scene Interaction**

- **Spawn Button** — 3D "+" mesh in bottom-left corner for creating new musical objects
- **Shape Selection** — Left-click any shape to select and trigger its audio
- **3D Manipulation** — Drag shapes around the scene with physics-based movement
- **Camera Controls** — Mouse/touch to orbit, zoom, and pan the 3D view

### **Bottom Drawer UI**

- **Collapsed State** — Shows only the spawn control when no shape is selected
- **Expanded State** — Slides up when a shape is selected, revealing:
  - **Mode Tabs**: Note | Chord | Beat | Loop
  - **Playback Controls**: Play/Pause, volume, tempo
  - **Effect Controls**: Simple vs. Advanced effect chain
  - **Performance Presets**: Eco | Balanced | Pro quality modes
  - **AI Generation**: Magenta.js composition controls

### **Audio Controls Panel**

- **Master Volume** — Global audio output level
- **Audio Analyzer** — Real-time frequency spectrum visualization
- **Effect Chain** — Reverb, delay, chorus, distortion, bitcrusher controls
- **Recording** — Capture and export your musical creations
- **Bass Sensitivity** — Adjust shader response to low frequencies

---

## 🏛️ Architecture & Tech Stack

### **Frontend Architecture**

```
app/
├── layout.tsx          # Global layout + error boundaries
├── page.tsx           # Main application with 3D canvas
└── ClientLayout.tsx   # Client-side hydration wrapper

src/
├── components/
│   ├── CanvasScene.tsx           # Main 3D scene with shaders
│   ├── AudioReactiveShaderBackground.tsx # Audio-driven visuals
│   ├── SceneLights.tsx          # Three.js lighting setup
│   ├── BottomDrawer.tsx         # Main UI drawer component
│   ├── ui/ModernStartOverlay.tsx # Hydration-safe initialization
│   └── ui/
│       ├── AudioControls.tsx    # Audio parameter controls
│       ├── AudioAnalyzer.tsx    # Real-time audio visualization
│       ├── MagentaMusicGenerator.tsx # AI music generation
│       └── Modern*.tsx          # Glassmorphism UI components
├── plugins/
│   ├── pluginManager.ts         # Runtime plugin registry & events
│   └── PluginLoader.tsx         # Loads plugins after audio gate
├── lib/
│   ├── webgpu-renderer.ts       # WebGPU/WebGL abstraction
│   ├── audio.ts                 # Tone.js audio engine
│   └── utils.ts                 # Utility functions
├── shaders/
│   ├── metaball.frag           # Organic blob effects
│   ├── voronoi.frag            # Crystalline patterns
│   ├── water.frag              # Realistic water simulation
│   ├── glitch.frag             # Digital distortion
│   └── displacement.vert       # Vertex displacement
├── store/
│   ├── useAudioStore.ts        # Real-time audio analysis
│   ├── useAudioSettings.ts     # Audio parameters
│   ├── useEffectSettings.ts    # Effect chain state
│   └── useObjects.ts           # 3D object management
└── types/
    └── audio.ts                # TypeScript audio interfaces
```

### **Core Technologies**

- **React 19** — Latest React features with concurrent rendering
- **Next.js 15** — App Router, server components, and optimizations
- **Three.js ^0.178** — 3D rendering with WebGPU support
- **GSAP ^3.12** — Professional animation and timeline management
- **Tone.js** — Web Audio API synthesis and effects
- **Magenta.js** — Machine learning music generation
- **Zustand** — Lightweight state management
- **Tailwind CSS** — Utility-first styling with custom components

### **Audio Pipeline**

```
Input → AudioContext → AnalyserNode → FFT Analysis → Feature Extraction
                    ↓
Tone.js Synths → Effect Chain → Master Output → Visual Reactivity
                    ↓
Effects: Reverb → Delay → Chorus → Distortion → Bitcrusher
```

### **Rendering Pipeline**

```
WebGPU Detection → Shader Compilation → Audio Data Binding → Render Loop
        ↓               ↓                    ↓              ↓
    Fallback to    WGSL/GLSL          Uniform Updates   60fps Target
      WebGL         Shaders            Audio Features    Adaptive Quality
```

---

## 🔧 Deployment & DevOps

### **Container Deployment**

#### **GitHub Container Registry (GHCR)**

Pull the latest image:
```bash
docker pull ghcr.io/zachyzissou/interactive-music-3d:latest
```

Run with Docker:
```bash
docker run -d \
  --name oscillo \
  -p 31415:3000 \
  -v ./logs:/app/logs \
  -v ./uploads:/app/uploads \
  -e NODE_ENV=production \
  ghcr.io/zachyzissou/interactive-music-3d:latest
```

Access at: `http://localhost:31415`

#### **Unraid Installation**

**Method 1: User Template (Recommended)**
1. Copy `unraid/oscillo.xml` to `/boot/config/plugins/dockerMan/templates-user/`
2. Docker ▸ Add Container ▸ Template: select "Oscillo"
3. Set Host Port (default 31415), map volumes if desired, then Apply

**Method 2: Manual Setup**
- Use the Docker command above with Unraid's Docker interface
- See [docs/unraid.md](docs/unraid.md) for detailed installation guide

### **Docker Deployment**

**Multi-stage optimized Dockerfile:**

```dockerfile
# Dependencies stage
FROM node:20.17.0-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage  
FROM node:20.17.0-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# Production stage
FROM node:20.17.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**Example docker-compose.yml:**

```yaml
services:
  oscillo:
    build: .
    ports:
      - "${HOST_PORT:-31415}:3000"  # Change HOST_PORT to expose a different host port
    environment:
      - NODE_ENV=production
      - LOG_DIR=/app/logs
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

Set the `HOST_PORT` environment variable when running `docker compose up` to
expose a different host port (for example `HOST_PORT=31415`). The application
inside the container still listens on port 3000.

### **GitHub Actions CI/CD**

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.17.0'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: self-hosted
    steps:
      - name: Deploy to production
        run: docker-compose up -d --build
```

### **Performance Monitoring**

- **Bundle Analysis** — Webpack bundle analyzer integration
- **Core Web Vitals** — Real-time performance metrics
- **Audio Latency** — Round-trip latency measurement
- **Memory Usage** — Heap and GPU memory tracking
- **Error Tracking** — Sentry integration for production monitoring

---

## 🧪 Advanced Testing Strategy

### **Optimized CI/CD Pipeline**

**Quick Checks (All Branches - Under 10 Minutes)**
```bash
# Fast feedback for all PRs and main branch
npm run type-check    # TypeScript validation
npm run lint          # ESLint + code style
npm run build         # Production build test
npm run test:smoke    # Essential functionality only
```

**Full Test Suite (Staging Branch Only)**
```bash
# Comprehensive testing on staging deployments
npm run test:e2e      # Complete E2E test suite
npm run test:visual   # Visual regression testing
npm run test:performance  # Performance benchmarks
```

### **Testing Architecture**

### **Testing Architecture**

**1. Unit Tests (Vitest - Fast)**
```bash
npm run test:unit     # Run all unit tests
npm run test:watch    # Watch mode for development
npm run test:ui       # Interactive test UI
```

**2. Accessibility Tests (Automated)**
```bash
npm run test:a11y     # WCAG 2.1 compliance testing
```

**3. Performance Tests (Comprehensive)**
```bash
npm run test:performance  # FPS, memory, bundle size validation
```

**4. Smoke Tests (Fast - 2-3 minutes)**
- ✅ Application startup and basic functionality
- ✅ Critical user paths (start overlay → main experience)
- ✅ No critical console errors
- ✅ Basic performance validation

**2. Full E2E Tests (Staging Only - 15-20 minutes)**
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npx playwright test enhanced-features
npx playwright test complete-journey
npx playwright test accessibility

# Debug mode with browser UI
npx playwright test --debug
```

**3. Visual Regression Tests (Staging Only)**
```bash
# Comprehensive visual testing
npm run test:visual

# Generate new baselines
npx playwright test --update-snapshots
```

**Test Coverage:**
- ✅ Application startup and initialization
- ✅ 3D shape spawning and selection
- ✅ Audio playback and effects
- ✅ UI interactions and responsiveness
- ✅ AI music generation
- ✅ WebGL/WebGPU rendering
- ✅ Accessibility compliance (WCAG 2.1)
- ✅ Performance benchmarks (60fps target)
- ✅ Visual regression testing (glassmorphism, neon effects)
- ✅ Cross-browser compatibility (Chrome, Firefox, Safari)
- ✅ Mobile and tablet responsiveness

### **Test Artifacts & Reports**

**Automatic Artifact Collection:**
- 📸 **Screenshots** - On test failure for debugging
- 🎥 **Video Recordings** - Full test execution videos
- 📊 **Performance Reports** - FPS, memory, load times
- 🎨 **Visual Diff Reports** - Before/after comparison
- 📋 **Test Results** - JUnit XML and JSON formats

**Access Test Results:**
```bash
# View latest test report
npx playwright show-report

# View visual regression differences
open playwright-report/visual-diffs/

# Check performance metrics
cat test-results/performance-report.json
```

### **Performance Testing**

```bash
# Lighthouse CI integration
npm run test:lighthouse

# Bundle size analysis
npm run build:analyze

# Memory leak detection
npm run test:memory
```

**Performance Targets:**
- ⚡ **Build Time**: <10 minutes (main branch)
- 🚀 **Page Load**: <3 seconds (initial load)
- 🎮 **Frame Rate**: >60 FPS (desktop), >30 FPS (mobile)
- 📦 **Bundle Size**: <2.5MB (total), <500KB (initial load)
- 🧠 **Memory Usage**: <100MB (idle), <200MB (active)

---

## ♿ Accessibility & Compliance

### **WCAG 2.1 AA Compliance**

- **Keyboard Navigation** — Full app functionality via keyboard
- **Screen Reader Support** — ARIA labels and semantic HTML
- **Color Contrast** — 4.5:1 ratio for all text elements
- **Focus Management** — Visible focus indicators and logical tab order
- **Audio Descriptions** — Visual music feedback for hearing impaired users

### **Accessibility Features**

- **Reduced Motion** — Respects user's motion preferences
- **High Contrast Mode** — Alternative color schemes
- **Text Scaling** — Supports browser zoom up to 200%
- **Audio Control** — Independent volume controls for each element
- **Visual Indicators** — Non-audio feedback for all interactions

### **Testing Tools**

```bash
# Accessibility audit
npm run test:a11y

# Screen reader testing
npm run test:screenreader

# Keyboard navigation testing
npm run test:keyboard
```

---

## 📊 Performance Optimization

### **Adaptive Quality System**

- **GPU Performance Detection** — Automatic quality tier selection
- **Dynamic LOD** — Level-of-detail scaling based on performance
- **Effect Degradation** — Graceful quality reduction under load
- **Memory Management** — Automatic garbage collection and cleanup

### **Optimization Strategies**

- **Code Splitting** — Lazy loading of non-critical components
- **Asset Optimization** — Compressed textures and audio files
- **Shader Compilation Caching** — Faster startup times
- **Audio Buffer Pooling** — Reduced memory allocation
- **WebWorker Audio Processing** — Offloaded FFT analysis

### **Performance Metrics**

- **Target: 60fps** — Maintained across all supported devices
- **Audio Latency: <50ms** — Professional-grade audio responsiveness
- **Bundle Size: <3MB** — Fast initial load times
- **Memory Usage: <200MB** — Efficient resource utilization

---

## 🚩 Troubleshooting

### **Common Issues**

**Audio Not Working**
- Ensure browser allows autoplay (user interaction required)
- Check browser console for Web Audio API errors
- Verify audio output device is connected

**WebGL/WebGPU Errors**
- Update graphics drivers to latest version
- Try different browser (Chrome/Firefox/Safari)
- Disable browser extensions that may interfere

**Performance Issues**
- Lower quality settings in performance panel
- Close other browser tabs/applications
- Ensure adequate GPU memory (1GB+ recommended)

**Accessibility Problems**
- Enable high contrast mode in browser settings
- Use keyboard shortcuts (Tab, Enter, Space)
- Test with screen reader (NVDA, JAWS, VoiceOver)

### **Development Debugging**

```bash
# Enable debug logging
DEBUG=oscillo:* npm run dev

# GPU debugging
DEBUG=three:* npm run dev

# Audio debugging  
DEBUG=tone:* npm run dev

# Bundle analysis
npm run analyze

# Performance profiling
npm run profile
```

### **Production Health Checks**

```bash
# Health check endpoint
curl http://localhost:3000/api/health

# WebGL capabilities
curl http://localhost:3000/api/webgl-info

# Audio system status
curl http://localhost:3000/api/audio-status

# Performance metrics
curl http://localhost:3000/api/metrics
```

---

## 🗺️ Roadmap

### **Phase 1: Foundation** ✅ *Complete*
- Modern tech stack migration
- WebGPU shader pipeline
- AI music integration
- Accessibility compliance
- Production deployment

### **Phase 2: Advanced Features** 🚧 *In Progress*
- **Multi-user Collaboration** — Real-time WebRTC jam sessions
- **Advanced AI** — Style transfer and music arrangement
- **VR/AR Support** — WebXR immersive experiences
- **Mobile Optimization** — Touch-first interaction design
- **Plugin System** — Third-party effect and instrument support

### **Phase 3: Platform Evolution** 📅 *Planned*
- **Cloud Sync** — Cross-device project synchronization
- **Social Features** — Share and remix community creations
- **Educational Mode** — Music theory tutorials and lessons
- **Professional Tools** — VST export and DAW integration
- **Marketplace** — User-generated content and assets

### **Phase 4: Enterprise** 🔮 *Future*
- **White-label Solutions** — Customizable platform licensing
- **Analytics Dashboard** — Usage insights and performance metrics
- **API Platform** — Third-party integrations and extensions
- **Blockchain Integration** — NFT creation and ownership
- **AI Composition Suite** — Advanced machine learning tools

---

## 🤝 Contributing

For complete contribution guidelines, read `CONTRIBUTING.md` and the repository conventions in `AGENTS.md`.

We welcome contributions from the community! Here's how to get involved:

### **Development Setup**

1. **Fork and clone the repository**
2. **Install dependencies**: `npm ci --legacy-peer-deps`
3. **Start development server**: `npm run dev`
4. **Run tests**: `npm run test`
5. **Submit a pull request**

### **Contribution Guidelines**

- **Code Style** — Follow ESLint and Prettier configurations; see `AGENTS.md` for naming and structure
- **Testing** — Add tests for new features and bug fixes
- **Documentation** — Update README and code comments
- **Accessibility** — Ensure WCAG 2.1 compliance
- **Audio init** — Keep gating through `ModernStartOverlay` using `startAudio()` (`src/components/ui/ModernStartOverlay.tsx`)
- **Performance** — Profile changes and optimize for 60fps

### **Issue Reporting**

- **Bug Reports** — Use GitHub issue templates
- **Feature Requests** — Describe use case and expected behavior
- **Security Issues** — Email security@oscillo.app for private disclosure

### **Community**

- **Discord** — Join our developer community
- **Blog** — Read development updates and tutorials
- **YouTube** — Watch tutorials and demonstrations
- **Twitter** — Follow @OscilloApp for updates

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Three.js Team** — Amazing 3D graphics library
- **Tone.js Community** — Excellent Web Audio API wrapper
- **Google Magenta** — AI music generation research
- **React Team** — Revolutionary UI framework
- **Next.js Team** — Full-stack React framework
- **GSAP Team** — Professional animation platform
- **Open Source Community** — Countless contributors and maintainers

---

**Experience the future of interactive music creation at [oscillo.app](https://oscillo.app)**

*Built with ❤️ by the Oscillo team*

## 🔗 Sister Projects

### Documentation Hub
- **[Global Documentation](http://192.168.4.225:9080/zachgonser/global-docs)** - Central knowledge base and documentation hub

### Related Projects
- **[Terminal Grounds](http://192.168.4.225:9080/claude/terminal-grounds)** - Territorial warfare extraction shooter with Unreal Engine 5
- **[omnireader](http://192.168.4.225:9080/claude/omnireader)** - Intelligent content aggregation and processing platform
- **[The Stanton Times](http://192.168.4.225:9080/claude/the-stanton-times)** - AI-powered Star Citizen news automation
- **[Obsidian+GPT Project](http://192.168.4.225:9080/claude/obsidian-gpt-project)** - ChatGPT conversation knowledge management
- **[slurpnet-plex-automation](http://192.168.4.225:9080/claude/slurpnet-plex-automation)** - Automated Plex media management

### GitHub Mirrors
- **[oscillo (Interactive Music 3D)](https://github.com/zachyzissou/interactive-music-3d)** - Main repository mirror
- **[omnireader](https://github.com/zachyzissou/omnireader)** - Content processing mirror
- **[Terminal Grounds (Bloom)](https://github.com/zachyzissou/Bloom)** - Game development mirror

### Resources
- **[GitLab Instance](http://192.168.4.225:9080)** - Primary development platform
- **[Documentation Hub](http://192.168.4.225:9080/zachgonser/global-docs/-/wikis/Documentation-Hub)** - Central documentation portal
- **[Project Wiki](http://192.168.4.225:9080/codex/oscillo/-/wikis/home)** - Oscillo-specific documentation
