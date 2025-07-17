"use client";

import { useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { User, Lock, LogOut, ArrowLeft } from "@geist-ui/icons";
import Link from "next/link";
import NewBookmarkModal from "@/components/NewBookmarkModal";

export default function Profile() {
	const { session } = useSession();
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [newBookmarkModalOpen, setNewBookmarkModalOpen] = useState(false);

	function extractDomain(url) {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname;
		} catch (error) {
			console.error("Error extracting domain:", error);
			return null;
		}
	}

	const handleNewBookmark = async (formData) => {
		if (!session?.user?.id) {
			console.log("No session user ID available for saving bookmark");
			setError("You must be logged in to save bookmarks");
			return;
		}

		try {
			setError(null);
			const { url, title, description, tags, og_image_url, favicon_url } =
				formData;

			// Create the new save object with all fields explicitly set
			const saveData = {
				user_id: session.user.id,
				url,
				title: title || "",
				description: description || "",
				tags: tags || [],
				status: "unread",
				time_added: Math.floor(Date.now() / 1000),
				domain: extractDomain(url),
				og_image_url: og_image_url || "",
				favicon_url: favicon_url || "",
				created_at: new Date().toISOString(),
			};

			// Remove any undefined or null values
			Object.keys(saveData).forEach((key) => {
				if (saveData[key] === undefined || saveData[key] === null) {
					delete saveData[key];
				}
			});

			// Close the modal immediately
			setNewBookmarkModalOpen(false);

			// Save to database
			const { data, error } = await supabase
				.from("saves")
				.insert([saveData])
				.select();

			if (error) {
				console.error("Error saving to database:", error);
				throw error;
			}

			// Show success message
			setMessage("Bookmark saved successfully!");
		} catch (error) {
			console.error("Error saving bookmark:", error);
			setError("Failed to save bookmark");
		}
	};

	const handlePasswordReset = async () => {
		if (!session?.user?.email) {
			setError("No email address found");
			return;
		}

		setLoading(true);
		setError("");
		setMessage("");

		try {
			const { error } = await supabase.auth.resetPasswordForEmail(
				session.user.email,
				{
					redirectTo: `${window.location.origin}/profile`,
				}
			);

			if (error) throw error;

			setMessage("Password reset email sent! Check your inbox.");
		} catch (error) {
			console.error("Error sending password reset:", error);
			setError("Failed to send password reset email");
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		setLoading(true);
		setError("");

		try {
			await supabase.auth.signOut();
			router.push("/login");
		} catch (error) {
			console.error("Error logging out:", error);
			setError("Failed to log out");
			setLoading(false);
		}
	};

	if (!session) {
		router.push("/login");
		return null;
	}

	return (
		<Layout
			onAddNew={() => setNewBookmarkModalOpen(true)}
			onLogout={handleLogout}
		>
			<div className="max-w-2xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="flex items-center gap-4 mb-8">
					<Link
						href="/app"
						className="p-2 rounded-full bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					>
						<ArrowLeft size={20} strokeWidth={2.2} />
					</Link>
					<h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
						Profile
					</h1>
				</div>

				{/* Profile Info */}
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
					<div className="flex items-center gap-4 mb-6">
						<div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
							<User size={24} strokeWidth={2.2} className="text-white" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
								{session.user.email}
							</h2>
							<p className="text-gray-500 dark:text-gray-400">
								Member since{" "}
								{new Date(session.user.created_at).toLocaleDateString()}
							</p>
						</div>
					</div>

					{/* User ID for debugging */}
					<div className="text-sm text-gray-500 dark:text-gray-400">
						User ID: {session.user.id}
					</div>
				</div>

				{/* Actions */}
				<div className="space-y-4">
					{/* Password Reset */}
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
						<div className="flex items-center gap-3 mb-4">
							<Lock
								size={20}
								strokeWidth={2.2}
								className="text-gray-600 dark:text-gray-400"
							/>
							<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
								Password Reset
							</h3>
						</div>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Send a password reset link to your email address.
						</p>
						<button
							onClick={handlePasswordReset}
							disabled={loading}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{loading ? "Sending..." : "Send Reset Link"}
						</button>
					</div>

					{/* Logout */}
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
						<div className="flex items-center gap-3 mb-4">
							<LogOut
								size={20}
								strokeWidth={2.2}
								className="text-gray-600 dark:text-gray-400"
							/>
							<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
								Logout
							</h3>
						</div>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Sign out of your account. You'll need to log in again to access
							your saves.
						</p>
						<button
							onClick={handleLogout}
							disabled={loading}
							className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{loading ? "Logging out..." : "Logout"}
						</button>
					</div>
				</div>

				{/* Messages */}
				{message && (
					<div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
						<p className="text-green-800 dark:text-green-200">{message}</p>
					</div>
				)}

				{error && (
					<div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
						<p className="text-red-800 dark:text-red-200">{error}</p>
					</div>
				)}
			</div>

			<NewBookmarkModal
				isOpen={newBookmarkModalOpen}
				onClose={() => setNewBookmarkModalOpen(false)}
				onSave={handleNewBookmark}
				isSaving={loading}
			/>
		</Layout>
	);
}
