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

    fragment half4 oscilloFragment(VertexOut in [[stage_in]],
                                   constant ShaderUniforms &uniforms [[buffer(0)]]) {
        float2 uv = in.uv;
        float aspect = uniforms.resolution.x / max(uniforms.resolution.y, 1.0);
        float2 p = (uv * 2.0 - 1.0) * float2(aspect, 1.0);
        float radius = length(p);
        float angle = atan2(p.y, p.x);

        float audio = clamp(uniforms.audioLevel * uniforms.visualGain, 0.0, 1.0);
        float density = clamp(uniforms.particleDensity, 0.15, 1.5);
        float speed = 0.85 + audio * 2.0 + uniforms.trebleEnergy;
        float tunnel = sin(log(radius + 0.08) * 18.0 - uniforms.time * speed + angle * 7.0);
        float spokes = sin(angle * (10.0 + uniforms.midEnergy * 12.0) + uniforms.time);
        float ring = smoothstep(0.13, 0.0, abs(tunnel + spokes * 0.18));
        float glow = exp(-radius * (1.6 - uniforms.bassEnergy * 0.55));

        float2 starCell = floor(uv * uniforms.resolution / 3.0);
        float starSeed = hash21(starCell);
        float star = step(0.996, starSeed) * (0.35 + 0.65 * sin(uniforms.time * 2.0 + starSeed * 6.28318));

        float3 audioVector = float3(uniforms.bassEnergy, uniforms.midEnergy, uniforms.trebleEnergy);
        float3 blue = paletteColor(uniforms.paletteIndex, 0, audioVector);
        float3 pink = paletteColor(uniforms.paletteIndex, 1, audioVector);
        float3 green = paletteColor(uniforms.paletteIndex, 2, audioVector);
        float colorMix = 0.5 + 0.5 * sin(angle + uniforms.time * 0.22 + uniforms.bassEnergy * 2.4);

        float3 color = mix(blue, pink, colorMix);
        color = mix(color, green, uniforms.midEnergy * 0.35);
        color *= 0.08 + ring * (0.75 + audio * 0.8) + glow * 0.34;
        color += star * float3(0.42, 0.7, 1.0);
        color += pow(max(0.0, 1.0 - radius), 3.0) * uniforms.bassEnergy * float3(0.5, 0.05, 0.18);

        float orbMask = 0.0;
        for (int i = 0; i < 12; i++) {
            orbMask += noteOrb(p, i, uniforms.time, audio, density);
        }
        orbMask = clamp(orbMask, 0.0, 1.0);
        color = mix(color, green * (1.1 + audio), orbMask);

        float morphA = smoothstep(0.035 + audio * 0.04, 0.0, abs(length(p - float2(0.46, 0.18)) - 0.11 - sin(uniforms.time) * 0.03));
        float morphB = smoothstep(0.03 + audio * 0.03, 0.0, abs(length(p - float2(-0.52, -0.22)) - 0.09 - cos(uniforms.time * 0.8) * 0.025));
        color += (morphA * blue + morphB * pink) * (0.34 + audio * 0.4);

        return half4(half3(color), 1.0);
    }
    """
}
