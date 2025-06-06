"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMetadata } from "@/lib/metadata";
import Papa from "papaparse";

export default function NewSave() {
	const [url, setUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [csvFile, setCsvFile] = useState(null);
	const [importing, setImporting] = useState(false);
	const [importProgress, setImportProgress] = useState({
		current: 0,
		total: 0,
	});
	const router = useRouter();

	const handleSave = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) {
				router.push("/login");
				return;
			}

			const metadata = await fetchMetadata(url);

			const { error: saveError } = await supabase.from("saves").insert({
				user_id: session.user.id,
				url,
				...metadata,
				tags: [],
				time_added: Math.floor(Date.now() / 1000),
			});

			if (saveError) throw saveError;

			router.push("/");
		} catch (error) {
			console.error("Error saving:", error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleCsvImport = async (e) => {
		e.preventDefault();
		if (!csvFile) return;

		setImporting(true);
		setError(null);
		setImportProgress({ current: 0, total: 0 });

		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) {
				router.push("/login");
				return;
			}

			console.log("Starting CSV import...");
			const reader = new FileReader();

			reader.onload = async (event) => {
				try {
					console.log("Parsing CSV file...");
					const csv = Papa.parse(event.target.result, {
						header: true,
						skipEmptyLines: true,
						transformHeader: (header) => header.trim(),
					});

					console.log("CSV Headers:", csv.meta.fields);
					console.log("Total rows:", csv.data.length);
					console.log("First row sample:", csv.data[0]);

					const saves = [];
					setImportProgress({ current: 0, total: csv.data.length });

					for (const [index, row] of csv.data.entries()) {
						console.log(`\nProcessing row ${index + 1}:`, row);

						if (!row.url) {
							console.log(`Skipping row ${index + 1}: No URL found`);
							continue;
						}

						try {
							console.log(
								`Processing URL ${index + 1}/${csv.data.length}: ${row.url}`
							);
							const metadata = await fetchMetadata(row.url);
							console.log("Metadata fetched:", metadata);

							// Parse tags from pipe-separated string
							const tags = row.tags
								? row.tags
										.split("|")
										.map((tag) => tag.trim())
										.filter(Boolean)
								: [];
							console.log("Tags:", tags);

							const saveData = {
								user_id: session.user.id,
								url: row.url,
								title: row.title || metadata.title || "",
								description: metadata.description || "",
								tags,
								...metadata,
								time_added: row.time_added
									? parseInt(row.time_added)
									: Math.floor(Date.now() / 1000),
								created_at: new Date().toISOString(),
							};

							// Only add status if it exists in the CSV
							if (row.status) {
								saveData.status = row.status;
							}

							// Remove any undefined or null values
							Object.keys(saveData).forEach((key) => {
								if (saveData[key] === undefined || saveData[key] === null) {
									delete saveData[key];
								}
							});

							saves.push(saveData);

							setImportProgress({ current: index + 1, total: csv.data.length });
						} catch (error) {
							console.error(`Error processing URL ${row.url}:`, error);
							continue;
						}
					}

					if (saves.length > 0) {
						console.log(`Saving ${saves.length} items to database...`);
						const { error: saveError } = await supabase
							.from("saves")
							.insert(saves)
							.select();

						if (saveError) {
							console.error("Error saving to database:", saveError);
							throw saveError;
						}

						console.log("Successfully saved items to database");
						router.push("/");
					} else {
						console.log("No valid items to save");
						setError(
							"No valid items found in CSV file. Please check the console for details."
						);
					}
				} catch (error) {
					console.error("Error importing CSV:", error);
					setError(error.message);
				} finally {
					setImporting(false);
				}
			};

			reader.onerror = (error) => {
				console.error("Error reading file:", error);
				setError("Error reading CSV file");
				setImporting(false);
			};

			reader.readAsText(csvFile);
		} catch (error) {
			console.error("Error importing CSV:", error);
			setError(error.message);
			setImporting(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<h1 className="text-3xl font-bold text-gray-900 mb-8">Save New Item</h1>

			{error && (
				<div className="rounded-md bg-red-50 p-4 mb-6">
					<div className="text-sm text-red-700">{error}</div>
				</div>
			)}

			<div className="bg-white shadow rounded-lg p-6 mb-8">
				<h2 className="text-lg font-medium text-gray-900 mb-4">Save URL</h2>
				<form onSubmit={handleSave}>
					<div className="mb-4">
						<label
							htmlFor="url"
							className="block text-sm font-medium text-gray-700"
						>
							URL
						</label>
						<input
							type="url"
							id="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							required
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="https://example.com"
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						{loading ? "Saving..." : "Save URL"}
					</button>
				</form>
			</div>

			<div className="bg-white shadow rounded-lg p-6">
				<h2 className="text-lg font-medium text-gray-900 mb-4">
					Import from CSV
				</h2>
				<form onSubmit={handleCsvImport}>
					<div className="mb-4">
						<label
							htmlFor="csv"
							className="block text-sm font-medium text-gray-700"
						>
							CSV File
						</label>
						<input
							type="file"
							id="csv"
							accept=".csv"
							onChange={(e) => setCsvFile(e.target.files[0])}
							required
							className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
						/>
					</div>
					{importing && importProgress.total > 0 && (
						<div className="mb-4">
							<div className="text-sm text-gray-600 mb-2">
								Processing {importProgress.current} of {importProgress.total}{" "}
								items...
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2.5">
								<div
									className="bg-indigo-600 h-2.5 rounded-full"
									style={{
										width: `${
											(importProgress.current / importProgress.total) * 100
										}%`,
									}}
								></div>
							</div>
						</div>
					)}
					<button
						type="submit"
						disabled={importing}
						className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						{importing ? "Importing..." : "Import CSV"}
					</button>
				</form>
			</div>
		</div>
	);
}
