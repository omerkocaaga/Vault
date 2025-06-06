import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
	console.log("Middleware: Processing request for:", request.nextUrl.pathname);

	try {
		let response = NextResponse.next({
			request: {
				headers: request.headers,
			},
		});

		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
			{
				cookies: {
					get(name) {
						return request.cookies.get(name)?.value;
					},
					set(name, value, options) {
						response.cookies.set({
							name,
							value,
							...options,
						});
					},
					remove(name, options) {
						response.cookies.delete({
							name,
							...options,
						});
					},
				},
			}
		);

		const {
			data: { session },
		} = await supabase.auth.getSession();
		console.log("Middleware: Session status:", !!session);

		// Get the current path
		const path = request.nextUrl.pathname;

		// If user is signed in and the current path is /login or /signup,
		// redirect the user to /.
		if (session && (path === "/login" || path === "/signup")) {
			console.log("Middleware: Redirecting logged-in user to home");
			return NextResponse.redirect(new URL("/", request.url));
		}

		// If user is not signed in and the current path is not /login or /signup,
		// redirect the user to /login.
		if (!session && path !== "/login" && path !== "/signup") {
			console.log("Middleware: Redirecting non-logged-in user to login");
			const redirectUrl = new URL("/login", request.url);
			// Only add redirectedFrom if it's a valid path
			if (path && path !== "/") {
				redirectUrl.searchParams.set("redirectedFrom", path);
			}
			return NextResponse.redirect(redirectUrl);
		}

		return response;
	} catch (error) {
		console.error("Middleware error:", error);
		// In case of error, allow the request to proceed
		return NextResponse.next();
	}
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|public/).*)",
	],
};
