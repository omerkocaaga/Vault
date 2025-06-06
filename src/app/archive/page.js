"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Archive() {
	const [saves, setSaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const router = useRouter();

	const fetchSaves = async () => {
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) {
				router.push("/login");
				return;
			}

			const { data, error } = await supabase
				.from("saves")
				.select("*")
				.eq("user_id", session.user.id)
				.eq("archived", true)
				.order("created_at", { ascending: false })
				.range(page * 10, (page + 1) * 10 - 1);

			if (error) throw error;

			if (data.length < 10) {
				setHasMore(false);
			}

			setSaves((prev) => [...prev, ...data]);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching saves:", error);
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSaves();
	}, [page]);

	const handleScroll = (e) => {
		const { scrollTop, clientHeight, scrollHeight } = e.target.documentElement;
		if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
			setPage((prev) => prev + 1);
		}
	};

	useEffect(() => {
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [loading, hasMore]);

	const handleUnarchive = async (id) => {
		try {
			const { error } = await supabase
				.from("saves")
				.update({ archived: false })
				.eq("id", id);

			if (error) throw error;

			setSaves((prev) => prev.filter((save) => save.id !== id));
		} catch (error) {
			console.error("Error unarchiving save:", error);
		}
	};

	const handleDelete = async (id) => {
		try {
			const { error } = await supabase.from("saves").delete().eq("id", id);

			if (error) throw error;

			setSaves((prev) => prev.filter((save) => save.id !== id));
		} catch (error) {
			console.error("Error deleting save:", error);
		}
	};

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold text-gray-900">Archived Items</h1>
				<Link
					href="/"
					className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
				>
					Back to Active Items
				</Link>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{saves.map((save) => (
					<div
						key={save.id}
						className="bg-white rounded-lg shadow overflow-hidden"
					>
						{save.og_image_url && (
							<div className="aspect-w-16 aspect-h-9">
								<img
									src={save.og_image_url}
									alt={save.title}
									className="object-cover w-full h-48"
								/>
							</div>
						)}
						<div className="p-4">
							<div className="flex items-center space-x-2 mb-2">
								{save.favicon_url && (
									<img src={save.favicon_url} alt="" className="w-4 h-4" />
								)}
								<span className="text-sm text-gray-500">{save.domain}</span>
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								<a
									href={save.url}
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-indigo-600"
								>
									{save.title}
								</a>
							</h3>
							<p className="text-gray-500 text-sm mb-4 line-clamp-2">
								{save.description}
							</p>
							{save.fetch_failed && (
								<div className="mb-4">
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
										Metadata fetch failed
									</span>
								</div>
							)}
							<div className="flex justify-end space-x-2">
								<button
									onClick={() => handleUnarchive(save.id)}
									className="text-gray-400 hover:text-gray-500"
								>
									Unarchive
								</button>
								<button
									onClick={() => handleDelete(save.id)}
									className="text-red-400 hover:text-red-500"
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{loading && (
				<div className="text-center py-4">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-indigo-600"></div>
				</div>
			)}
		</div>
	);
}
