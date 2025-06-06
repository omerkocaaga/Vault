"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	supabase,
	deleteSave,
	archiveSave,
	unarchiveSave,
} from "@/lib/supabase";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { fetchMetadata } from "@/lib/metadata";
import { parse } from "papaparse";
import NewBookmarkModal from "@/components/NewBookmarkModal";

export default function Home() {
	const [saves, setSaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [url, setUrl] = useState("");
	const [importing, setImporting] = useState(false);
	const [importProgress, setImportProgress] = useState(0);
	const [showArchived, setShowArchived] = useState(false);
	const [archivingId, setArchivingId] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [deletingId, setDeletingId] = useState(null);
	const [newBookmarkModalOpen, setNewBookmarkModalOpen] = useState(false);
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

	const handleLogout = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			router.push("/login");
		} catch (error) {
			console.error("Error logging out:", error);
		}
	};

	const handleSave = async (e) => {
		e.preventDefault();
		if (!url) return;

		try {
			setLoading(true);
			const metadata = await fetchMetadata(url);
			const { error } = await supabase.from("saves").insert([
				{
					url,
					title: metadata.title || url,
					description: metadata.description,
					og_image_url: metadata.ogImage,
					favicon_url: metadata.favicon,
					time_added: Math.floor(Date.now() / 1000),
					tags: [],
					status: "active",
					domain: new URL(url).hostname,
				},
			]);

			if (error) throw error;

			setUrl("");
			await fetchSaves();
		} catch (error) {
			console.error("Error saving URL:", error);
			setError("Failed to save URL");
		} finally {
			setLoading(false);
		}
	};

	const handleFileUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		try {
			setImporting(true);
			setImportProgress(0);

			const text = await file.text();
			const { data } = parse(text, { header: true });

			let successCount = 0;
			let errorCount = 0;

			for (let i = 0; i < data.length; i++) {
				const row = data[i];
				try {
					const metadata = await fetchMetadata(row.url);
					const { error } = await supabase.from("saves").insert([
						{
							url: row.url,
							title: row.title || metadata.title || row.url,
							description: metadata.description,
							og_image_url: metadata.ogImage,
							favicon_url: metadata.favicon,
							time_added: Math.floor(Date.now() / 1000),
							tags: row.tags
								? row.tags.split(",").map((tag) => tag.trim())
								: [],
							status: row.status || "active",
							domain: new URL(row.url).hostname,
						},
					]);

					if (error) throw error;
					successCount++;
				} catch (error) {
					console.error("Error importing row:", error);
					errorCount++;
				}

				setImportProgress(Math.round(((i + 1) / data.length) * 100));
			}

			if (errorCount > 0) {
				setError(`Import completed with ${errorCount} errors`);
			}
			await fetchSaves();
		} catch (error) {
			console.error("Error importing file:", error);
			setError("Failed to import file");
		} finally {
			setImporting(false);
			setImportProgress(0);
		}
	};

	const handleArchive = async (id) => {
		try {
			setArchivingId(id);
			await archiveSave(id);
			setSaves(
				saves.map((save) =>
					save.id === id ? { ...save, status: "archived" } : save
				)
			);
		} catch (error) {
			console.error("Error archiving save:", error);
			setError("Failed to archive item");
		} finally {
			setArchivingId(null);
		}
	};

	const handleUnarchive = async (id) => {
		try {
			setArchivingId(id);
			await unarchiveSave(id);
			setSaves(
				saves.map((save) =>
					save.id === id ? { ...save, status: "active" } : save
				)
			);
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
			setSaves(saves.filter((save) => save.id !== itemToDelete.id));
			setDeleteModalOpen(false);
		} catch (error) {
			console.error("Error deleting save:", error);
			setError("Failed to delete item");
		} finally {
			setDeletingId(null);
			setItemToDelete(null);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteModalOpen(false);
		setItemToDelete(null);
	};

	const handleNewBookmark = async (data) => {
		try {
			const {
				data: { session: currentSession },
			} = await supabase.auth.getSession();
			if (!currentSession) {
				router.push("/login");
				return;
			}

			const metadata = await fetchMetadata(data.url);
			const { data: newSave, error } = await supabase
				.from("saves")
				.insert([
					{
						url: data.url,
						title: data.title || metadata.title || data.url,
						description: data.description || metadata.description,
						og_image_url: metadata.og_image_url,
						favicon_url: metadata.favicon_url,
						time_added: Math.floor(Date.now() / 1000),
						tags: data.tags || [],
						status: "active",
						domain: new URL(data.url).hostname,
						user_id: currentSession.user.id,
					},
				])
				.select()
				.single();

			if (error) throw error;

			setNewBookmarkModalOpen(false);
			// Add the new save to the beginning of the list
			setSaves((prevSaves) => [
				{
					...newSave,
					key: `${newSave.id}-${newSave.time_added}`,
				},
				...prevSaves,
			]);
		} catch (error) {
			console.error("Error saving bookmark:", error);
			setError("Failed to save bookmark");
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="text-center">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Fixed Header */}
			<header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<h1 className="text-2xl font-bold text-gray-900">Vault</h1>
						<div className="flex items-center gap-4">
							<Link
								href="/archive"
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							>
								View Archive
							</Link>
							<button
								onClick={() => setNewBookmarkModalOpen(true)}
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							>
								Add New
							</button>
							<button
								onClick={handleLogout}
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="pt-20 pb-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{error && (
						<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
							<p className="text-sm text-red-600">{error}</p>
						</div>
					)}

					<div className="bg-white shadow rounded-lg">
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center space-x-4">
									<button
										onClick={() => setShowArchived(!showArchived)}
										className={`px-4 py-2 text-sm font-medium rounded-md ${
											showArchived
												? "bg-indigo-100 text-indigo-700"
												: "bg-gray-100 text-gray-700"
										}`}
									>
										{showArchived ? "Show Active" : "Show Archived"}
									</button>
								</div>
								<div className="flex items-center space-x-4">
									<label className="flex items-center space-x-2">
										<input
											type="file"
											accept=".csv"
											onChange={handleFileUpload}
											className="hidden"
											id="csv-upload"
										/>
										<span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
											Import CSV
										</span>
									</label>
								</div>
							</div>

							{importing && (
								<div className="mb-4">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm text-gray-600">
											Importing... {importProgress}%
										</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
											style={{ width: `${importProgress}%` }}
										></div>
									</div>
								</div>
							)}

							{loading ? (
								<div className="flex justify-center items-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
								</div>
							) : saves.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-gray-500">No saved items yet.</p>
								</div>
							) : (
								<div className="space-y-4">
									{saves
										.filter((save) =>
											showArchived
												? save.status === "archived"
												: save.status === "active" ||
												  save.status === "unread" ||
												  !save.status
										)
										.map((save) => (
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
																onClick={() => handleArchive(save.id)}
																disabled={archivingId === save.id}
																className={`p-2 rounded-md ${
																	save.status === "archived"
																		? "text-green-600 hover:bg-green-50"
																		: "text-gray-400 hover:bg-gray-50"
																}`}
															>
																{archivingId === save.id ? (
																	<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
																) : save.status === "archived" ? (
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		className="h-5 w-5"
																		viewBox="0 0 20 20"
																		fill="currentColor"
																	>
																		<path
																			fillRule="evenodd"
																			d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
																			clipRule="evenodd"
																		/>
																	</svg>
																) : (
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		className="h-5 w-5"
																		viewBox="0 0 20 20"
																		fill="currentColor"
																	>
																		<path
																			fillRule="evenodd"
																			d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
																			clipRule="evenodd"
																		/>
																	</svg>
																)}
															</button>
															<button
																onClick={() => handleDeleteClick(save)}
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
			</main>

			<DeleteConfirmationModal
				isOpen={deleteModalOpen}
				onClose={handleDeleteCancel}
				onConfirm={handleDeleteConfirm}
				itemTitle={itemToDelete?.title}
				isDeleting={deletingId === itemToDelete?.id}
			/>

			<NewBookmarkModal
				isOpen={newBookmarkModalOpen}
				onClose={() => setNewBookmarkModalOpen(false)}
				onSave={handleNewBookmark}
				isSaving={loading}
			/>
		</div>
	);
}
