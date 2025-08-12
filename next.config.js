/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default
const bundleAnalyzer = require('@next/bundle-analyzer')
const path = require('path')

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // Turbopack configuration (now stable in Next.js 15)
  turbopack: {
    rules: {
      '*.wgsl': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
      '*.glsl': {
        loaders: ['raw-loader'], 
        as: '*.js',
      },
    },
  },
  
  // Enable experimental features for better performance
  experimental: {
    webpackBuildWorker: true,
    optimizeCss: true,
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei'],
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'src']
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
  },

  // Headers for SharedArrayBuffer and WebGPU
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // WebGPU and SharedArrayBuffer headers
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          // WebGPU security headers
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
          },
        ],
      },
    ]
  },

  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ]
  },

  // Compression
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // swcMinify is now default in Next.js 15
  // Use standalone only in production builds, not for development/testing
  ...(process.env.NODE_ENV === 'production' && !process.env.CI ? { output: 'standalone' } : {}),

  // Webpack configuration for WebGPU and shader support
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle shader files
    config.module.rules.push(
      {
        test: /\.(wgsl|glsl|vert|frag)$/,
        use: 'raw-loader',
      },
      {
        test: /\.(mp3|wav|ogg)$/,
        use: {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/sounds/',
            outputPath: 'static/sounds/',
          },
        },
      },
      {
        test: /\.js\.map$/,
        use: 'null-loader'
      }
    )

    // Resolve aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), 'src'),
      '@lib/logger': path.resolve(
        process.cwd(),
        isServer ? 'src/lib/logger.server.ts' : 'src/lib/logger.client.ts'
      ),
    }

    // Optimization for Three.js
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'three/examples/jsm': 'three/examples/jsm',
      }
      
      // Enhanced bundle splitting for client-side
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 100000,
        maxAsyncSize: 200000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all'
          },
          three: {
            test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
            name: 'three',
            priority: 20,
            chunks: 'all',
            enforce: true
          },
          tone: {
            test: /[\\/]node_modules[\\/]tone[\\/]/,
            name: 'tone',
            priority: 20,
            chunks: 'async',
            enforce: true
          },
          magenta: {
            test: /[\\/]node_modules[\\/]@magenta[\\/]/,
            name: 'magenta',
            priority: 25,
            chunks: 'async',
            enforce: true
          },
          ui: {
            test: /[\\/]node_modules[\\/](gsap|framer-motion|@radix-ui)[\\/]/,
            name: 'ui',
            priority: 10,
            chunks: 'all',
            enforce: true
          }
        }
      }
    }

    // WebGPU polyfill configuration
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    }

    return config
  },
}

// PWA configuration
const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
  buildExcludes: [/middleware-manifest.json$/],
}

module.exports = withBundleAnalyzer(withPWA(pwaConfig)(nextConfig))
