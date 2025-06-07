"use client";

import { useState, useEffect } from "react";
import { supabase, deleteSave, unarchiveSave } from "@/lib/supabase";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import Link from "next/link";
import Layout from "@/components/Layout";
import SaveList from "@/components/SaveList";

export default function Archive() {
	const [saves, setSaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [deletingId, setDeletingId] = useState(null);
	const [unarchivingId, setUnarchivingId] = useState(null);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const ITEMS_PER_PAGE = 10;
	const router = useRouter();
	const { session } = useSession();

	const fetchSaves = async (pageNum = 0, append = false) => {
		try {
			setLoading(true);
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
			setLoading(false);
		}
	};

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

	const handleDeleteClick = (id, title) => {
		setItemToDelete({ id, title });
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

	return (
		<Layout onLogout={handleLogout}>
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
						hasMore={hasMore}
						onLoadMore={handleLoadMore}
						archiveButtonText="Unarchive"
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
					/>
				</div>
			</div>
		</Layout>
	);
}
