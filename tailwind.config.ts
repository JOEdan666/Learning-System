// @ts-nocheck
type Config = any

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // 启用类策略的暗色模式
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#6366F1',
        accent: '#EC4899',
        neutral: '#1F2937',
        'neutral-light': '#F3F4F6',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            lineHeight: '1.75',
            code: {
              backgroundColor: theme('colors.gray.100'),
              color: theme('colors.gray.800'),
              padding: '0.2rem 0.35rem',
              borderRadius: '0.375rem',
              fontWeight: '500',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
        invert: {
          css: {
            code: {
              backgroundColor: theme('colors.gray.800'),
              color: theme('colors.gray.100'),
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
