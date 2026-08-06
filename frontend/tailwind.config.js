module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#F7F2FC",
        panel: "#FFFFFF",
        line: "#E9DFF5",
        mint: "#7C4FBE",
        teal: "#C25B96",
        plum: "#C2793A",
        violet: "#A6862A",
        sky: "#7C4FBE",
        fog: "#8D80A6",
        rust: "#E0577A"
      },
      fontFamily: {
        sans: ["'Poppins'", "'Inter'", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};
