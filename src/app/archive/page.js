"use client";

import { useState, useEffect } from "react";
import { supabase, deleteSave, unarchiveSave } from "@/lib/supabase";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function Archive() {
	const [saves, setSaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [deletingId, setDeletingId] = useState(null);
	const [unarchivingId, setUnarchivingId] = useState(null);
	const router = useRouter();
	const { session } = useSession();

	const fetchSaves = async () => {
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
				.order("time_added", { ascending: false });

			if (error) throw error;

			const savesWithKeys = data.map((save) => ({
				...save,
				key: `${save.id}-${save.time_added}`,
			}));

			setSaves(savesWithKeys || []);
		} catch (error) {
			console.error("Error fetching saves:", error);
			setError("Failed to load saves");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSaves();
	}, []);

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

	const handleUnarchive = async (id) => {
		try {
			setUnarchivingId(id);
			await unarchiveSave(id);
			await fetchSaves();
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
		<Layout onAddNew={() => router.push("/")} onLogout={handleLogout}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{error && (
					<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
						<p className="text-sm text-red-600">{error}</p>
					</div>
				)}

				<div className="bg-white shadow rounded-lg">
					<div className="p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-xl font-semibold text-gray-900">
								Archived Items
							</h2>
							<Link
								href="/"
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							>
								Back to Active Items
							</Link>
						</div>

						{loading ? (
							<div className="flex justify-center items-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
							</div>
						) : saves.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-gray-500">No archived items.</p>
							</div>
						) : (
							<div className="space-y-4">
								{saves.map((save) => (
									<div
										key={save.key}
										className="flex items-start space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
									>
										{save.favicon_url && (
											<img
												src={save.favicon_url}
												alt=""
												className="w-5 h-5 mt-1"
												onError={(e) => {
													e.target.style.display = "none";
												}}
											/>
										)}
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between">
												<h3 className="text-lg font-medium text-gray-900 truncate">
													<a
														href={save.url}
														target="_blank"
														rel="noopener noreferrer"
														className="hover:text-indigo-600"
													>
														{save.title || save.url}
													</a>
												</h3>
												<div className="flex items-center space-x-2">
													<button
														onClick={() => handleUnarchive(save.id)}
														disabled={unarchivingId === save.id}
														className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
													>
														{unarchivingId === save.id ? (
															<div className="flex items-center">
																<svg
																	className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																>
																	<circle
																		className="opacity-25"
																		cx="12"
																		cy="12"
																		r="10"
																		stroke="currentColor"
																		strokeWidth="4"
																	></circle>
																	<path
																		className="opacity-75"
																		fill="currentColor"
																		d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
																	></path>
																</svg>
																Unarchiving...
															</div>
														) : (
															"Unarchive"
														)}
													</button>
													<button
														onClick={() =>
															handleDeleteClick(save.id, save.title)
														}
														disabled={deletingId === save.id}
														className="p-2 text-red-600 hover:bg-red-50 rounded-md"
													>
														{deletingId === save.id ? (
															<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
														) : (
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-5 w-5"
																viewBox="0 0 20 20"
																fill="currentColor"
															>
																<path
																	fillRule="evenodd"
																	d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
																	clipRule="evenodd"
																/>
															</svg>
														)}
													</button>
												</div>
											</div>
											<p className="mt-1 text-sm text-gray-500 line-clamp-2">
												{save.description}
											</p>
											<div className="mt-2 flex flex-wrap gap-2">
												{save.tags.map((tag, index) => (
													<span
														key={`${tag}-${index}`}
														className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
													>
														{tag}
													</span>
												))}
											</div>
											<div className="mt-2 flex items-center text-sm text-gray-500">
												<span>
													{new Date(
														save.time_added * 1000
													).toLocaleDateString()}
												</span>
												<span className="mx-2">•</span>
												<span className="truncate">{save.domain}</span>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			<DeleteConfirmationModal
				isOpen={deleteModalOpen}
				onClose={() => setDeleteModalOpen(false)}
				onConfirm={handleDeleteConfirm}
				itemTitle={itemToDelete?.title}
				isDeleting={deletingId === itemToDelete?.id}
			/>
		</Layout>
	);
}
