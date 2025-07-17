"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Command } from "cmdk";
import { Search, Tag, Folder, X } from "@geist-ui/icons";
import Modal from "./Modal";
import Image from "next/image";

export default function CommandMenu({ isOpen, onClose }) {
	const [search, setSearch] = useState("");
	const [saves, setSaves] = useState([]);
	const [allSaves, setAllSaves] = useState([]); // For tag counting
	const [collections, setCollections] = useState([]);
	const [tags, setTags] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedFilter, setSelectedFilter] = useState("all"); // "all", "tags", "collections"
	const router = useRouter();
	const [tagModalOpen, setTagModalOpen] = useState(false);
	const [collectionModalOpen, setCollectionModalOpen] = useState(false);
	const [selectedTags, setSelectedTags] = useState([]);
	const [selectedCollections, setSelectedCollections] = useState([]);
	const [tagSearch, setTagSearch] = useState("");
	const [collectionSearch, setCollectionSearch] = useState("");
	const tagBtnRef = useRef(null);
	const collectionBtnRef = useRef(null);
	const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
	const [collectionPopoverOpen, setCollectionPopoverOpen] = useState(false);
	const ITEMS_PER_PAGE = 20;
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const observer = useRef();
	const lastItemRef = useCallback(
		(node) => {
			if (loadingMore) return;
			if (observer.current) observer.current.disconnect();
			observer.current = new window.IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore) {
					loadMore();
				}
			});
			if (node) observer.current.observe(node);
		},
		[loadingMore, hasMore]
	);
	const [collectionCounts, setCollectionCounts] = useState({}); // For collection counting

	// Tag counts - now using allSaves instead of filtered saves
	const tagCounts = tags.reduce((acc, tag) => {
		acc[tag] = allSaves.filter((save) =>
			(save.tags || []).includes(tag)
		).length;
		return acc;
	}, {});

	// Popover close on outside click
	useEffect(() => {
		function handleClick(e) {
			if (
				tagPopoverOpen &&
				tagBtnRef.current &&
				!tagBtnRef.current.contains(e.target) &&
				!document.getElementById("tag-popover")?.contains(e.target)
			) {
				setTagPopoverOpen(false);
			}
			if (
				collectionPopoverOpen &&
				collectionBtnRef.current &&
				!collectionBtnRef.current.contains(e.target) &&
				!document.getElementById("collection-popover")?.contains(e.target)
			) {
				setCollectionPopoverOpen(false);
			}
		}
		if (tagPopoverOpen || collectionPopoverOpen) {
			document.addEventListener("mousedown", handleClick);
		}
		return () => document.removeEventListener("mousedown", handleClick);
	}, [tagPopoverOpen, collectionPopoverOpen]);

	const fetchSaves = useCallback(
		async (pageNum = 0, append = false) => {
			try {
				if (append) setLoadingMore(true);
				else setLoading(true);
				const {
					data: { session },
				} = await supabase.auth.getSession();
				if (!session) return;

				let query = supabase
					.from("saves")
					.select("*")
					.eq("user_id", session.user.id)
					.order("time_added", { ascending: false })
					.range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

				if (search) {
					query = query.or(
						`title.ilike.%${search}%,description.ilike.%${search}%,url.ilike.%${search}%`
					);
				}

				// Tag filter
				if (selectedTags.length > 0) {
					query = query.contains("tags", selectedTags);
				}
				// Collection filter
				if (selectedCollections.length > 0) {
					const collectionIds = selectedCollections.map((c) => c.id);

					// First, get the save IDs that belong to the selected collections
					const { data: collectionItems, error: collectionError } =
						await supabase
							.from("collection_items")
							.select("save_id")
							.in("collection_id", collectionIds);

					if (collectionError) throw collectionError;

					// Extract the save IDs
					const saveIds = collectionItems.map((item) => item.save_id);

					// Filter saves by these IDs
					if (saveIds.length > 0) {
						query = query.in("id", saveIds);
					} else {
						// If no saves found in collections, return empty result
						query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // Non-existent ID
					}
				}

				const { data, error } = await query;
				if (error) throw error;
				const newSaves = data || [];

				// Fetch matching collections if there's a search term
				let matchingCollections = [];
				if (search) {
					// Get current collections state for filtering
					const currentCollections = collections;
					matchingCollections = currentCollections
						.filter((col) =>
							col.name.toLowerCase().includes(search.toLowerCase())
						)
						.map((col) => ({
							...col,
							type: "collection",
						}));
				}

				// Combine saves and collections
				const combinedResults = [...newSaves, ...matchingCollections];

				if (append) {
					setSaves((prev) => {
						// Create a Map to track existing saves by ID for efficient lookup
						const existingSavesMap = new Map(
							prev.map((save) => [save.id, save])
						);

						// Only add saves that don't already exist
						const uniqueNewSaves = newSaves.filter(
							(save) => !existingSavesMap.has(save.id)
						);

						return [...prev, ...uniqueNewSaves];
					});
				} else {
					setSaves(combinedResults);
				}
				setHasMore(newSaves.length === ITEMS_PER_PAGE);
				setPage(pageNum);
			} catch (error) {
				console.error("Error fetching saves:", error);
			} finally {
				if (append) setLoadingMore(false);
				else setLoading(false);
			}
		},
		[search, selectedTags, selectedCollections]
	);

	const fetchCollections = useCallback(async () => {
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) return;

			const { data, error } = await supabase
				.from("collections")
				.select("*")
				.eq("user_id", session.user.id)
				.order("created_at", { ascending: false });

			if (error) throw error;
			setCollections(data || []);
		} catch (error) {
			console.error("Error fetching collections:", error);
		}
	}, []);

	const fetchTags = useCallback(async () => {
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) return;

			const { data, error } = await supabase
				.from("saves")
				.select("tags")
				.eq("user_id", session.user.id);

			if (error) throw error;

			// Extract unique tags from all saves
			const uniqueTags = [...new Set(data.flatMap((save) => save.tags || []))];
			setTags(uniqueTags);
		} catch (error) {
			console.error("Error fetching tags:", error);
		}
	}, []);

	const fetchAllSaves = useCallback(async () => {
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) return;

			const { data, error } = await supabase
				.from("saves")
				.select("*")
				.eq("user_id", session.user.id);

			if (error) throw error;
			setAllSaves(data || []);
		} catch (error) {
			console.error("Error fetching all saves:", error);
		}
	}, []);

	const fetchCollectionCounts = useCallback(async () => {
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) return;

			// Get all collections for the user
			const { data: collectionsData, error: collectionsError } = await supabase
				.from("collections")
				.select("id")
				.eq("user_id", session.user.id);
			if (collectionsError) throw collectionsError;

			const collectionIds = (collectionsData || []).map((c) => c.id);
			if (collectionIds.length === 0) {
				setCollectionCounts({});
				return;
			}

			// Get all collection_items for these collections
			const { data: itemsData, error: itemsError } = await supabase
				.from("collection_items")
				.select("collection_id")
				.in("collection_id", collectionIds);
			if (itemsError) throw itemsError;

			// Count saves per collection
			const counts = {};
			for (const colId of collectionIds) {
				counts[colId] = itemsData.filter(
					(item) => item.collection_id === colId
				).length;
			}
			setCollectionCounts(counts);
		} catch (error) {
			console.error("Error fetching collection counts:", error);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			setPage(0);
			setHasMore(true);
			fetchSaves(0, false);
			fetchCollections();
			fetchTags();
			fetchAllSaves();
			fetchCollectionCounts();
		}
	}, [
		isOpen,
		fetchSaves,
		fetchCollections,
		fetchTags,
		fetchAllSaves,
		fetchCollectionCounts,
	]);

	// Reset saves when filters change to prevent duplicates
	useEffect(() => {
		if (isOpen) {
			setPage(0);
			setHasMore(true);
			setSaves([]); // Clear existing saves before fetching new ones
			fetchSaves(0, false);
		}
	}, [search, selectedTags, selectedCollections, isOpen, fetchSaves]);

	// Cleanup when modal closes
	useEffect(() => {
		if (!isOpen) {
			setSaves([]);
			setPage(0);
			setHasMore(true);
			setSelectedTags([]);
			setSelectedCollections([]);
			setSearch("");
		}
	}, [isOpen]);

	// Cleanup intersection observer on unmount
	useEffect(() => {
		return () => {
			if (observer.current) {
				observer.current.disconnect();
			}
		};
	}, []);

	// Add event listener for opening command menu with pre-selected tag
	useEffect(() => {
		const handleOpenCommandMenu = (event) => {
			const { selectedTag } = event.detail;
			if (selectedTag) {
				setSelectedTags([selectedTag]);
				if (!isOpen) {
					onClose(false);
				}
			}
		};

		window.addEventListener("openCommandMenu", handleOpenCommandMenu);
		return () => {
			window.removeEventListener("openCommandMenu", handleOpenCommandMenu);
		};
	}, [onClose, isOpen]);

	const handleSelect = (item) => {
		if (item.type === "save") {
			window.open(item.url, "_blank");
		} else if (item.type === "collection") {
			router.push(`/collections/${item.slug}`);
		} else if (item.type === "tag") {
			router.push(`/tags/${item.name}`);
		}
		onClose();
	};

	// Filtered tags/collections for modal search
	const filteredTags = tags.filter(
		(tag) =>
			tag.toLowerCase().includes(tagSearch.toLowerCase()) &&
			!selectedTags.includes(tag)
	);
	const filteredCollections = collections.filter(
		(col) =>
			col.name.toLowerCase().includes(collectionSearch.toLowerCase()) &&
			!selectedCollections.some((c) => c.id === col.id)
	);

	function extractDomain(url) {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname;
		} catch {
			return url;
		}
	}

	const loadMore = () => {
		if (!loadingMore && hasMore) {
			fetchSaves(page + 1, true);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex min-h-screen items-center justify-center p-4">
				<div
					className="fixed inset-0 bg-gray-200 bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-50 transition-opacity duration-300 ease-in-out backdrop-blur-md"
					onClick={onClose}
				/>
				<Command className="relative rounded-2xl border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-950 shadow-xl">
					<div className="flex items-center px-3">
						<span className="text-gray-700 dark:text-gray-300">
							<Search size={24} strokeWidth={2.2} />
						</span>
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="flex-1 bg-transparent px-2.5 py-5 outline-none focus:outline-none focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600"
							placeholder="Search in your saves..."
						/>
					</div>

					{/* Filter Buttons and Selected Summary */}
					<div className="flex gap-2.5 px-3 pb-4 pt-1 border-b border-gray-100 dark:border-gray-800 items-center relative flex-wrap">
						<button
							ref={tagBtnRef}
							onClick={() => {
								setTagPopoverOpen((v) => !v);
								setCollectionPopoverOpen(false);
							}}
							className={`px-4 py-1.5 rounded-full border text-sm flex items-center gap-1 max-w-sm ${
								selectedTags.length
									? "bg-gray-200/80 text-gray-500 dark:bg-gray-800/80 dark:text-gray-500 dark:border-gray-500"
									: "bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-500"
							}`}
						>
							<span className="truncate">
								{selectedTags.length > 0 ? (
									<>
										Tag:{" "}
										<span className="font-medium text-gray-700 dark:text-gray-300">
											{selectedTags.join(", ")}
										</span>
									</>
								) : (
									"Tag"
								)}
							</span>
						</button>
						<button
							ref={collectionBtnRef}
							onClick={() => {
								setCollectionPopoverOpen((v) => !v);
								setTagPopoverOpen(false);
							}}
							className={`px-4 py-1.5 rounded-full border text-sm flex items-center gap-1 max-w-sm ${
								selectedCollections.length
									? "bg-gray-200/80 text-gray-500 dark:bg-gray-800/80 dark:text-gray-500 dark:border-gray-500"
									: "bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-500"
							}`}
						>
							<span className="truncate">
								{selectedCollections.length > 0 ? (
									<>
										Collection:{" "}
										<span className="font-medium text-gray-700 dark:text-gray-300">
											{selectedCollections.map((c) => c.name).join(", ")}
										</span>
									</>
								) : (
									"Collection"
								)}
							</span>
						</button>

						{/* Tag Popover */}
						{tagPopoverOpen && (
							<div
								id="tag-popover"
								className="absolute top-12 z-50 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex flex-col gap-2"
								style={{
									left: tagBtnRef.current ? tagBtnRef.current.offsetLeft : 0,
								}}
							>
								<div className="flex items-center mb-2 justify-between border-b border-gray-200 dark:border-gray-700 px-3.5">
									<input
										value={tagSearch}
										onChange={(e) => setTagSearch(e.target.value)}
										className="w-full py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-2"
										placeholder="Search tags"
									/>
									<button
										className="font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white ml-2"
										onClick={() => setTagPopoverOpen(false)}
									>
										Done
									</button>
								</div>
								{/* Selected tags as pills */}
								<div className="flex flex-wrap gap-2 px-2.5">
									{selectedTags.map((tag) => (
										<span
											key={tag}
											className="pl-3.5 pr-2.5 py-1.5 rounded-full border border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 flex items-center"
										>
											{tag}
											<button
												className="ml-1 text-gray-800 dark:text-gray-200"
												onClick={() =>
													setSelectedTags(selectedTags.filter((t) => t !== tag))
												}
												aria-label={`Remove tag ${tag}`}
											>
												<X size={12} strokeWidth={2.2} />
											</button>
										</span>
									))}
								</div>
								<div className="h-60 overflow-y-auto">
									{filteredTags.length > 0 ? (
										filteredTags.map((tag) => (
											<div
												key={tag}
												className="flex items-center justify-between px-3.5 py-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
												onClick={() => {
													setSelectedTags(
														selectedTags.includes(tag)
															? selectedTags.filter((t) => t !== tag)
															: [...selectedTags, tag]
													);
												}}
											>
												<span
													className={`text-sm ${
														selectedTags.includes(tag) ? "font-bold" : ""
													}`}
												>
													{tag}
												</span>
												<span className="text-xs text-gray-400">
													{tagCounts[tag]}
												</span>
											</div>
										))
									) : (
										<div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
											No tags found
										</div>
									)}
								</div>
							</div>
						)}

						{/* Collection Popover */}
						{collectionPopoverOpen && (
							<div
								id="collection-popover"
								className="absolute top-12 z-50 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4"
								style={{
									left: collectionBtnRef.current
										? collectionBtnRef.current.offsetLeft
										: 0,
								}}
							>
								<div className="flex items-center mb-2 justify-between">
									<input
										value={collectionSearch}
										onChange={(e) => setCollectionSearch(e.target.value)}
										className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-2"
										placeholder="Search collections"
									/>
									<button
										className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white ml-2"
										onClick={() => setCollectionPopoverOpen(false)}
									>
										Done
									</button>
								</div>
								{/* Selected collections as pills */}
								<div className="flex flex-wrap gap-1 mb-2">
									{selectedCollections.map((col) => (
										<span
											key={col.id}
											className="px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 flex items-center"
										>
											{col.name}
											<button
												className="ml-1 text-gray-500 hover:text-red-500"
												onClick={() =>
													setSelectedCollections(
														selectedCollections.filter((c) => c.id !== col.id)
													)
												}
												aria-label={`Remove collection ${col.name}`}
											>
												<X size={12} />
											</button>
										</span>
									))}
								</div>
								<div className="max-h-60 overflow-y-auto">
									{filteredCollections.map((col) => (
										<div
											key={col.id}
											className="flex items-center justify-between px-2 py-1 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
											onClick={() => {
												setSelectedCollections(
													selectedCollections.some((c) => c.id === col.id)
														? selectedCollections.filter((c) => c.id !== col.id)
														: [...selectedCollections, col]
												);
											}}
										>
											<span
												className={`text-sm ${
													selectedCollections.some((c) => c.id === col.id)
														? "font-bold"
														: ""
												}`}
											>
												{col.name}
											</span>
											<span className="text-xs text-gray-400">
												{collectionCounts[col.id]}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					<Command.List className="h-[90vh] lg:h-[50vh] w-[90vw] lg:w-[50vw] overflow-auto p-2">
						{loading && page === 0 ? (
							<div className="flex items-center justify-center py-4">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
							</div>
						) : saves.length > 0 ? (
							saves.map((item, idx) => (
								<Command.Item
									key={item.id}
									ref={idx === saves.length - 1 ? lastItemRef : null}
									onSelect={() =>
										handleSelect(
											item.type === "collection"
												? { type: "collection", ...item }
												: { type: "save", ...item }
										)
									}
									className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
								>
									{/* Collection item */}
									{item.type === "collection" ? (
										<>
											<div className="w-10 h-10 flex-shrink-0 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
												<Folder
													size={20}
													className="text-blue-600 dark:text-blue-400"
												/>
											</div>
											<div className="flex flex-col min-w-0 flex-1">
												<span className="text-sm text-gray-900 dark:text-gray-100 truncate font-medium">
													{item.name}
												</span>
												<span className="text-xs text-gray-500 dark:text-gray-400 truncate">
													Collection • {collectionCounts[item.id] || 0} items
												</span>
											</div>
										</>
									) : (
										/* Save item */
										<>
											{/* Thumbnail: og:image or favicon */}
											{item.og_image_url ? (
												<div className="w-10 h-10 flex-shrink-0 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden">
													<Image
														src={item.og_image_url}
														alt={item.title || "thumbnail"}
														width={40}
														height={40}
														className="object-cover w-10 h-10"
													/>
												</div>
											) : item.favicon_url ? (
												<div className="w-10 h-10 flex-shrink-0 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
													<Image
														src={item.favicon_url}
														alt="favicon"
														width={20}
														height={20}
														className="object-contain w-5 h-5"
													/>
												</div>
											) : (
												<div className="w-10 h-10 flex-shrink-0 rounded bg-gray-200 dark:bg-gray-700" />
											)}
											<div className="flex flex-col min-w-0 flex-1">
												<span className="text-sm text-gray-900 dark:text-gray-100 truncate">
													{item.title || item.url}
												</span>
												<span className="text-xs text-gray-500 dark:text-gray-400 truncate">
													{extractDomain(item.url)}
												</span>
											</div>
										</>
									)}
								</Command.Item>
							))
						) : (
							<div className="py-6 text-center text-sm text-gray-500">
								No results
							</div>
						)}
						{loadingMore && (
							<div className="flex items-center justify-center py-2">
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-gray-100"></div>
							</div>
						)}
					</Command.List>
				</Command>
			</div>
		</div>
	);
}
