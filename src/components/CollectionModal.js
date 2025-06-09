"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CollectionModal({
	isOpen,
	onClose,
	onSuccess,
	collection = null,
}) {
	const [name, setName] = useState(collection?.name || "");
	const [description, setDescription] = useState(collection?.description || "");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) throw new Error("Not authenticated");

			const collectionData = {
				name,
				description,
				user_id: session.user.id,
			};

			if (collection) {
				// Update existing collection
				const { error } = await supabase
					.from("collections")
					.update(collectionData)
					.eq("id", collection.id);

				if (error) throw error;
			} else {
				// Create new collection
				const { error } = await supabase
					.from("collections")
					.insert([collectionData]);

				if (error) throw error;
			}

			onSuccess();
			onClose();
		} catch (error) {
			console.error("Error saving collection:", error);
			setError("Failed to save collection");
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md">
				<h2 className="text-2xl font-bold mb-4">
					{collection ? "Edit Collection" : "New Collection"}
				</h2>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label
							htmlFor="name"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Name
						</label>
						<input
							type="text"
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					<div className="mb-6">
						<label
							htmlFor="description"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Description
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							rows="3"
						/>
					</div>

					<div className="flex justify-end space-x-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
						>
							{loading ? "Saving..." : "Save Collection"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
