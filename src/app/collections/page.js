"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/SessionProvider";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import SaveList from "@/components/SaveList";
import CollectionModal from "@/components/CollectionModal";

export default function CollectionsPage() {
	const { session, loading: sessionLoading } = useSession();
	const router = useRouter();
	const [collections, setCollections] = useState([]);
	const [selectedCollection, setSelectedCollection] = useState(null);
	const [saves, setSaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingCollection, setEditingCollection] = useState(null);

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

	const fetchCollectionItems = async (collectionId) => {
		try {
			setLoading(true);
			const { data, error } = await supabase
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
				.eq("collection_id", collectionId)
				.order("created_at", { ascending: false });

			if (error) throw error;
			setSaves(data.map((item) => item.saves));
		} catch (error) {
			console.error("Error fetching collection items:", error);
			setError("Failed to load collection items");
		} finally {
			setLoading(false);
		}
	};

	const handleCollectionSelect = (collection) => {
		setSelectedCollection(collection);
		fetchCollectionItems(collection.id);
	};

	const handleRemoveFromCollection = async (saveId) => {
		if (!selectedCollection) return;

		try {
			const { error } = await supabase
				.from("collection_items")
				.delete()
				.eq("collection_id", selectedCollection.id)
				.eq("save_id", saveId);

			if (error) throw error;

			// Update local state
			setSaves(saves.filter((save) => save.id !== saveId));
		} catch (error) {
			console.error("Error removing item from collection:", error);
			setError("Failed to remove item from collection");
		}
	};

	const handleAddToCollection = async (saveId) => {
		if (!selectedCollection) return;

		try {
			const { error } = await supabase.from("collection_items").insert([
				{
					collection_id: selectedCollection.id,
					save_id: saveId,
				},
			]);

			if (error) throw error;

			// Refresh collection items
			fetchCollectionItems(selectedCollection.id);
		} catch (error) {
			console.error("Error adding item to collection:", error);
			setError("Failed to add item to collection");
		}
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
			if (selectedCollection?.id === collectionId) {
				setSelectedCollection(null);
				setSaves([]);
			}
		} catch (error) {
			console.error("Error deleting collection:", error);
			setError("Failed to delete collection");
		}
	};

	return (
		<Layout>
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

				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					{/* Collections Sidebar */}
					<div className="md:col-span-1">
						<div className="bg-white rounded-lg shadow p-4">
							<h2 className="text-xl font-semibold mb-4">Your Collections</h2>
							{loading && !collections.length ? (
								<p>Loading collections...</p>
							) : (
								<ul className="space-y-2">
									{collections.map((collection) => (
										<li
											key={collection.id}
											className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
												selectedCollection?.id === collection.id
													? "bg-gray-100"
													: ""
											}`}
										>
											<div
												className="flex justify-between items-start"
												onClick={() => handleCollectionSelect(collection)}
											>
												<div>
													<h3 className="font-medium">{collection.name}</h3>
													{collection.description && (
														<p className="text-sm text-gray-600">
															{collection.description}
														</p>
													)}
												</div>
												<div className="flex space-x-2">
													<button
														onClick={(e) => {
															e.stopPropagation();
															handleEditCollection(collection);
														}}
														className="text-gray-500 hover:text-gray-700"
													>
														Edit
													</button>
													<button
														onClick={(e) => {
															e.stopPropagation();
															handleDeleteCollection(collection.id);
														}}
														className="text-red-500 hover:text-red-700"
													>
														Delete
													</button>
												</div>
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>

					{/* Collection Items */}
					<div className="md:col-span-3">
						{selectedCollection ? (
							<div>
								<h2 className="text-2xl font-semibold mb-4">
									{selectedCollection.name}
								</h2>
								{selectedCollection.description && (
									<p className="text-gray-600 mb-6">
										{selectedCollection.description}
									</p>
								)}
								<SaveList
									saves={saves}
									loading={loading}
									onRemove={(save) => handleRemoveFromCollection(save.id)}
								/>
							</div>
						) : (
							<div className="bg-white rounded-lg shadow p-8 text-center">
								<p className="text-gray-600">
									Select a collection to view its items
								</p>
							</div>
						)}
					</div>
				</div>

				<CollectionModal
					isOpen={isModalOpen}
					onClose={() => {
						setIsModalOpen(false);
						setEditingCollection(null);
					}}
					onSuccess={fetchCollections}
					collection={editingCollection}
				/>
			</div>
		</Layout>
	);
}
