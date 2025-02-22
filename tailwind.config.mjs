/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      maxWidth: {
        'post-65': '65ch',
        'post-70': '70ch',
        'post-75': '75ch',
        'post-80': '80ch',
        'post-85': '85ch',
        'post-90': '90ch',
        'post-95': '95ch',
        'post-100': '100ch'
      },
      colors: {
        foreground: {
          100: "#cccccc",
          200: "#999999",
          300: "#666666",
          400: "#333333",
          500: "#000000",
          600: "#000000",
          700: "#000000",
          800: "#000000",
          900: "#000000",
        },
        background: {
          100: "#ffffff",
          200: "#ffffff",
          300: "#ffffff",
          400: "#ffffff",
          500: "#ffffff",
          600: "#cccccc",
          700: "#999999",
          800: "#666666",
          900: "#333333",
        },
        accent: {
          100: "#ffe3fc",
          200: "#ffc6f9",
          300: "#ff98f3",
          400: "#ff58e7",
          500: "#ff27d7",
          600: "#ff00bb",
          700: "#df0097",
          800: "#b8007d",
          900: "#98036a",
        },
        primary: {
          100: "#ffdddd",
          200: "#ffc0c0",
          300: "#ff9494",
          400: "#ff5757",
          500: "#ff2323",
          600: "#ff0000",
          700: "#d70000",
          800: "#b10303",
          900: "#920a0a",
        },
        secondary: {
          100: "#f4e7ff",
          200: "#ebd3ff",
          300: "#dcb0ff",
          400: "#c77eff",
          500: "#af47ff",
          600: "#9e2af3",
          700: "#891ad6",
          800: "#741aaf",
          900: "#5f178c",
        },
        body: {
          100: "#ffffcc",
          200: "#ffff99",
          300: "#ffff66",
          400: "#ffff33",
          500: "#ffff00",
          600: "#cccc00",
          700: "#999900",
          800: "#666600",
          900: "#333300",
        },
      },
      fontSize: {
        sm: "0.750rem",
        base: "1rem",
        xl: "1.333rem",
        "2xl": "1.777rem",
        "3xl": "2.369rem",
        "4xl": "3.158rem",
        "5xl": "4.210rem",
      },
      fontFamily: {
        // heading: 'Montserrat',
        heading: "Bebas Neue",
        subheading: "Piazzolla",
        body: "Ysabeau",
      },
      fontWeight: {
        normal: "400",
        bold: "700",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
