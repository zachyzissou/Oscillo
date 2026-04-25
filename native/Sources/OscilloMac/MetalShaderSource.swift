enum MetalShaderSource {
    static let fullScreenTunnel = """
    #include <metal_stdlib>
    using namespace metal;

    struct VertexOut {
        float4 position [[position]];
        float2 uv;
    };

    struct ShaderUniforms {
        float time;
        float audioLevel;
        float bassEnergy;
        float midEnergy;
        float trebleEnergy;
        float visualGain;
        float particleDensity;
        int paletteIndex;
        int sceneModeIndex;
        float padding;
        float2 resolution;
    };

    vertex VertexOut oscilloVertex(uint vertexID [[vertex_id]]) {
        float2 positions[3] = {
            float2(-1.0, -1.0),
            float2( 3.0, -1.0),
            float2(-1.0,  3.0)
        };

        VertexOut out;
        out.position = float4(positions[vertexID], 0.0, 1.0);
        out.uv = positions[vertexID] * 0.5 + 0.5;
        return out;
    }

    static float hash21(float2 p) {
        return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453123);
    }

    static float3 paletteColor(int paletteIndex, int slot, float3 audio) {
        if (paletteIndex == 1) {
            float3 colors[3] = {
                float3(0.02, 0.90, 0.76),
                float3(0.42, 0.22, 1.00),
                float3(0.88, 0.96, 1.00)
            };
            return colors[slot] + audio * 0.16;
        }

        if (paletteIndex == 2) {
            float3 colors[3] = {
                float3(1.00, 0.35, 0.08),
                float3(1.00, 0.78, 0.18),
                float3(0.52, 0.05, 0.02)
            };
            return colors[slot] + audio * 0.12;
        }

        if (paletteIndex == 3) {
            float value = slot == 0 ? 0.24 : (slot == 1 ? 0.74 : 1.0);
            return float3(value, value, value) + audio * 0.08;
        }

        float3 colors[3] = {
            float3(0.02, 0.32, 1.00),
            float3(1.00, 0.04, 0.46),
            float3(0.36, 1.00, 0.58)
        };
        return colors[slot] + audio * 0.14;
    }

    static float noteOrb(float2 p, int index, float time, float audio, float density) {
        float count = 12.0;
        float t = float(index) / count;
        float radius = 0.30 + sin(t * 12.56637) * 0.08;
        float height = (t - 0.5) * 0.86;
        float angle = t * 18.84955 + time * (0.18 + audio * 0.4);
        float2 center = float2(cos(angle) * radius, height + sin(time * 0.8 + t * 6.0) * 0.04);
        float d = length(p - center);
        float size = (0.018 + 0.012 * density) * (1.0 + audio * 1.8);
        return smoothstep(size, 0.0, d);
    }

    static float terrainLine(float2 p, float y, float width) {
        return smoothstep(width, 0.0, abs(p.y - y));
    }

    static float3 terrainStage(float2 p,
                               float2 uv,
                               float time,
                               float audio,
                               float density,
                               float3 low,
                               float3 mid,
                               float3 high,
                               float bass,
                               float mids,
                               float treble) {
        float grid = 0.0;
        float2 gp = abs(fract((p + float2(0.0, time * 0.035)) * float2(7.0, 5.0)) - 0.5);
        grid += smoothstep(0.018, 0.0, gp.x) * 0.16;
        grid += smoothstep(0.014, 0.0, gp.y) * 0.12;

        float terrain = 0.0;
        for (int i = 0; i < 9; i++) {
            float fi = float(i);
            float depth = fi / 8.0;
            float wave = sin(p.x * (2.2 + depth * 4.8) + time * (0.75 + depth) + bass * 5.0);
            wave += sin(p.x * (6.0 + depth * 7.0) - time * 0.6 + mids * 4.0) * 0.28;
            float y = mix(-0.72, 0.44, depth) + wave * (0.035 + audio * 0.08) - depth * depth * 0.18;
            terrain += terrainLine(p, y, 0.012 + depth * 0.01) * (1.0 - depth * 0.42);
        }

        float trace = smoothstep(0.018 + audio * 0.018, 0.0, abs(p.y - sin(p.x * 8.0 + time * 2.0) * (0.16 + bass * 0.12)));
        float transient = smoothstep(0.025, 0.0, abs(p.x - sin(time * 0.9) * 0.68)) * treble;
        float3 color = low * grid + mid * terrain * (0.75 + audio * 0.8);
        color += high * trace * (0.42 + audio * 0.38);
        color += float3(1.0, 0.18, 0.28) * transient * 0.46;
        color += float3(0.01, 0.012, 0.018) + high * pow(1.0 - abs(uv.y - 0.5), 3.0) * 0.08;
        return color;
    }

    static float3 tunnelStage(float2 p,
                              float2 uv,
                              float time,
                              float audio,
                              float density,
                              float3 low,
                              float3 mid,
                              float3 high,
                              float bass,
                              float mids,
                              float treble) {
        float radius = length(p);
        float angle = atan2(p.y, p.x);
        float speed = 0.85 + audio * 2.0 + treble;
        float tunnel = sin(log(radius + 0.08) * 18.0 - time * speed + angle * 7.0);
        float spokes = sin(angle * (10.0 + mids * 12.0) + time);
        float ring = smoothstep(0.13, 0.0, abs(tunnel + spokes * 0.18));
        float glow = exp(-radius * (1.6 - bass * 0.55));

        float colorMix = 0.5 + 0.5 * sin(angle + time * 0.22 + bass * 2.4);
        float3 color = mix(low, mid, colorMix);
        color = mix(color, high, mids * 0.35);
        color *= 0.08 + ring * (0.75 + audio * 0.8) + glow * 0.34;

        float orbMask = 0.0;
        for (int i = 0; i < 12; i++) {
            orbMask += noteOrb(p, i, time, audio, density);
        }
        color = mix(color, high * (1.1 + audio), clamp(orbMask, 0.0, 1.0));
        return color;
    }

    static float3 constellationStage(float2 p,
                                     float2 uv,
                                     float time,
                                     float audio,
                                     float density,
                                     float3 low,
                                     float3 mid,
                                     float3 high,
                                     float bass,
                                     float mids,
                                     float treble) {
        float3 color = float3(0.006, 0.008, 0.014);
        float nodeMask = 0.0;
        float lineMask = 0.0;
        float count = 16.0;

        for (int i = 0; i < 16; i++) {
            float fi = float(i);
            float t = fi / count;
            float angle = t * 18.84955 + time * (0.08 + bass * 0.18);
            float radius = 0.18 + fract(sin(fi * 91.7) * 437.2) * 0.78;
            float2 center = float2(cos(angle) * radius, sin(angle * 0.74 + mids) * radius * 0.72);
            float d = length(p - center);
            nodeMask += smoothstep(0.028 + density * 0.008 + audio * 0.03, 0.0, d);
            lineMask += smoothstep(0.012, 0.0, abs(length(p - center * 0.52) - radius * 0.45)) * 0.08;
        }

        float star = step(0.988, hash21(floor(uv * 180.0))) * (0.45 + treble);
        color += low * lineMask;
        color += high * clamp(nodeMask, 0.0, 1.0) * (0.75 + audio);
        color += mid * star * 0.35;
        color += float3(1.0, 0.2, 0.34) * pow(clamp(nodeMask, 0.0, 1.0), 2.0) * treble * 0.45;
        return color;
    }

    static float3 liquidStage(float2 p,
                              float2 uv,
                              float time,
                              float audio,
                              float density,
                              float3 low,
                              float3 mid,
                              float3 high,
                              float bass,
                              float mids,
                              float treble) {
        float2 q = p;
        q.x += sin(p.y * 4.0 + time * 0.7) * (0.12 + bass * 0.18);
        q.y += cos(p.x * 3.0 - time * 0.55) * (0.08 + mids * 0.12);
        float field = sin(q.x * 5.0 + time) + sin(q.y * 7.0 - time * 1.2);
        field += sin((q.x + q.y) * 9.0 + treble * 5.0) * 0.35;
        float contour = smoothstep(0.08 + audio * 0.06, 0.0, abs(field));
        float caustic = smoothstep(0.035, 0.0, abs(fract(field * 2.0 + time * 0.1) - 0.5)) * 0.22;
        float3 color = mix(low * 0.12, mid * 0.72, contour);
        color += high * caustic * (0.6 + density * 0.25);
        color += float3(1.0, 0.22, 0.34) * treble * smoothstep(0.52, 0.86, uv.x) * 0.18;
        return color;
    }

    static float3 spectrogramStage(float2 p,
                                   float2 uv,
                                   float time,
                                   float audio,
                                   float density,
                                   float3 low,
                                   float3 mid,
                                   float3 high,
                                   float bass,
                                   float mids,
                                   float treble) {
        float bands = 38.0;
        float band = floor(uv.x * bands);
        float lane = fract(uv.x * bands);
        float profile = sin(band * 0.41 + time * 1.3) * 0.28 + sin(band * 0.13 - time * 0.7) * 0.18;
        float bandEnergy = clamp(audio * 0.38 + bass * (1.0 - uv.x) + mids * (1.0 - abs(uv.x - 0.5)) + treble * uv.x + profile, 0.04, 1.0);
        float bar = smoothstep(bandEnergy, bandEnergy - 0.045, uv.y);
        float separator = smoothstep(0.04, 0.0, abs(lane - 0.5)) * 0.12;
        float scan = smoothstep(0.012, 0.0, abs(fract(uv.y * 16.0 - time * 0.45) - 0.5)) * 0.18;
        float3 gradient = mix(low, high, uv.x);
        gradient = mix(gradient, mid, 1.0 - abs(uv.x - 0.5));
        return gradient * bar * (0.55 + audio * 0.8) + gradient * separator + high * scan * density;
    }

    fragment half4 oscilloFragment(VertexOut in [[stage_in]],
                                   constant ShaderUniforms &uniforms [[buffer(0)]]) {
        float2 uv = in.uv;
        float aspect = uniforms.resolution.x / max(uniforms.resolution.y, 1.0);
        float2 p = (uv * 2.0 - 1.0) * float2(aspect, 1.0);

        float audio = clamp(uniforms.audioLevel * uniforms.visualGain, 0.0, 1.0);
        float density = clamp(uniforms.particleDensity, 0.15, 1.5);

        float3 audioVector = float3(uniforms.bassEnergy, uniforms.midEnergy, uniforms.trebleEnergy);
        float3 low = paletteColor(uniforms.paletteIndex, 0, audioVector);
        float3 mid = paletteColor(uniforms.paletteIndex, 1, audioVector);
        float3 high = paletteColor(uniforms.paletteIndex, 2, audioVector);

        float3 color;
        if (uniforms.sceneModeIndex == 1) {
            color = tunnelStage(p, uv, uniforms.time, audio, density, low, mid, high, uniforms.bassEnergy, uniforms.midEnergy, uniforms.trebleEnergy);
        } else if (uniforms.sceneModeIndex == 2) {
            color = constellationStage(p, uv, uniforms.time, audio, density, low, mid, high, uniforms.bassEnergy, uniforms.midEnergy, uniforms.trebleEnergy);
        } else if (uniforms.sceneModeIndex == 3) {
            color = liquidStage(p, uv, uniforms.time, audio, density, low, mid, high, uniforms.bassEnergy, uniforms.midEnergy, uniforms.trebleEnergy);
        } else if (uniforms.sceneModeIndex == 4) {
            color = spectrogramStage(p, uv, uniforms.time, audio, density, low, mid, high, uniforms.bassEnergy, uniforms.midEnergy, uniforms.trebleEnergy);
        } else {
            color = terrainStage(p, uv, uniforms.time, audio, density, low, mid, high, uniforms.bassEnergy, uniforms.midEnergy, uniforms.trebleEnergy);
        }

        float2 starCell = floor(uv * uniforms.resolution / 3.0);
        float starSeed = hash21(starCell);
        float star = step(0.997, starSeed) * (0.24 + 0.52 * sin(uniforms.time * 2.0 + starSeed * 6.28318));
        color += star * high * 0.42;
        color = pow(max(color, float3(0.0)), float3(0.92));

        return half4(half3(color), 1.0);
    }
    """
}
