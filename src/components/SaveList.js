"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, markAsRead } from "@/lib/supabase";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

function timeAgo(timestamp) {
	const seconds = Math.floor(Date.now() / 1000 - timestamp);

	const intervals = {
		year: 31536000,
		month: 2592000,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60,
		second: 1,
	};

	for (const [unit, secondsInUnit] of Object.entries(intervals)) {
		const interval = Math.floor(seconds / secondsInUnit);
		if (interval >= 1) {
			return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
		}
	}

	return "just now";
}

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
	const [failedImages, setFailedImages] = useState(new Set());
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
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
			</div>
		);
	}

	if (!saves || saves.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500 dark:text-gray-400">No saved items yet</p>
			</div>
		);
	}

	console.log("saves", saves);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-14 gap-y-32 items-start">
			{saves.map((save, index) => (
				<a
					key={`${save.id}-${index}`}
					ref={index === saves.length - 1 ? lastSaveElementRef : null}
					href={save.url}
					target="_blank"
					rel="noopener noreferrer"
					onClick={(e) => {
						e.preventDefault();
						// handleItemClick(save);
						window.open(save.url, "_blank");
					}}
				>
					{save.og_image_url && (
						<div className="w-full relative mb-5">
							<Image
								src={save.og_image_url}
								alt={save.title}
								width={0}
								height={0}
								sizes="100vw"
								className="w-full h-auto"
								style={{ objectFit: "contain" }}
								onError={(e) => {
									e.currentTarget.style.display = "none";
								}}
							/>
						</div>
					)}
					<div className="flex flex-col items-start justify-between space-y-4">
						<div>
							<div className="flex items-center space-x-2 mb-1">
								{save.favicon_url && !failedImages.has(save.favicon_url) && (
									<div className="relative w-4 h-4">
										<Image
											src={save.favicon_url}
											alt=""
											fill
											className="rounded-full"
											onError={(e) => {
												setFailedImages(
													(prev) => new Set([...prev, save.favicon_url])
												);
											}}
										/>
									</div>
								)}
								<h3 className="flex-1 text-base text-gray-900 dark:text-gray-100 line-clamp-1">
									{save.title || save.url}
								</h3>
							</div>

							{save.description && (
								<p className="text-sm text-gray-400 dark:text-gray-500 line-clamp-2 mb-2">
									{save.description}
								</p>
							)}
							<p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
								{timeAgo(save.time_added)}
							</p>
							{save.tags && save.tags.length > 0 && (
								<div className="flex flex-wrap gap-1.5">
									{save.tags.map((tag, index) => (
										<span
											key={index}
											className="inline-flex font-mono items-center px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
										>
											{tag}
										</span>
									))}
								</div>
							)}
						</div>

						{/* <div className="ml-4 flex-shrink-0 flex space-x-2">
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
						</div> */}
					</div>
				</a>
			))}

			{loading && (
				<div className="flex items-center justify-center py-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
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
