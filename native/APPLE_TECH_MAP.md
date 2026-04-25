# Oscillo Native Apple Tech Map

Research date: 2026-04-25

Local toolchain checked:

- Xcode: `26.4.1`
- macOS SDK: `26.4`
- iPhoneOS SDK: `26.4`
- Swift: `6.2.3`

## Direction

Oscillo should become a native Swift app, not a WebView wrapper. The first build should keep the current web app intact and add a native lane under `native/` with shared `OscilloCore` logic, a macOS SwiftUI shell, and a Metal renderer. iOS should reuse the same core/audio/rendering contracts after the macOS slice is stable.

All items below are Apple-provided platform frameworks or tools available with Xcode. A few capabilities still need OS/device support, user permissions, or entitlements before they can ship, such as microphone capture, SharePlay, Apple Intelligence availability, and iOS haptics.

## Apple Frameworks To Use

| Area | Apple tech | Use in Oscillo | Adoption |
| --- | --- | --- | --- |
| App shell | SwiftUI, Swift concurrency, Observation | Cross-platform UI, state, settings, timeline-driven UI effects | Now |
| Primary renderer | MetalKit, `MTKView`, Metal Shading Language | Audio-reactive tunnel, particles, morphing geometry, shader passes | Now |
| New renderer backend | Metal 4 core API | More efficient command submission, command allocators, argument tables, newer barriers | Gate behind OS/GPU availability |
| Shader compilation | Metal 4 compiler API, binary archives | Precompile shader variants and avoid runtime shader hitches | After shader library split |
| Performance scaling | MetalFX spatial/temporal scaling, frame interpolation where available | Render lower-res heavy scenes, upscale to display, preserve visual richness on iPhone | After render targets exist |
| GPU compute/ML | Metal Performance Shaders, MPSGraph, Core ML | Beat/structure analysis, generative controls, effect classifiers, model-backed visual selection | After audio feature pipeline is stable |
| Audio input/synthesis | AVFAudio, AVAudioEngine, AVAudioSourceNode, AVAudioPlayerNode | Replace Tone.js/Web Audio; synth notes, capture microphone, route effect graph | Now |
| Audio analysis | Accelerate/vDSP FFT and filters | RMS, spectral centroid, band energy, spectrogram textures | Now; replace initial Goertzel estimate with vDSP FFT |
| Sound intelligence | Sound Analysis, Create ML, Core ML | Optional classifier for voice/music/noise/beat-event semantics | Later, on-device |
| Spatial audio | AVAudioEnvironmentNode, PHASE, RealityKit spatial audio | 3D note sources and listener-aware mix | Later macOS/iOS; deeper for visionOS |
| Haptics | Core Haptics | iPhone/iPad beat pulses, note taps, controller haptics | iOS phase |
| Collaboration | Group Activities / SharePlay | Native shared jam sessions without a custom WebSocket-first UX | Later; entitlement-gated |
| Assets | Model I/O, MetalKit texture/model loaders | Import procedural/GLTF/USDZ-inspired assets and generate mesh data | Later |
| AI assistance | Foundation Models framework | On-device prompt-to-palette / prompt-to-scene presets where Apple Intelligence is available | Progressive enhancement |
| Persistence | SwiftData / AppStorage / FileDocument | Local presets, exported scenes, user settings | After first native scene |
| Automation | App Intents, Shortcuts | Start scene, export clip, switch palette, trigger jam actions | Later |

## Renderer Plan

Start with a normal MetalKit renderer because it is stable across current macOS/iOS targets and works in Swift Package form. Keep renderer responsibilities behind a narrow protocol so a Metal 4 backend can replace the command-submission layer without changing audio, state, or UI.

Immediate renderer layers:

- Full-screen shader pass for the tunnel/background.
- GPU particle buffers for note systems.
- Uniform buffer sourced from `OscilloCore.AudioFeatures`.
- Quality profile that can lower particle count and render scale.

Metal 4 should be introduced when the app has multiple passes or enough shader variants to justify the newer API surface. The docs explicitly describe Metal 4 as incrementally adoptable alongside existing Metal queues, so the project should avoid a hard rewrite when we add it.

## Audio Plan

Use `AVAudioEngine` as the native audio graph and `Accelerate/vDSP` for feature extraction. The current native slice uses a vDSP FFT analyzer that outputs:

- RMS / volume
- Bass, mid, treble energy
- Peak frequency
- Spectral centroid
- Zero-crossing rate
- Optional spectrogram texture for Metal

For iOS, add `AVAudioSession` configuration and `NSMicrophoneUsageDescription`. For macOS app bundles, add the corresponding microphone usage string before relying on real input.

## ML And Generative Features

Keep ML optional and on-device-first:

- Core ML for custom exported models and low-latency local inference.
- Sound Analysis for built-in or custom sound classifiers over live audio streams.
- Create ML for training small sound classifiers locally on Mac.
- Foundation Models for prompt-driven palette/scene generation where Apple Intelligence is available.
- MPSGraph or Metal 4 ML for GPU-timeline compute when the visual pipeline needs model-like operations near the renderer.

## Source Links

- Metal 4 overview: https://developer.apple.com/documentation/Metal/understanding-the-metal-4-core-api
- Metal 4 triangle sample: https://developer.apple.com/documentation/metal/drawing-a-triangle-with-metal-4
- MetalFX: https://developer.apple.com/documentation/metalfx/
- Metal feature set tables: https://developer.apple.com/metal/capabilities/
- vDSP: https://developer.apple.com/documentation/accelerate/vdsp
- AVAudioEngine: https://developer.apple.com/documentation/avfaudio/avaudioengine
- Sound Analysis stream classification: https://developer.apple.com/documentation/soundanalysis/classifying-sounds-in-an-audio-stream
- Core ML overview: https://developer.apple.com/machine-learning/core-ml/
- Foundation Models: https://developer.apple.com/documentation/FoundationModels
- AVAudioEnvironmentNode: https://developer.apple.com/documentation/avfaudio/avaudioenvironmentnode
- Core Haptics: https://developer.apple.com/documentation/corehaptics/
- Model I/O: https://developer.apple.com/documentation/modelio
- SharePlay activities: https://developer.apple.com/documentation/groupactivities/defining-your-apps-shareplay-activities
- Metal shader validation: https://developer.apple.com/documentation/xcode/validating-your-apps-metal-shader-usage/
