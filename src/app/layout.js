import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
	title: "Vault - Save and Organize Links",
	description: "Save, organize, and manage your bookmarks with ease",
};

export default function RootLayout({ children }) {
	return (
		<html
			lang="en"
			style={{
				"--font-geist-sans": GeistSans.style.fontFamily,
				"--font-geist-mono": GeistMono.style.fontFamily,
			}}
		>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								try {
									var theme = localStorage.getItem('theme');
									var root = document.documentElement;
									
									if (theme === 'dark') {
										root.classList.add('dark');
										root.style.backgroundColor = '#030712';
									} else if (theme === 'light') {
										root.classList.add('light');
										root.style.backgroundColor = '#ffffff';
									} else {
										// system or no theme set
										var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
										if (isDark) {
											root.classList.add('dark');
											root.style.backgroundColor = '#030712';
										} else {
											root.classList.add('light');
											root.style.backgroundColor = '#ffffff';
										}
									}
								} catch (e) {
									// Fallback to system preference
									var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
									var root = document.documentElement;
									if (isDark) {
										root.classList.add('dark');
										root.style.backgroundColor = '#030712';
									} else {
										root.classList.add('light');
										root.style.backgroundColor = '#ffffff';
									}
								}
							})();
						`,
					}}
				/>
			</head>
			<body>
				<ThemeProvider>
					<SessionProvider>
						<main className="">{children}</main>
					</SessionProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
