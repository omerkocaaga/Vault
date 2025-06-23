/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/pages/**/*.{js,jsx}",
		"./src/components/**/*.{js,jsx}",
		"./src/app/**/*.{js,jsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Haskoy", "var(--font-geist-sans)"],
				mono: ["var(--font-geist-mono)"],
				haskoy: ["Haskoy"],
			},
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
			},
		},
	},
	plugins: [require("@tailwindcss/aspect-ratio")],
};
