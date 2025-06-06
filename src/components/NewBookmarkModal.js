import { useState } from "react";
import Modal from "./Modal";

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

	const handleSubmit = async (e) => {
		e.preventDefault();
		const tags = formData.tags
			.split(",")
			.map((tag) => tag.trim())
			.filter((tag) => tag.length > 0);

		await onSave({
			...formData,
			tags,
		});

		// Reset form
		setFormData({
			url: "",
			title: "",
			description: "",
			tags: "",
		});
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Add New Bookmark">
			<form onSubmit={handleSubmit} className="space-y-4">
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
						className="block text-sm font-medium text-gray-700"
					>
						Tags (optional)
					</label>
					<input
						type="text"
						id="tags"
						value={formData.tags}
						onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="tag1, tag2, tag3"
					/>
				</div>

				<div className="flex justify-end space-x-3">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSaving}
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSaving ? (
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
