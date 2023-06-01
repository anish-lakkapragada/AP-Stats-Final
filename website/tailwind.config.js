module.exports = {
  content: ["./src/routes/*.{svelte,js,ts}"],
  plugins: [require("daisyui")],
  screens: {
    sm: "50px",
    // => @media (min-width: 576px) { ... }

    md: "500px",
    // => @media (min-width: 768px) { ... }

    lg: "992px",
    // => @media (min-width: 992px) { ... }

    xl: "1200px",
    // => @media (min-width: 1200px) { ... }
  },
};
