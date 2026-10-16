import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ═══ Brand Palette · هوية Be First Lady ═══
        cream: {
          50:  '#fbf7ef', // الخلفية الرئيسية
          100: '#f6eee0',
          200: '#ece1cc',
          300: '#dfd0b5',
        },
        gold: {
          light: '#c9a96e', // لمسات التمييز
          DEFAULT: '#7d613b', // اللون الأساسي
          deep: '#5a4628', // العناوين الكبيرة
        },
        ink: {
          DEFAULT: '#2a1c10', // النصوص
          soft: '#6b5a42', // النصوص الفرعية
        },
        // ═══ Semantic ═══
        success: '#3f7d54',
        danger:  '#b04a4a',
        warning: '#b08a3b',
        whatsapp: '#25D366',
      },
      fontFamily: {
        'ar-display': ['Amiri', 'serif'],
        'ar-body': ['Cairo', 'sans-serif'],
        'en-display': ['"Cormorant Garamond"', 'serif'],
        'en-label': ['Cinzel', 'serif'],
      },
      backgroundImage: {
        'brand-radial': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,169,110,.12), transparent 60%), linear-gradient(170deg, #fbf7ef, #f6eee0 55%, #efe4d2)',
        'gold-gradient': 'linear-gradient(135deg, #c9a96e, #7d613b 50%, #5a4628)',
      },
      boxShadow: {
        soft: '0 6px 28px rgba(125,97,59,.10)',
        deep: '0 14px 40px rgba(90,70,40,.18)',
        gold: '0 10px 28px rgba(125,97,59,.3)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'ping-dot': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(63,125,84,.55)' },
          '50%':      { boxShadow: '0 0 0 7px rgba(63,125,84,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'ping-dot': 'ping-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
