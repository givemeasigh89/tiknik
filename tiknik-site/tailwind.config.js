// Tailwind settings for static/css/site.css (the site and /admin). After changing classes in
// templates/ or static/js/, rebuild:
//   npx tailwindcss@3.4.17 -c tailwind.config.js -i static/css/tailwind.src.css -o static/css/site.css --minify
module.exports = {
  content: ["./templates/**/*.html", "./static/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        cream: "#EFEEEA",
        "cream-dark": "#E4E1D8",
        panel: "#E9E6DF",
        charcoal: "#2E2C29",
        ink: "#3A3A3A",
        line: "#C9C3B4",
        gold: "#A48F66",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Noto Serif Armenian"', "serif"],
        sans: ["Jost", '"Noto Sans Armenian"', "sans-serif"],
      },
    },
  },
};
