"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/SessionProvider";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import SaveList from "@/components/SaveList";
import CollectionModal from "@/components/CollectionModal";
import NewBookmarkModal from "@/components/NewBookmarkModal";

export default function CollectionPage() {
	const { session, loading: sessionLoading } = useSession();
	const router = useRouter();
	const params = useParams();
	const [collection, setCollection] = useState(null);
	const [saves, setSaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
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
			setSuccess(null);
			return;
		}

		if (!collection) {
			setError("Collection not found");
			setSuccess(null);
			return;
		}

		try {
			setError(null);
			setSuccess(null);
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

			// Add the new bookmark to the current collection
			if (data && data[0]) {
				const { error: collectionError } = await supabase
					.from("collection_items")
					.insert([
						{
							collection_id: collection.id,
							save_id: data[0].id,
							created_at: new Date().toISOString(),
						},
					]);

				if (collectionError) {
					console.error("Error adding to collection:", collectionError);
					throw collectionError;
				}

				// Create a bookmark object with the same structure as fetched saves
				const newBookmark = {
					id: data[0].id,
					url: data[0].url,
					title: data[0].title,
					description: data[0].description,
					og_image_url: data[0].og_image_url,
					favicon_url: data[0].favicon_url,
					time_added: data[0].time_added,
					tags: data[0].tags,
					domain: data[0].domain,
					status: data[0].status,
				};

				// Add the new bookmark to the local state
				setSaves([newBookmark, ...saves]);
			}

			// Show success message
			setSuccess("Bookmark saved successfully and added to collection!");
		} catch (error) {
			console.error("Error saving bookmark:", error);
			setError("Failed to save bookmark");
			setSuccess(null);
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
		if (session?.user?.id && !sessionLoading && params.slug) {
			fetchCollection();
		} else if (!sessionLoading) {
			router.push("/login");
		}
	}, [session, sessionLoading, router, params.slug]);

	const fetchCollection = async () => {
		try {
			setLoading(true);

			// First, get the collection by slug
			const { data: collectionData, error: collectionError } = await supabase
				.from("collections")
				.select("*")
				.eq("slug", params.slug)
				.single();

			if (collectionError) throw collectionError;
			if (!collectionData) {
				setError("Collection not found");
				return;
			}

			setCollection(collectionData);

			// Then fetch the collection items
			const { data: itemsData, error: itemsError } = await supabase
				.from("collection_items")
				.select(
					`
					save_id,
					saves (
						id,
						url,
						title,
						description,
						og_image_url,
						favicon_url,
						time_added,
						tags,
						domain
					)
				`
				)
				.eq("collection_id", collectionData.id)
				.order("created_at", { ascending: false });

			if (itemsError) throw itemsError;
			setSaves(itemsData.map((item) => item.saves));
		} catch (error) {
			console.error("Error fetching collection:", error);
			setError("Failed to load collection");
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveFromCollection = async (saveId) => {
		if (!collection) return;

		try {
			const { error } = await supabase
				.from("collection_items")
				.delete()
				.eq("collection_id", collection.id)
				.eq("save_id", saveId);

			if (error) throw error;

			// Update local state
			setSaves(saves.filter((save) => save.id !== saveId));
		} catch (error) {
			console.error("Error removing item from collection:", error);
			setError("Failed to remove item from collection");
		}
	};

	const handleEditCollection = () => {
		setIsModalOpen(true);
	};

	const handleDeleteCollection = async () => {
		if (!confirm("Are you sure you want to delete this collection?")) return;

		try {
			const { error } = await supabase
				.from("collections")
				.delete()
				.eq("id", collection.id);

			if (error) throw error;

			// Redirect back to collections list
			router.push("/collections");
		} catch (error) {
			console.error("Error deleting collection:", error);
			setError("Failed to delete collection");
		}
	};

	if (loading) {
		return (
			<Layout
				onAddNew={() => setNewBookmarkModalOpen(true)}
				onLogout={handleLogout}
			>
				<div className="container mx-auto px-4 py-8">
					<div className="text-center">Loading collection...</div>
				</div>
			</Layout>
		);
	}

	if (error) {
		return (
			<Layout
				onAddNew={() => setNewBookmarkModalOpen(true)}
				onLogout={handleLogout}
			>
				<div className="container mx-auto px-4 py-8">
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						{error}
					</div>
				</div>
			</Layout>
		);
	}

	if (!collection) {
		return (
			<Layout
				onAddNew={() => setNewBookmarkModalOpen(true)}
				onLogout={handleLogout}
			>
				<div className="container mx-auto px-4 py-8">
					<div className="text-center">Collection not found</div>
				</div>
			</Layout>
		);
	}

	return (
		<Layout
			onAddNew={() => setNewBookmarkModalOpen(true)}
			onLogout={handleLogout}
		>
			<div className="container mx-auto px-4 py-8">
				<div className="flex flex-col justify-between items-center mb-8">
					<div className="flex flex-col justify-center">
						<h1 className="text-3xl text-center font-bold">
							{collection.name}
						</h1>
						{collection.description && (
							<p className="text-gray-600 text-center mt-2">
								{collection.description}
							</p>
						)}
					</div>
					<div className="flex space-x-2">
						<button
							onClick={handleEditCollection}
							className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
						>
							Edit
						</button>
						<button
							onClick={handleDeleteCollection}
							className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
						>
							Delete
						</button>
					</div>
				</div>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}
				{success && (
					<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
						{success}
					</div>
				)}

				<SaveList
					saves={saves}
					loading={loading}
					onRemove={(save) => handleRemoveFromCollection(save.id)}
					itemsPerPage={10}
				/>

				<CollectionModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					onSuccess={() => {
						setIsModalOpen(false);
						fetchCollection();
					}}
					collection={collection}
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
