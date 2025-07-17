"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

// Global function to apply theme (accessible from ThemeProvider)
if (typeof window !== "undefined") {
	window.applyTheme = (theme) => {
		const root = document.documentElement;
		root.classList.remove("dark", "light");

		if (theme === "system") {
			const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			if (isDark) {
				root.classList.add("dark");
				root.style.backgroundColor = "#030712";
			} else {
				root.classList.add("light");
				root.style.backgroundColor = "#ffffff";
			}
		} else if (theme === "dark") {
			root.classList.add("dark");
			root.style.backgroundColor = "#030712";
		} else {
			root.classList.add("light");
			root.style.backgroundColor = "#ffffff";
		}
	};
}

export function ThemeProvider({ children }) {
	const [theme, setTheme] = useState("system");
	const [mounted, setMounted] = useState(false);

	// Function to apply theme using global function
	const applyTheme = (themeToApply) => {
		if (typeof window === "undefined") return;

		// Use the global function to modify HTML element
		if (window.applyTheme) {
			window.applyTheme(themeToApply);
		}
	};

	useEffect(() => {
		// Get theme from localStorage on mount
		const savedTheme = localStorage.getItem("theme");
		const initialTheme =
			savedTheme && ["dark", "light", "system"].includes(savedTheme)
				? savedTheme
				: "system";

		setTheme(initialTheme);
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;

		// Save theme to localStorage
		localStorage.setItem("theme", theme);

		// Apply theme to HTML element using global function
		applyTheme(theme);
	}, [theme, mounted]);

	// Listen for system theme changes when in system mode
	useEffect(() => {
		if (!mounted || theme !== "system") return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => {
			applyTheme("system");
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [theme, mounted]);

	const value = {
		theme,
		setTheme,
		mounted,
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
