import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#121212",
                foreground: "#ffffff",
                card: "#1e1e1e",
                "card-foreground": "#ffffff",
                border: "#333333",
                primary: "#ffffff",
                "primary-foreground": "#121212",
            },
            fontFamily: {
                sans: ["var(--font-big-shoulders)", "sans-serif"],
                dm: ["var(--font-dm-sans)", "sans-serif"],
            },
            borderRadius: {
                lg: "0.75rem", // ~12px
                md: "0.5rem",
                sm: "0.25rem",
            },
        },
    },
    plugins: [],
};
export default config;
