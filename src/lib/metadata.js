export async function fetchMetadata(url) {
	try {
		console.log("Fetching metadata for:", url);

		const response = await fetch("/api/metadata", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ url }),
		});

		let data;
		try {
			data = await response.json();
		} catch (e) {
			console.error("Error parsing JSON response:", e);
			throw new Error("Invalid response from metadata API");
		}

		if (!response.ok) {
			console.error("Metadata API error:", data);
			throw new Error(data.error || "Failed to fetch metadata");
		}

		console.log("Metadata response:", data);
		return data;
	} catch (error) {
		console.error("Error fetching metadata:", error);
		return {
			title: "",
			description: "",
			og_image_url: "",
			favicon_url: "",
			domain: new URL(url).hostname,
		};
	}
}
