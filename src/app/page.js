"use client";

import { useEffect } from "react";
import { useSession } from "@/components/SessionProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
	const { session, loading: sessionLoading } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (!sessionLoading && session) {
			// If user is logged in, redirect to the app
			router.push("/app");
		}
	}, [session, sessionLoading, router]);

	// Show loading while checking session
	if (sessionLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
					<p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
				</div>
			</div>
		);
	}

	// If user is logged in, show loading while redirecting
	if (session) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
					<p className="mt-4 text-gray-600 dark:text-gray-400">
						Redirecting to app...
					</p>
				</div>
			</div>
		);
	}

	// Landing page for non-authenticated users
	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="flex justify-between items-center xl:py-16 lg:py-12 md:py-10 py-8">
				<div className="flex gap-8 items-center flex-1">
					<Link href="/" className="flex space-x-4 items-center">
						<div className="w-7 h-7 rounded-full bg-primary"></div>
						<span className="text-xl font-semibold">Vault</span>
					</Link>
				</div>
				<div className="flex items-center gap-4">
					<Link
						href="/login"
						className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 duration-300 ease-in-out"
					>
						Login
					</Link>
					<Link
						href="/signup"
						className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 duration-300 ease-in-out"
					>
						Sign Up
					</Link>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 flex items-center justify-center px-4">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
						Save and organize your
						<br />
						<span className="text-primary">digital life</span>
					</h1>
					<p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
						Vault is your personal bookmark manager. Save links, organize them
						into collections, and never lose track of the things that matter to
						you.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link
							href="/signup"
							className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 duration-300 ease-in-out"
						>
							Get Started Free
						</Link>
						<Link
							href="/login"
							className="border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 duration-300 ease-in-out"
						>
							Already have an account?
						</Link>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="py-8 text-center text-gray-500 dark:text-gray-400">
				<p>&copy; 2024 Vault. All rights reserved.</p>
			</footer>
		</div>
	);
}
