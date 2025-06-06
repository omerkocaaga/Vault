"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";

export default function Home() {
	const [saves, setSaves] = useState([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const { session } = useSession();

	useEffect(() => {
		if (!session) {
			router.push("/login");
			return;
		}

		const fetchSaves = async () => {
			try {
				const { data, error } = await supabase
					.from("saves")
					.select("*")
					.order("time_added", { ascending: false });

				if (error) throw error;

				// Ensure each save has a unique key by combining id and time_added
				const savesWithKeys = data.map((save) => ({
					...save,
					key: `${save.id}-${save.time_added}`,
				}));

				setSaves(savesWithKeys);
			} catch (error) {
				console.error("Error fetching saves:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchSaves();

		// Set up real-time subscription
		const channel = supabase
			.channel("saves_changes")
			.on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "saves",
				filter: `user_id=eq.${session.user.id}`,
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [session, router]);

	const handleLogout = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			router.push("/login");
		} catch (error) {
			console.error("Error logging out:", error);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="text-center">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900">Saved Items</h1>
					<div className="flex gap-4">
						<button
							onClick={() => router.push("/new")}
							className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							Add New
						</button>
						<button
							onClick={handleLogout}
							className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
						>
							Logout
						</button>
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{saves.map((save) => (
						<div
							key={save.key}
							className="bg-white overflow-hidden shadow rounded-lg"
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
							<div className="p-6">
								<div className="flex items-center">
									{save.favicon_url && (
										<img
											src={save.favicon_url}
											alt=""
											className="h-6 w-6 mr-2"
										/>
									)}
									<h3 className="text-lg font-medium text-gray-900 truncate">
										{save.title || save.url}
									</h3>
								</div>
								<p className="mt-2 text-sm text-gray-500 line-clamp-2">
									{save.description}
								</p>
								<div className="mt-4">
									<a
										href={save.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
									>
										Visit Site
									</a>
								</div>
								{save.tags && save.tags.length > 0 && (
									<div className="mt-4 flex flex-wrap gap-2">
										{save.tags.map((tag, index) => (
											<span
												key={`${save.key}-tag-${index}`}
												className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
											>
												{tag}
											</span>
										))}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
