/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "a26-pink": "#EAC1C1",
        "a26-beige": "#F8EDEB",
        "a26-gold": "#D4AF37",
        "a26-white": "#FFFFFF",
        "a26-ink": "#3A2E2E",
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["Lato", "sans-serif"],
      },
      borderRadius: {
        a26: "1rem",
      },
    },
  },
  plugins: [],
};
