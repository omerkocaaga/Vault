"use client";

import { useState } from "react";
import Modal from "./Modal";
import { fetchMetadata } from "@/lib/metadata";

function decodeHtmlEntities(text) {
	if (!text) return "";
	const textarea = document.createElement("textarea");
	textarea.innerHTML = text;
	return textarea.value;
}

export default function NewBookmarkModal({
	isOpen,
	onClose,
	onSave,
	isSaving,
}) {
	const [formData, setFormData] = useState({
		url: "",
		title: "",
		description: "",
		tags: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const tags = formData.tags
				.split(",")
				.map((tag) => tag.trim())
				.filter((tag) => tag.length > 0);

			// Fetch metadata for the URL
			const metadata = await fetchMetadata(formData.url);
			console.log("Fetched metadata:", metadata);

			const saveData = {
				...formData,
				tags,
				title: formData.title || metadata.title || "",
				description:
					formData.description ||
					decodeHtmlEntities(metadata.description) ||
					"",
				og_image_url: metadata.og_image_url || "",
				favicon_url: metadata.favicon_url || "",
			};

			console.log("Saving data:", saveData);
			await onSave(saveData);

			// Reset form
			setFormData({
				url: "",
				title: "",
				description: "",
				tags: "",
			});
		} catch (error) {
			console.error("Error saving bookmark:", error);
			setError("Failed to save bookmark. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Add New Bookmark">
			<form onSubmit={handleSubmit} className="space-y-4">
				{error && (
					<div className="rounded-md bg-red-50 p-4">
						<div className="text-sm text-red-700">{error}</div>
					</div>
				)}

				<div>
					<label
						htmlFor="url"
						className="block text-sm font-medium text-gray-700"
					>
						URL
					</label>
					<input
						type="url"
						id="url"
						required
						value={formData.url}
						onChange={(e) => setFormData({ ...formData, url: e.target.value })}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="https://example.com"
					/>
				</div>

				<div>
					<label
						htmlFor="title"
						className="block text-sm font-medium text-gray-700"
					>
						Title (optional)
					</label>
					<input
						type="text"
						id="title"
						value={formData.title}
						onChange={(e) =>
							setFormData({ ...formData, title: e.target.value })
						}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="Custom title (will use page title if empty)"
					/>
				</div>

				<div>
					<label
						htmlFor="description"
						className="block text-sm font-medium text-gray-700"
					>
						Description (optional)
					</label>
					<textarea
						id="description"
						value={formData.description}
						onChange={(e) =>
							setFormData({ ...formData, description: e.target.value })
						}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="Custom description (will use page description if empty)"
						rows={3}
					/>
				</div>

				<div>
					<label
						htmlFor="tags"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Tags (optional)
					</label>
					<input
						type="text"
						id="tags"
						value={formData.tags}
						onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
						className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="tag1, tag2, tag3"
					/>
				</div>

				<div className="flex justify-end space-x-3">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isLoading || isSaving}
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading || isSaving ? (
							<>
								<svg
									className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
								Saving...
							</>
						) : (
							"Save"
						)}
					</button>
				</div>
			</form>
		</Modal>
	);
}
