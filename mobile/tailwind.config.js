/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 uses the content paths to find classes
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary brand colors - Teal theme matching frontend
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Teal colors for accent
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // Gray scale for text and backgrounds
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Background colors
        background: '#ffffff',
        foreground: '#111827',
        // Card colors
        card: {
          DEFAULT: '#ffffff',
          foreground: '#111827',
        },
        // Border colors
        border: '#e5e7eb',
        // Input colors
        input: '#e5e7eb',
        // Ring (focus) colors
        ring: '#14b8a6',
        // Muted colors
        muted: {
          DEFAULT: '#f3f4f6',
          foreground: '#6b7280',
        },
        // Accent colors
        accent: {
          DEFAULT: '#f0fdfa',
          foreground: '#0f766e',
        },
        // Destructive colors for errors/warnings
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        // Success colors
        success: {
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['System'],
        mono: ['SpaceMono'],
      },
      borderRadius: {
        'lg': '12px',
        'md': '8px',
        'sm': '4px',
        'xl': '16px',
        '2xl': '20px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
};
