/** @type {import('tailwindcss').Config} */
module.exports = {
  blocklist: ["overline"],
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      borderRadius: { lg: "0px", md: "0px", sm: "0px" },
      fontFamily: {
        display: ["Anton", "Impact", "sans-serif"],
        mono: ["'Space Mono'", "monospace"],
        serifit: ["'Instrument Serif'", "serif"],
        hand: ["Caveat", "cursive"],
      },
      colors: {
        ink: "#16100b", linen: "#f9e8d4", chocolate: "#663924", tangelo: "#d54c15", botticelli: "#8db6c7", paper: "#FFFDF6",
        background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
      },
      keyframes: {
        "marquee-x": { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        rise: { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "none" } },
      },
      animation: { rise: "rise .6s cubic-bezier(.2,.7,.2,1) both" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
