/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",         // ← ajoute cette ligne
    "./app/**/*.{js,jsx,ts,tsx}",     // ← pour ton dossier app/ si tu en as
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
