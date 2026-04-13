import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0f2742',
          gold: '#c7a56b',
          sand: '#f8f4ef'
        }
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15,39,66,0.08)'
      }
    }
  },
  plugins: []
} satisfies Config
