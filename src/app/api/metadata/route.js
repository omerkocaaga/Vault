import { NextResponse } from "next/server";

export async function POST(request) {
	let url;
	try {
		const body = await request.json();
		url = body.url;

		if (!url) {
			console.error("No URL provided in request");
			return NextResponse.json({ error: "URL is required" }, { status: 400 });
		}

		console.log("Fetching metadata for URL:", url);
		const response = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
				Accept:
					"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
			},
		});

		if (!response.ok) {
			console.error(
				"Failed to fetch URL:",
				response.status,
				response.statusText
			);
			return NextResponse.json(
				{
					error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
					title: "",
					description: "",
					og_image_url: "",
					favicon_url: "",
					domain: new URL(url).hostname,
				},
				{ status: response.status }
			);
		}

		const html = await response.text();
		console.log("HTML content length:", html.length);

		// Simple regex-based metadata extraction
		const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
		const descriptionMatch = html.match(
			/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i
		);
		const ogImageMatch = html.match(
			/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i
		);
		const faviconMatch = html.match(
			/<link[^>]*rel="(?:shortcut )?icon"[^>]*href="([^"]*)"[^>]*>/i
		);
		const domain = new URL(url).hostname;

		const title = titleMatch ? titleMatch[1].trim() : "";
		const description = descriptionMatch ? descriptionMatch[1].trim() : "";
		const ogImage = ogImageMatch ? ogImageMatch[1].trim() : "";
		const favicon = faviconMatch ? faviconMatch[1].trim() : "";

		// Handle relative URLs for favicon and og:image
		const resolveUrl = (baseUrl, relativeUrl) => {
			if (!relativeUrl) return "";
			try {
				return new URL(relativeUrl, baseUrl).toString();
			} catch (e) {
				console.error("Error resolving URL:", e);
				return relativeUrl;
			}
		};

		const result = {
			title,
			description,
			og_image_url: resolveUrl(url, ogImage),
			favicon_url: resolveUrl(url, favicon),
			domain,
		};

		console.log("Metadata extracted:", result);
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error in metadata API:", error);
		return NextResponse.json(
			{
				error: error.message,
				title: "",
				description: "",
				og_image_url: "",
				favicon_url: "",
				domain: url ? new URL(url).hostname : "",
			},
			{ status: 500 }
		);
	}
}
