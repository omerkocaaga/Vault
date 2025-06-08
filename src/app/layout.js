import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

export const metadata = {
	title: "Vault - Save and Organize Links",
	description: "Save, organize, and manage your bookmarks with ease",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" className={GeistSans.className}>
			<body>
				<SessionProvider>
					<main className="min-h-screen">{children}</main>
				</SessionProvider>
			</body>
		</html>
	);
}
