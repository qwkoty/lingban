/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        base: {
          900: "#0a0a0f",
          800: "#0f0f17",
          700: "#15151f",
          600: "#1a1a26",
          500: "#22222e",
        },
        aurora: {
          blue: "#4f8cff",
          cyan: "#3ad7e0",
          green: "#5ee27a",
          yellow: "#f5d142",
          orange: "#ff9e57",
          pink: "#ff6ba6",
          purple: "#a674ff",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Sora"', '"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "breathing": "breathing 3s ease-in-out infinite",
        "gradient-flow": "gradientFlow 8s ease infinite",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "bounce-soft": "bounceSoft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathing: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.04)", opacity: "0.85" },
        },
        gradientFlow: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        bounceSoft: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
