"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/SessionProvider";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import NewBookmarkModal from "@/components/NewBookmarkModal";
import ImportCSVModal from "@/components/ImportCSVModal";
import SaveList from "@/components/SaveList";

function extractDomain(url) {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname;
	} catch (error) {
		console.error("Error extracting domain:", error);
		return null;
	}
}

export default function Home() {
	const { session, loading: sessionLoading } = useSession();
	const router = useRouter();
	const [saves, setSaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState(null);
	const [newBookmarkModalOpen, setNewBookmarkModalOpen] = useState(false);
	const [importCSVModalOpen, setImportCSVModalOpen] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const ITEMS_PER_PAGE = 10;

	const fetchSaves = useCallback(
		async (pageNum = 0, append = false) => {
			try {
				if (append) {
					setLoadingMore(true);
				} else {
					setLoading(true);
				}
				const {
					data: { session: currentSession },
				} = await supabase.auth.getSession();
				if (!currentSession) {
					router.push("/login");
					return;
				}

				const { data, error } = await supabase
					.from("saves")
					.select("*")
					.eq("user_id", currentSession.user.id)
					.in("status", ["unread", "active"])
					.order("time_added", { ascending: false })
					.range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

				if (error) throw error;

				const activeSaves = data || [];

				if (append) {
					setSaves((prev) => [...prev, ...activeSaves]);
				} else {
					setSaves(activeSaves);
				}

				// Check if we have more items to load
				setHasMore(activeSaves.length === ITEMS_PER_PAGE);
				setPage(pageNum); // Update the page state after successful fetch
			} catch (error) {
				console.error("Error fetching saves:", error);
				setError("Failed to load saved items");
			} finally {
				if (append) {
					setLoadingMore(false);
				} else {
					setLoading(false);
				}
			}
		},
		[router]
	);

	useEffect(() => {
		if (session?.user?.id && !sessionLoading) {
			console.log("Session available, fetching saves");
			// Only fetch initial saves if we don't have any
			if (saves.length === 0) {
				fetchSaves(0, false);
			}
		} else {
			console.log("No session available");
		}
	}, [session, sessionLoading, fetchSaves, saves.length]);

	const handleLoadMore = () => {
		if (!loading && hasMore) {
			const nextPage = page + 1;
			setPage(nextPage);
			fetchSaves(nextPage, true);
		}
	};

	const handleLogout = async () => {
		try {
			await supabase.auth.signOut();
			router.push("/login");
		} catch (error) {
			console.error("Error logging out:", error);
			setError("Failed to log out");
		}
	};

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

			// Update the state with the new item from the database
			if (data && data[0]) {
				// Fetch the latest saves to ensure we have the correct order
				fetchSaves(0, false);
			}
		} catch (error) {
			console.error("Error saving bookmark:", error);
			setError("Failed to save bookmark");
		}
	};

	const handleArchive = async (save) => {
		if (!session?.user?.id) {
			console.error("No session user ID available");
			return;
		}

		try {
			const { error } = await supabase
				.from("saves")
				.update({ status: "archived" })
				.eq("id", save.id)
				.eq("user_id", session.user.id);

			if (error) throw error;

			// Update local state
			setSaves(saves.filter((s) => s.id !== save.id));
		} catch (error) {
			console.error("Error archiving save:", error);
			setError("Failed to archive item");
		}
	};

	const handleDelete = async (save) => {
		if (!session?.user?.id) {
			console.error("No session user ID available");
			return;
		}

		try {
			const { error } = await supabase
				.from("saves")
				.delete()
				.eq("id", save.id)
				.eq("user_id", session.user.id);

			if (error) throw error;

			// Update local state
			setSaves(saves.filter((s) => s.id !== save.id));
		} catch (error) {
			console.error("Error deleting save:", error);
			setError("Failed to delete item");
		}
	};

	const handleImportComplete = () => {
		// Refresh the saves list after import
		fetchSaves(0, false);
	};

	return (
		<Layout
			onAddNew={() => setNewBookmarkModalOpen(true)}
			onLogout={handleLogout}
			onImportCSV={() => setImportCSVModalOpen(true)}
		>
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
					{error}
				</div>
			)}

			<SaveList
				saves={saves}
				onArchive={handleArchive}
				onDelete={handleDelete}
				loading={loading}
				loadingMore={loadingMore}
				hasMore={hasMore}
				onLoadMore={handleLoadMore}
				itemsPerPage={ITEMS_PER_PAGE}
			/>

			<NewBookmarkModal
				isOpen={newBookmarkModalOpen}
				onClose={() => setNewBookmarkModalOpen(false)}
				onSave={handleNewBookmark}
				isSaving={loading}
			/>

			<ImportCSVModal
				isOpen={importCSVModalOpen}
				onClose={() => setImportCSVModalOpen(false)}
				onImportComplete={handleImportComplete}
			/>
		</Layout>
	);
}
