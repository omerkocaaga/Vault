"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "./Modal";

export default function AddToCollectionModal({
	isOpen,
	onClose,
	onSuccess,
	saveId,
}) {
	const [collections, setCollections] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedCollectionId, setSelectedCollectionId] = useState("");

	useEffect(() => {
		if (isOpen) {
			fetchCollections();
		}
	}, [isOpen]);

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

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!selectedCollectionId) return;

		try {
			const { error } = await supabase.from("collection_items").insert([
				{
					collection_id: selectedCollectionId,
					save_id: saveId,
				},
			]);

			if (error) throw error;

			onSuccess();
			onClose();
		} catch (error) {
			console.error("Error adding to collection:", error);
			setError("Failed to add to collection");
		}
	};

	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Add to Collection">
			<form onSubmit={handleSubmit}>
				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				<div className="mb-6">
					<label
						htmlFor="collection"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Select Collection
					</label>
					<select
						id="collection"
						value={selectedCollectionId}
						onChange={(e) => setSelectedCollectionId(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="">Select a collection</option>
						{collections.map((collection) => (
							<option key={collection.id} value={collection.id}>
								{collection.name}
							</option>
						))}
					</select>
				</div>

				<div className="flex justify-end space-x-3">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading || !selectedCollectionId}
						className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
					>
						{loading ? "Adding..." : "Add to Collection"}
					</button>
				</div>
			</form>
		</Modal>
	);
}
