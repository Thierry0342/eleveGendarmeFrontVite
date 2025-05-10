// tailwind.config.js
module.exports = {
    content: [
      "./index.html", 
      "./src/**/*.{js,jsx,ts,tsx}", // Cette ligne s'assure que Tailwind scanne tous les fichiers JS/JSX
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  };
  