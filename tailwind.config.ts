import type { Config } from "tailwindcss";

/**
 * Cars Direct tokens. Palette from ui-ux-pro-max (slate "premium dark" + EV emerald),
 * with emerald darkened to #047857 so white button text passes 4.5:1.
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",       // hero, dark panels, headings
        slate: { 950: "#0B1220" },
        mist: "#F1F4F7",      // alternate section ground
        emerald: {
          300: "#6EE7B7",
          400: "#34D399",     // emerald text on ink only
          600: "#047857",     // CTA fill (white text 5.5:1)
          700: "#065F46",     // CTA hover
        },
        gold: "#A16207",      // "150-Point Verified" seal only
        brass: "#A16207",     // alias kept for older components
      },
      fontFamily: {
        display: ["var(--font-display)", "Didot", "Georgia", "serif"], // Bodoni Moda, 28px+ only
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"], // Jost
      },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { rise: "rise .45s cubic-bezier(.2,.7,.2,1) both" },
    },
  },
} satisfies Config;
