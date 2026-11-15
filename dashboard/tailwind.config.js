/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B2545',
          50: '#E8EDF4',
          100: '#C5D0E3',
          200: '#8FA1C7',
          300: '#5972AB',
          400: '#2F4D82',
          500: '#0B2545',
          600: '#091E38',
          700: '#07172B',
          800: '#05101E',
          900: '#030911',
        },
        secondary: {
          DEFAULT: '#13315C',
          50: '#EAF0F8',
          100: '#C9D7EC',
          200: '#93AFD9',
          300: '#5D87C6',
          400: '#385C93',
          500: '#13315C',
          600: '#0F274A',
          700: '#0B1D37',
          800: '#081425',
          900: '#040A13',
        },
        accent: {
          DEFAULT: '#134074',
          50: '#EBF1F8',
          100: '#CBDBEE',
          200: '#97B7DD',
          300: '#6393CC',
          400: '#3B6AA0',
          500: '#134074',
          600: '#0F335D',
          700: '#0B2646',
          800: '#081A2F',
          900: '#040D18',
        },
        risk: {
          high: '#EF4444',
          medium: '#F59E0B',
          low: '#22C55E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
