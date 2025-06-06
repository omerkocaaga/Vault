"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMetadata } from "@/lib/metadata";
import Papa from "papaparse";

function extractDomain(url) {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname;
	} catch (error) {
		console.error("Error extracting domain:", error);
		return null;
	}
}

function parseUnixTimestamp(timestamp) {
	try {
		// Convert string to number
		const unixTimestamp = parseInt(timestamp);
		if (isNaN(unixTimestamp)) {
			throw new Error("Invalid timestamp");
		}
		return unixTimestamp;
	} catch (error) {
		console.error("Error parsing timestamp:", error);
		return Math.floor(Date.now() / 1000); // Current Unix timestamp
	}
}

export default function ImportCSVModal({ isOpen, onClose, onImportComplete }) {
	const [csvFile, setCsvFile] = useState(null);
	const [importing, setImporting] = useState(false);
	const [error, setError] = useState(null);
	const [importProgress, setImportProgress] = useState({
		current: 0,
		total: 0,
	});
	const router = useRouter();

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
								title: row.title || metadata.title || row.url,
								description: metadata.description || "",
								og_image_url: metadata.og_image_url || "",
								favicon_url: metadata.favicon_url || "",
								time_added: row.time_added
									? parseUnixTimestamp(row.time_added)
									: Math.floor(Date.now() / 1000),
								tags: tags,
								status: row.status || "unread",
								created_at: new Date().toISOString(),
								domain: extractDomain(row.url),
							};

							// Remove any undefined or null values
							Object.keys(saveData).forEach((key) => {
								if (saveData[key] === undefined || saveData[key] === null) {
									delete saveData[key];
								}
							});

							console.log("Saving data:", saveData);

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
						onImportComplete?.();
						onClose();
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

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-medium text-gray-900">Import from CSV</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-500"
					>
						<span className="sr-only">Close</span>
						<svg
							className="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{error && (
					<div className="rounded-md bg-red-50 p-4 mb-4">
						<div className="text-sm text-red-700">{error}</div>
					</div>
				)}

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
					<div className="flex justify-end gap-4">
						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={importing}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							{importing ? "Importing..." : "Import CSV"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
