import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: "var(--bg-primary)",
                    secondary: "var(--bg-secondary)",
                    card: "var(--bg-card)",
                },
                text: {
                    primary: "var(--text-primary)",
                    secondary: "var(--text-secondary)",
                },
                accent: {
                    primary: "var(--accent-primary)",
                    secondary: "var(--accent-secondary)",
                },
                border: "var(--border-color)",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
