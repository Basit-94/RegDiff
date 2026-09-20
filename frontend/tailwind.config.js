/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        serif: ['Fraunces', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        obsidian: {
          DEFAULT: '#080c14',
          canvas: '#07090e',
          surface: '#0d121d',
          card: '#0e1422',
          border: '#1e293d',
          elevated: '#141c2e',
          tier3: '#1a2234',
        },
        coral: {
          DEFAULT: '#FF5722',
          vivid: '#FF5722',
          light: '#FFEDD5',
          hover: '#FF7043',
          tangerine: '#FF6B35',
          accent: '#FB923C',
          sunset: '#FBBF24',
        },
        pistachio: {
          DEFAULT: '#10B981',
          emerald: '#00E699',
          light: 'rgba(16, 185, 129, 0.12)',
          border: '#10B981',
          badge: 'rgba(16, 185, 129, 0.2)',
          text: '#34D399',
        },
        apricot: {
          50: '#FFFDF9',
          100: '#FFF7ED',
          200: '#FFEDD5',
          300: '#FED7AA',
          400: '#FB923C',
        },
        forest: {
          900: '#064E3B',
          800: '#065F46',
          700: '#047857',
          muted: '#1E3A34',
          ink: '#0F172A',
        }
      },
      borderRadius: {
        'clay-xl': '24px',
        'clay-2xl': '32px',
        'capsule': '9999px',
      },
      boxShadow: {
        'neon-coral': '0 0 25px rgba(255, 87, 34, 0.45)',
        'glow-coral': '0 0 28px -4px rgba(255, 107, 53, 0.55)',
        'dark-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        'dark-clay': '0 20px 45px -15px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
        'clay': '0 20px 40px -15px rgba(234, 88, 12, 0.12), 0 4px 16px -2px rgba(15, 23, 42, 0.04)',
        'clay-lg': '0 28px 60px -16px rgba(234, 88, 12, 0.2), 0 8px 24px -6px rgba(15, 23, 42, 0.06)',
        'pill': '0 4px 18px rgba(234, 88, 12, 0.28)',
      }
    },
  },
  plugins: [],
}
