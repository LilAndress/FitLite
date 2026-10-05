/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'surface': 'var(--surface)',
        'border-color': 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-error': 'var(--accent-error)',
      },
      fontFamily: {
        space: ['var(--font-heading)', 'sans-serif'],
        sans: ['var(--font-body)', 'sans-serif'],
        inter: ['var(--font-body)', 'sans-serif'],
        orbitron: ['var(--font-heading)', 'sans-serif'], // Alias seguro a Space Grotesk
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      borderRadius: {
        pill: '9999px',
        card: '12px',
        sm: '6px',
        md: '8px',
        lg: '12px',
      }
    },
  },
  plugins: [],
}
