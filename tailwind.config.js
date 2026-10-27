/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Palette A, transit blue (Decisions Log, Oct 26 branding). Light mode only.
      // accent is 3.0:1 on white: badges and buttons with white text only, never small orange text.
      colors: {
        primary: "#2563EB",
        accent: "#EA580C",
        secondary: "#0891B2",
        background: "#F8FAFC",
        foreground: "#0F172A",
        muted: "#475569",
        border: "#E4ECFC",
        destructive: "#DC2626",
        // green-700: 5.0:1 on white, so it works for small text. Only confirms a state the text already says.
        success: "#15803D",
      },
    },
  },
  plugins: [],
};
