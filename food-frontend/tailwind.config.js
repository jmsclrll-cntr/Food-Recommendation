/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        hunter: "#344E41",
        fern: "#588157",
        sage: "#A3B18A",
        'sage-light': 'rgba(163, 177, 138, 0.2)',
      },
      letterSpacing: {
        'editorial': '0.3em',
      },
      fontSize: {
        'labels': '9px',
      },
      boxShadow: {
        'diffusive': '0 30px 60px -12px rgba(52, 78, 65, 0.12)',
      }
    },
  },
  plugins: [],
}