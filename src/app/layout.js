import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "Vault - Save and Organize Links",
	description: "Save, organize, and manage your bookmarks with ease",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<SessionProvider>
					<main className="min-h-screen bg-gray-50">{children}</main>
				</SessionProvider>
			</body>
		</html>
	);
}
