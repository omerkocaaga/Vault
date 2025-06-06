/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./src/pages/**/*.{js,jsx}",
		"./src/components/**/*.{js,jsx}",
		"./src/app/**/*.{js,jsx}",
	],
	theme: {
		extend: {
			colors: {
				background: "rgb(var(--background-rgb))",
				foreground: "rgb(var(--foreground-rgb))",
			},
		},
	},
	plugins: [require("@tailwindcss/aspect-ratio")],
};
