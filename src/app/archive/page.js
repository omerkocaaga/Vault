"use client";

import { useState, useEffect } from "react";
import { supabase, deleteSave, unarchiveSave } from "@/lib/supabase";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import Link from "next/link";

export default function Archive() {
	const [saves, setSaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [archivingId, setArchivingId] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [deletingId, setDeletingId] = useState(null);

	const fetchSaves = async () => {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("saves")
				.select("*")
				.eq("status", "archived")
				.order("time_added", { ascending: false });

			if (error) throw error;

			const savesWithKeys = data.map((save) => ({
				...save,
				key: `${save.id}-${save.time_added}`,
			}));

			setSaves(savesWithKeys || []);
		} catch (error) {
			console.error("Error fetching saves:", error);
			setError("Failed to load archived items");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSaves();
	}, []);

	const handleUnarchive = async (id) => {
		try {
			setArchivingId(id);
			await unarchiveSave(id);
			await fetchSaves();
		} catch (error) {
			console.error("Error unarchiving save:", error);
			setError("Failed to unarchive item");
		} finally {
			setArchivingId(null);
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
			await fetchSaves();
			setDeleteModalOpen(false);
			setItemToDelete(null);
		} catch (error) {
			console.error("Error deleting save:", error);
			setError("Failed to delete item");
		} finally {
			setDeletingId(null);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteModalOpen(false);
		setItemToDelete(null);
	};

	return (
		<main className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Archive</h1>
					<Link
						href="/"
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
					>
						Back to Home
					</Link>
				</div>

				{error && (
					<div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
						{error}
					</div>
				)}

				{loading ? (
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
					</div>
				) : saves.length === 0 ? (
					<div className="text-center py-12">
						<h3 className="mt-2 text-sm font-medium text-gray-900">
							No archived items
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							Get started by archiving some items from your home page.
						</p>
						<div className="mt-6">
							<Link
								href="/"
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
							>
								Go to Home
							</Link>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{saves.map((save) => (
							<div
								key={save.key}
								className="bg-white rounded-lg shadow-sm overflow-hidden border opacity-60"
							>
								<div className="p-4">
									<div className="flex items-start justify-between">
										<div className="flex-1 min-w-0">
											<h2 className="text-lg font-medium text-gray-900 truncate">
												{save.title || "Untitled"}
											</h2>
											<p className="mt-1 text-sm text-gray-500 truncate">
												{save.url}
											</p>
										</div>
										<div className="flex items-center space-x-2">
											<button
												onClick={() => handleUnarchive(save.id)}
												disabled={archivingId === save.id}
												className="p-2 text-green-600 hover:bg-green-50 rounded-md"
												title="Unarchive"
											>
												{archivingId === save.id ? (
													<svg
														className="animate-spin h-5 w-5"
														viewBox="0 0 24 24"
													>
														<circle
															className="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															strokeWidth="4"
														/>
														<path
															className="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														/>
													</svg>
												) : (
													<svg
														className="h-5 w-5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M5 13l4 4L19 7"
														/>
													</svg>
												)}
											</button>
											<button
												onClick={() => handleDeleteClick(save)}
												disabled={deletingId === save.id}
												className="p-2 text-red-600 hover:bg-red-50 rounded-md"
												title="Delete"
											>
												{deletingId === save.id ? (
													<svg
														className="animate-spin h-5 w-5"
														viewBox="0 0 24 24"
													>
														<circle
															className="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															strokeWidth="4"
														/>
														<path
															className="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														/>
													</svg>
												) : (
													<svg
														className="h-5 w-5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												)}
											</button>
										</div>
									</div>
									{save.description && (
										<p className="mt-2 text-sm text-gray-600 line-clamp-2">
											{save.description}
										</p>
									)}
									{save.tags && save.tags.length > 0 && (
										<div className="mt-3 flex flex-wrap gap-2">
											{save.tags.map((tag, index) => (
												<span
													key={`${save.key}-tag-${index}`}
													className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
												>
													{tag}
												</span>
											))}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<DeleteConfirmationModal
				isOpen={deleteModalOpen}
				onClose={handleDeleteCancel}
				onConfirm={handleDeleteConfirm}
				itemTitle={itemToDelete?.title || "this item"}
				isDeleting={deletingId !== null}
			/>
		</main>
	);
}
