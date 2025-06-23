"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, deleteSave, unarchiveSave } from "@/lib/supabase";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import Link from "next/link";
import Layout from "@/components/Layout";
import SaveList from "@/components/SaveList";
import NewBookmarkModal from "@/components/NewBookmarkModal";
import ImportCSVModal from "@/components/ImportCSVModal";

export default function Archive() {
	const [saves, setSaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [deletingId, setDeletingId] = useState(null);
	const [unarchivingId, setUnarchivingId] = useState(null);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [newBookmarkModalOpen, setNewBookmarkModalOpen] = useState(false);
	const [importCSVModalOpen, setImportCSVModalOpen] = useState(false);
	const ITEMS_PER_PAGE = 10;
	const router = useRouter();
	const { session } = useSession();

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
					.eq("status", "archived")
					.order("time_added", { ascending: false })
					.range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

				if (error) throw error;

				const savesWithKeys = data.map((save) => ({
					...save,
					key: `${save.id}-${save.time_added}`,
				}));

				if (append) {
					setSaves((prev) => [...prev, ...savesWithKeys]);
				} else {
					setSaves(savesWithKeys || []);
				}

				// Check if we have more items to load
				setHasMore(data.length === ITEMS_PER_PAGE);
			} catch (error) {
				console.error("Error fetching saves:", error);
				setError("Failed to load saves");
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
		fetchSaves(0, false);
	}, [fetchSaves]);

	const handleLoadMore = () => {
		if (!loading && hasMore) {
			const nextPage = page + 1;
			setPage(nextPage);
			fetchSaves(nextPage, true);
		}
	};

	const handleDeleteClick = (save) => {
		setItemToDelete(save);
		setDeleteModalOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!itemToDelete) return;

		try {
			setDeletingId(itemToDelete.id);
			await deleteSave(itemToDelete.id);
			setSaves(saves.filter((save) => save.id !== itemToDelete.id));
			setDeleteModalOpen(false);
			setItemToDelete(null);
		} catch (error) {
			console.error("Error deleting save:", error);
			setError("Failed to delete item");
		} finally {
			setDeletingId(null);
		}
	};

	const handleUnarchive = async (save) => {
		try {
			setUnarchivingId(save.id);
			await unarchiveSave(save.id);
			await fetchSaves(0, false);
		} catch (error) {
			console.error("Error unarchiving save:", error);
		} finally {
			setUnarchivingId(null);
		}
	};

	const handleLogout = async () => {
		try {
			await supabase.auth.signOut();
			router.push("/login");
		} catch (error) {
			console.error("Error logging out:", error);
		}
	};

	const handleNewBookmark = useCallback(
		async (bookmarkData) => {
			if (!session?.user?.id) {
				console.error("No session user ID available");
				return;
			}

			try {
				const { error } = await supabase.from("saves").insert([
					{
						...bookmarkData,
						user_id: session.user.id,
						status: "archived",
						time_added: Math.floor(Date.now() / 1000),
						created_at: new Date().toISOString(),
					},
				]);

				if (error) throw error;

				await fetchSaves(0, false);
				setNewBookmarkModalOpen(false);
			} catch (error) {
				console.error("Error saving bookmark:", error);
				setError("Failed to save bookmark");
			}
		},
		[session, fetchSaves]
	);

	const handleImportComplete = useCallback(() => {
		fetchSaves(0, false);
	}, [fetchSaves]);

	return (
		<Layout
			onAddNew={() => setNewBookmarkModalOpen(true)}
			onLogout={handleLogout}
			onImportCSV={() => setImportCSVModalOpen(true)}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="space-y-6">
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
							{error}
						</div>
					)}

					<SaveList
						saves={saves}
						onArchive={handleUnarchive}
						onDelete={handleDeleteClick}
						loading={loading}
						loadingMore={loadingMore}
						hasMore={hasMore}
						onLoadMore={handleLoadMore}
						archiveButtonText="Unarchive"
						itemsPerPage={ITEMS_PER_PAGE}
					/>

					<DeleteConfirmationModal
						isOpen={deleteModalOpen}
						onClose={() => {
							setDeleteModalOpen(false);
							setItemToDelete(null);
						}}
						onConfirm={handleDeleteConfirm}
						title="Delete Archived Item"
						message="Are you sure you want to delete this archived item? This action cannot be undone."
						isDeleting={!!deletingId}
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
				</div>
			</div>
		</Layout>
	);
}
