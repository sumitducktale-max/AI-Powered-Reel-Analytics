/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgMain: "hsl(var(--bg-main))",
        bgCard: "hsl(var(--bg-card))",
        bgGlass: "hsla(var(--bg-glass))",
        fgMain: "hsl(var(--fg-main))",
        fgMuted: "hsl(var(--fg-muted))",
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        accent: "hsl(var(--accent))",
      },
      // Adding explicit animation handlers for your pipeline loops and spins
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'neon-primary': '0 0 20px rgba(var(--primary-rgb, 236, 72, 153), 0.15)',
        'neon-accent': '0 0 20px rgba(var(--accent-rgb, 168, 85, 247), 0.15)',
      }
    },
  },
  plugins: [],
}