const { FlatCompat } = require('@eslint/eslintrc')
const js = require('@eslint/js')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

module.exports = [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'log', 'info'] }],
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
    },
  },
  // SSR/hydration safety: discourage creating AudioContext outside the audio facade
  {
    files: ['app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'NewExpression[callee.name=/^(AudioContext|webkitAudioContext)$/]',
          message:
            'Do not create AudioContext directly. Use the central audio facade (startAudioContext) after a user gesture.',
        },
        {
          selector:
            'NewExpression[callee.type="MemberExpression"][callee.object.name="window"][callee.property.name=/^(AudioContext|webkitAudioContext)$/] ',
          message:
            'Do not create AudioContext via window.* in components. Route through the audio facade.',
        },
      ],
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.*', '**/src/lib/**'],
    rules: {
      'no-console': 'off', // Allow all console methods in tests and lib files
    },
  },
]
