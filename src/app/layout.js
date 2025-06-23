import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

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
			className="bg-white dark:bg-gray-950"
		>
			<body>
				<SessionProvider>
					<main className="">{children}</main>
				</SessionProvider>
			</body>
		</html>
	);
}
