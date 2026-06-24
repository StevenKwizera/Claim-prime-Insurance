import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, "index.html"),
    path.join(__dirname, "src/**/*.{ts,tsx}")
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["\"Plus Jakarta Sans\"", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#0b1528",
        mist: "#f3f6fb",
        navy: {
          700: "#1a3358",
          800: "#0f2342",
          900: "#0b1528",
          950: "#060d18",
          DEFAULT: "#0b1528"
        },
        prime: {
          50: "#ecfdf8",
          100: "#d1faf0",
          200: "#a7f3e6",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a"
        },
        gold: {
          50: "#fffbeb",
          400: "#e8c547",
          500: "#c9a227",
          600: "#a8841e"
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          700: "#047857"
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          700: "#b45309"
        },
        danger: {
          50: "#fef2f2",
          500: "#ef4444",
          700: "#b91c1c"
        },
        forest: {
          50: "#ecfdf3",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#2d6a4f",
          600: "#1b4332",
          700: "#163d2f",
          800: "#0f2e22",
          900: "#0a1f17",
          950: "#061410"
        }
      },
      boxShadow: {
        panel: "0 16px 48px rgba(11, 21, 40, 0.08)",
        glow: "0 0 0 1px rgba(20, 184, 166, 0.12), 0 12px 40px rgba(13, 148, 136, 0.12)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 12% 8%, rgba(20,184,166,0.14), transparent 38%), radial-gradient(circle at 88% 0%, rgba(201,162,39,0.1), transparent 32%), linear-gradient(160deg, #ffffff 0%, #f3f6fb 55%, #ecfdf8 100%)",
        "sidebar-gradient":
          "linear-gradient(175deg, #0f2342 0%, #0b1528 48%, #071428 100%)",
        "sidebar-blue":
          "linear-gradient(180deg, #0c4a6e 0%, #075985 22%, #0f2342 55%, #0b1528 100%)"
      }
    }
  },
  plugins: []
};
