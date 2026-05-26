import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 和モダン・パレット（設計書 §7 と一致）
        vermilion: {
          DEFAULT: '#B8373E',
          deep:    '#7A1F24',
          light:   '#E8716F',
        },
        gold: {
          DEFAULT: '#B8932C',
          light:   '#E4C76A',
        },
        sumi:    '#1C1613',
        ink:     '#2A1F1A',
        'ink-sub':  '#7A6A5E',
        'ink-mute': '#A09184',
        kinari:  '#F5EFE2',
        washi:   '#FBF7EC',
        paper:   '#FFFFFF',
        moss:    '#4F6B4A',
        border:  { DEFAULT: '#D9CFB8', soft: '#E8E0CC' },
        // 高級和風ダークパレット
        night: {
          DEFAULT: '#0D0A07',
          50:      '#1A1209',
          100:     '#221710',
          200:     '#2E1E13',
          card:    '#1C1108',
          warm:    '#160D06',
        },
        'shrine-gold': {
          DEFAULT: '#C9A84C',
          light:   '#E4C76A',
          dim:     '#7A631F',
        },
        'shrine-red': {
          DEFAULT: '#8B1E27',
          light:   '#B8373E',
          deep:    '#5E1219',
        },
      },
      fontFamily: {
        serif:   ['"Shippori Mincho"', '"Noto Serif JP"', 'serif'],
        sans:    ['"Noto Sans JP"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 28px rgba(28,22,19,0.08)',
        lift: '0 16px 36px rgba(28,22,19,0.12)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};

export default config;
