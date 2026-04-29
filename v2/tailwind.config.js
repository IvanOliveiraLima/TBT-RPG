/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:     '#0F0D14',
          surface:  '#15121C',
          elevated: '#1B1725',
        },
        border: {
          subtle:  '#2A2537',
          default: '#3A3450',
          strong:  '#4A3A6B',
        },
        text: {
          primary:   '#F4EFE0',
          secondary: '#C8C4D6',
          tertiary:  '#A09DB0',
          muted:     '#7A7788',
          disabled:  '#6B6878',
        },
        accent: {
          ruby:           '#8B1A2E',
          'ruby-hover':   '#A32D42',
          purple:         '#5B3FA8',
          'purple-hover': '#6F4DC9',
          gold:           '#D4A017',
        },
        feedback: {
          success: '#5DCAA5',
          warning: '#D4A017',
          danger:  '#E24B4A',
          info:    '#7F77DD',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Cinzel', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm:    '4px',
        md:    '6px',
        lg:    '10px',
        xl:    '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'glow-ruby':   '0 0 16px rgba(139, 26, 46, 0.35)',
        'glow-purple': '0 0 16px rgba(91, 63, 168, 0.35)',
        'glow-gold':   '0 0 24px rgba(212, 160, 23, 0.3)',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring:      'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
