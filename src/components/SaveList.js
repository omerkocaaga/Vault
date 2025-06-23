"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, markAsRead } from "@/lib/supabase";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import AddToCollectionModal from "./AddToCollectionModal";
import Masonry from "react-masonry-css";
import { Archive, Trash, Folder, ArrowUp } from "@geist-ui/icons";

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
	loadingMore = false,
	hasMore,
	onLoadMore,
	archiveButtonText = "Archive",
	onOpenCommandMenu,
	itemsPerPage = 10,
}) {
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [addToCollectionModalOpen, setAddToCollectionModalOpen] =
		useState(false);
	const [selectedSave, setSelectedSave] = useState(null);
	const [loadingStates, setLoadingStates] = useState({});
	const [failedImages, setFailedImages] = useState(new Set());
	const [skeletonKeys, setSkeletonKeys] = useState([]);
	const observer = useRef();
	const lastSaveElementRef = useCallback(
		(node) => {
			if (loadingMore) return;
			if (observer.current) observer.current.disconnect();
			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore) {
					onLoadMore();
				}
			});
			if (node) observer.current.observe(node);
		},
		[loadingMore, hasMore, onLoadMore]
	);

	// Generate skeleton keys when loading more starts
	useEffect(() => {
		if (loadingMore && saves && saves.length > 0) {
			console.log("Showing skeleton cards for loading more items");
			const newSkeletonKeys = Array.from(
				{ length: itemsPerPage },
				(_, i) => `skeleton-${Date.now()}-${i}`
			);
			setSkeletonKeys(newSkeletonKeys);
		} else {
			console.log("Clearing skeleton cards", {
				loadingMore,
				savesLength: saves?.length,
			});
			setSkeletonKeys([]);
		}
	}, [loadingMore, itemsPerPage, saves]);

	// Create skeleton cards for loading state
	const renderSkeletonCards = () => {
		return skeletonKeys.map((key, index) => (
			<div
				key={key}
				className="bg-gray-100/25 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 animate-pulse mb-8"
			>
				{/* Skeleton image */}
				<div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-tl-2xl rounded-tr-2xl"></div>

				{/* Skeleton content */}
				<div className="px-6 pb-4">
					{/* Skeleton title */}
					<div className="pt-6 pb-1">
						<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
						<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
					</div>

					{/* Skeleton description */}
					<div className="space-y-2">
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
					</div>
				</div>

				{/* Skeleton metadata */}
				<div className="px-6 pb-6">
					<div className="flex items-center gap-2.5">
						<div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
						<div className="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
					</div>
				</div>

				{/* Skeleton tags */}
				<div className="px-6 pb-6">
					<div className="flex gap-2">
						<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
						<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
						<div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-14"></div>
					</div>
				</div>
			</div>
		));
	};

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

	// Masonry breakpoints
	const breakpointColumns = {
		default: 4,
		1536: 3, // 2xl
		1280: 2, // xl
		768: 1, // md
		640: 1, // sm
	};

	return (
		<Masonry
			breakpointCols={breakpointColumns}
			className="my-masonry-grid"
			columnClassName="my-masonry-grid_column"
		>
			{saves.map((save, index) => (
				<div
					key={`${save.id}-${index}`}
					ref={index === saves.length - 1 ? lastSaveElementRef : null}
					className="bg-gray-100/10 dark:bg-gray-900/10 rounded-2xl border border-gray-200 dark:border-gray-800 mb-8"
				>
					<a
						href={save.url}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => {
							e.preventDefault();
							window.open(save.url, "_blank");
						}}
						className="block"
					>
						{save.og_image_url && (
							<div className="w-full relative">
								<Image
									src={save.og_image_url}
									alt={save.title}
									width={0}
									height={0}
									sizes="100vw"
									className="w-full h-auto  rounded-tl-2xl rounded-tr-2xl"
									style={{ objectFit: "contain" }}
									onError={(e) => {
										e.currentTarget.style.display = "none";
									}}
								/>
							</div>
						)}
						<div className="px-6 pb-4">
							<div className="flex flex-wrap items-center gap-1.5 pt-6">
								{save.favicon_url && !failedImages.has(save.favicon_url) && (
									<div className="relative w-4 h-4">
										<Image
											src={save.favicon_url}
											alt=""
											fill
											// className="rounded-full"
											onError={(e) => {
												setFailedImages(
													(prev) => new Set([...prev, save.favicon_url])
												);
											}}
										/>
									</div>
								)}
								<p className="text-gray-500 dark:text-gray-500 text-xs">
									{save.domain}
								</p>
								<span className="text-gray-500 dark:text-gray-500">•</span>
								<p className="text-gray-500 dark:text-gray-500 text-xs">
									{timeAgo(save.time_added)}
								</p>
							</div>
							<h3 className="flex-1 text-gray-900 dark:text-gray-100 line-clamp-3 pt-2 pb-1">
								{save.title || save.url}
							</h3>
							{save.description && (
								<p className="text-sm text-gray-500 dark:text-gray-500">
									{save.description}
								</p>
							)}
						</div>
					</a>

					{save.tags && save.tags.length > 0 && (
						<div className="flex flex-wrap gap-1 px-6">
							{save.tags.map((tag, index) => (
								<span
									key={index}
									className="inline-flex items-center rounded-full duration-300 ease-in-out text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 text-sm cursor-pointer mr-1"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										// Open command menu with this tag selected
										window.dispatchEvent(
											new CustomEvent("openCommandMenu", {
												detail: {
													selectedTag: tag,
												},
											})
										);
										// Open the command menu
										if (window.openCommandMenu) {
											window.openCommandMenu();
										}
									}}
								>
									#{tag}
								</span>
							))}
						</div>
					)}

					<div className="flex gap-6 p-6">
						<button
							onClick={() => {
								setSelectedSave(save);
								setAddToCollectionModalOpen(true);
							}}
							className="duration-300 ease-in-out text-gray-400 dark:text-gray-700 hover:text-gray-600 dark:hover:text-gray-400 p-3 rounded-full bg-gray-50 hover:bg-gray-100"
						>
							<Folder size={16} strokeWidth={2} />
						</button>
						{onArchive && (
							<button
								onClick={() => handleArchive(save)}
								disabled={loadingStates[save.id]}
								className="duration-300 ease-in-out text-gray-400 dark:text-gray-700 hover:text-gray-600 dark:hover:text-gray-400 p-3 rounded-full bg-gray-50 hover:bg-gray-100"
							>
								{loadingStates[save.id] ? (
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
								) : save.status === "archived" ? (
									<ArrowUp size={16} strokeWidth={2} />
								) : (
									<Archive size={16} strokeWidth={2} />
								)}
							</button>
						)}
						{onDelete && (
							<button
								onClick={() => {
									setSelectedSave(save);
									setDeleteModalOpen(true);
								}}
								disabled={loadingStates[save.id]}
								className="duration-300 ease-in-out text-gray-400 dark:text-gray-700 hover:text-red-500 disabled:opacity-50 p-3 rounded-full bg-gray-50"
							>
								<Trash size={16} strokeWidth={2} />
							</button>
						)}
					</div>
				</div>
			))}

			{loadingMore && renderSkeletonCards()}

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

			<AddToCollectionModal
				isOpen={addToCollectionModalOpen}
				onClose={() => {
					setAddToCollectionModalOpen(false);
					setSelectedSave(null);
				}}
				onSuccess={() => {
					// Optionally refresh the saves list or show a success message
				}}
				saveId={selectedSave?.id}
			/>
		</Masonry>
	);
}
