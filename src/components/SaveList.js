"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, markAsRead } from "@/lib/supabase";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export default function SaveList({
	saves,
	onArchive,
	onDelete,
	loading,
	hasMore,
	onLoadMore,
	archiveButtonText = "Archive",
}) {
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [selectedSave, setSelectedSave] = useState(null);
	const [loadingStates, setLoadingStates] = useState({});
	const observer = useRef();
	const lastSaveElementRef = useCallback(
		(node) => {
			if (loading) return;
			if (observer.current) observer.current.disconnect();
			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore) {
					onLoadMore();
				}
			});
			if (node) observer.current.observe(node);
		},
		[loading, hasMore, onLoadMore]
	);

	console.log("SaveList received saves:", saves?.length || 0);

	const handleArchive = async (save) => {
		if (!save?.id) {
			console.error("No save ID provided for archive");
			return;
		}

		try {
			setLoadingStates((prev) => ({ ...prev, [save.id]: true }));
			await onArchive(save);
		} catch (error) {
			console.error("Error archiving save:", error);
		} finally {
			setLoadingStates((prev) => ({ ...prev, [save.id]: false }));
		}
	};

	const handleDelete = async (save) => {
		if (!save?.id) {
			console.error("No save ID provided for delete");
			return;
		}

		try {
			setLoadingStates((prev) => ({ ...prev, [save.id]: true }));
			await onDelete(save);
		} catch (error) {
			console.error("Error deleting save:", error);
		} finally {
			setLoadingStates((prev) => ({ ...prev, [save.id]: false }));
		}
	};

	const handleItemClick = async (save) => {
		if (!save?.id) return;

		// If the item is unread, mark it as read
		if (save.status === "unread") {
			try {
				await markAsRead(save.id);
				// Update the local state to reflect the change
				save.status = "active";
			} catch (error) {
				console.error("Error marking save as read:", error);
			}
		}
	};

	if (loading && (!saves || saves.length === 0)) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	if (!saves || saves.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500">No saved items yet</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{saves.map((save, index) => (
				<div
					key={save.id}
					ref={index === saves.length - 1 ? lastSaveElementRef : null}
					className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
						save.status === "unread" ? "border-l-4 border-blue-500" : ""
					}`}
				>
					<div className="flex items-start justify-between">
						<div className="flex-1 min-w-0">
							<h3 className="text-lg font-medium text-gray-900 truncate">
								<a
									href={save.url}
									target="_blank"
									rel="noopener noreferrer"
									onClick={() => handleItemClick(save)}
									className="hover:text-indigo-600"
								>
									{save.title || save.url}
								</a>
							</h3>
							{save.description && (
								<p className="mt-1 text-sm text-gray-500 line-clamp-2">
									{save.description}
								</p>
							)}
							<div className="mt-2 flex items-center text-sm text-gray-500">
								<span className="truncate">{save.url}</span>
							</div>
							{save.tags && save.tags.length > 0 && (
								<div className="mt-2 flex flex-wrap gap-2">
									{save.tags.map((tag, index) => (
										<span
											key={index}
											className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
										>
											{tag}
										</span>
									))}
								</div>
							)}
						</div>
						<div className="ml-4 flex-shrink-0 flex space-x-2">
							<button
								onClick={() => handleArchive(save)}
								disabled={loadingStates[save.id]}
								className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
							>
								{loadingStates[save.id] ? (
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
								) : (
									archiveButtonText
								)}
							</button>
							<button
								onClick={() => {
									setSelectedSave(save);
									setDeleteModalOpen(true);
								}}
								disabled={loadingStates[save.id]}
								className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			))}

			{loading && (
				<div className="flex items-center justify-center py-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
				</div>
			)}

			<DeleteConfirmationModal
				isOpen={deleteModalOpen}
				onClose={() => {
					setDeleteModalOpen(false);
					setSelectedSave(null);
				}}
				onConfirm={() => {
					if (selectedSave) {
						handleDelete(selectedSave);
						setDeleteModalOpen(false);
						setSelectedSave(null);
					}
				}}
				title="Delete Save"
				message="Are you sure you want to delete this item? This action cannot be undone."
			/>
		</div>
	);
}
