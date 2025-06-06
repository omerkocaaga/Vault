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

		// Enhanced regex patterns for metadata extraction
		const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
		const descriptionMatch = html.match(
			/<meta[^>]*(?:name|property)="(?:description|og:description)"[^>]*content="([^"]*)"[^>]*>/i
		);

		// Try multiple patterns for og:image
		const ogImagePatterns = [
			/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i,
			/<meta[^>]*name="og:image"[^>]*content="([^"]*)"[^>]*>/i,
			/<meta[^>]*property="og:image:secure_url"[^>]*content="([^"]*)"[^>]*>/i,
			/<meta[^>]*property="twitter:image"[^>]*content="([^"]*)"[^>]*>/i,
		];

		// Try multiple patterns for favicon
		const faviconPatterns = [
			/<link[^>]*rel="(?:shortcut )?icon"[^>]*href="([^"]*)"[^>]*>/i,
			/<link[^>]*rel="apple-touch-icon"[^>]*href="([^"]*)"[^>]*>/i,
			/<link[^>]*rel="icon"[^>]*href="([^"]*)"[^>]*>/i,
		];

		const domain = new URL(url).hostname;

		// Extract metadata using the first matching pattern
		const title = titleMatch ? titleMatch[1].trim() : "";
		const description = descriptionMatch ? descriptionMatch[1].trim() : "";

		// Find the first matching og:image
		let ogImage = "";
		for (const pattern of ogImagePatterns) {
			const match = html.match(pattern);
			if (match) {
				ogImage = match[1].trim();
				break;
			}
		}

		// Find the first matching favicon
		let favicon = "";
		for (const pattern of faviconPatterns) {
			const match = html.match(pattern);
			if (match) {
				favicon = match[1].trim();
				break;
			}
		}

		// Handle relative URLs for favicon and og:image
		const resolveUrl = (baseUrl, relativeUrl) => {
			if (!relativeUrl) return "";
			try {
				// Handle protocol-relative URLs
				if (relativeUrl.startsWith("//")) {
					relativeUrl = "https:" + relativeUrl;
				}
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
