/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        canvas: '#F8F9FB',
        surface: '#FFFFFF',
        subtle: '#F1F3F6',
        border: '#E8EAED',
        ink: {
          primary: '#202124',
          secondary: '#747B87',
          muted: '#9AA0A6',
        },
        brand: {
          DEFAULT: '#3867D6',
          hover: '#2D55B8',
          soft: '#EEF2FC',
        },
        status: {
          success: '#1E7E5A',
          'success-bg': '#ECF7F2',
          warning: '#B26B00',
          'warning-bg': '#FDF6E9',
          danger: '#C0392B',
          'danger-bg': '#FDEEEC',
          neutral: '#5F6672',
          'neutral-bg': '#F1F3F6',
        },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '10px',
        xl: '12px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(16, 24, 40, 0.04)',
        popover: '0 4px 16px rgba(16, 24, 40, 0.08), 0 1px 3px rgba(16, 24, 40, 0.04)',
        modal: '0 12px 32px rgba(16, 24, 40, 0.12), 0 2px 6px rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
};
