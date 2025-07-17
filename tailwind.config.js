/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/pages/**/*.{js,jsx}",
		"./src/components/**/*.{js,jsx}",
		"./src/app/**/*.{js,jsx}",
	],
	darkMode: "class",
	theme: {
		extend: {
			fontFamily: {
				sans: ["Haskoy", "var(--font-geist-sans)"],
				mono: ["var(--font-geist-mono)"],
				haskoy: ["Haskoy"],
			},
		},
	},
	plugins: [require("@tailwindcss/aspect-ratio")],
};
