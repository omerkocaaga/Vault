"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/SessionProvider";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import CollectionModal from "@/components/CollectionModal";
import NewBookmarkModal from "@/components/NewBookmarkModal";

export default function CollectionsPage() {
	const { session, loading: sessionLoading } = useSession();
	const router = useRouter();
	const [collections, setCollections] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCollection, setEditingCollection] = useState(null);
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
			setError("Bookmark saved successfully!");
		} catch (error) {
			console.error("Error saving bookmark:", error);
			setError("Failed to save bookmark");
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

	useEffect(() => {
		if (session?.user?.id && !sessionLoading) {
			fetchCollections();
		} else if (!sessionLoading) {
			router.push("/login");
		}
	}, [session, sessionLoading, router]);

	const fetchCollections = async () => {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from("collections")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			setCollections(data || []);
		} catch (error) {
			console.error("Error fetching collections:", error);
			setError("Failed to load collections");
		} finally {
			setLoading(false);
		}
	};

	const handleCollectionClick = (collection) => {
		router.push(`/collections/${collection.slug}`);
	};

	const handleEditCollection = (collection) => {
		setEditingCollection(collection);
		setIsModalOpen(true);
	};

	const handleDeleteCollection = async (collectionId) => {
		if (!confirm("Are you sure you want to delete this collection?")) return;

		try {
			const { error } = await supabase
				.from("collections")
				.delete()
				.eq("id", collectionId);

			if (error) throw error;

			// Update local state
			setCollections(collections.filter((c) => c.id !== collectionId));
		} catch (error) {
			console.error("Error deleting collection:", error);
			setError("Failed to delete collection");
		}
	};

	return (
		<Layout
			onAddNew={() => setNewBookmarkModalOpen(true)}
			onLogout={handleLogout}
		>
			<div className="container mx-auto px-4 py-8">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold">Collections</h1>
					<button
						onClick={() => {
							setEditingCollection(null);
							setIsModalOpen(true);
						}}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						New Collection
					</button>
				</div>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				{loading ? (
					<div className="text-center py-8">
						<p>Loading collections...</p>
					</div>
				) : collections.length === 0 ? (
					<div className="bg-white rounded-lg shadow p-8 text-center">
						<p className="text-gray-600 mb-4">No collections yet</p>
						<p className="text-sm text-gray-500">
							Create your first collection to start organizing your bookmarks
						</p>
					</div>
				) : (
					<div className="grid gap-4">
						{collections.map((collection) => (
							<div
								key={collection.id}
								className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
								onClick={() => handleCollectionClick(collection)}
							>
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<h3 className="text-xl font-semibold text-gray-900 mb-2">
											{collection.name}
										</h3>
										{collection.description && (
											<p className="text-gray-600 mb-3">
												{collection.description}
											</p>
										)}
										<div className="flex items-center text-sm text-gray-500">
											<span>
												Created{" "}
												{new Date(collection.created_at).toLocaleDateString()}
											</span>
											{collection.updated_at !== collection.created_at && (
												<>
													<span className="mx-2">•</span>
													<span>
														Updated{" "}
														{new Date(
															collection.updated_at
														).toLocaleDateString()}
													</span>
												</>
											)}
										</div>
									</div>
									<div className="flex space-x-2 ml-4">
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleEditCollection(collection);
											}}
											className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
										>
											Edit
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteCollection(collection.id);
											}}
											className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
										>
											Delete
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				<CollectionModal
					isOpen={isModalOpen}
					onClose={() => {
						setIsModalOpen(false);
						setEditingCollection(null);
					}}
					onSuccess={fetchCollections}
					collection={editingCollection}
				/>

				<NewBookmarkModal
					isOpen={newBookmarkModalOpen}
					onClose={() => setNewBookmarkModalOpen(false)}
					onSave={handleNewBookmark}
					isSaving={loading}
				/>
			</div>
		</Layout>
	);
}
