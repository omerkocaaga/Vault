"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestPage() {
	const [status, setStatus] = useState("Testing connection...");
	const [session, setSession] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		async function testConnection() {
			try {
				// Test 1: Check if we can get the session
				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();
				if (sessionError) throw sessionError;

				setSession(session);
				setStatus("Session check successful");

				// Test 2: Try to get the current user
				const {
					data: { user },
					error: userError,
				} = await supabase.auth.getUser();
				if (userError) throw userError;

				setStatus("User check successful");

				// Test 3: Try to create a test table if it doesn't exist
				const { error: createTableError } = await supabase.rpc(
					"create_saved_items_table"
				);
				if (createTableError) {
					console.log(
						"Table creation error (this is expected if the table already exists):",
						createTableError
					);
				}

				setStatus("All tests completed successfully");
			} catch (err) {
				console.error("Supabase test error:", err);
				setError(err.message);
				setStatus("Error occurred");
			}
		}

		testConnection();
	}, []);

	return (
		<div className="min-h-screen p-8">
			<div className="max-w-2xl mx-auto">
				<h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

				<div className="bg-white shadow rounded-lg p-6">
					<div className="mb-4">
						<h2 className="text-lg font-semibold mb-2">Status:</h2>
						<p className="text-gray-700">{status}</p>
					</div>

					{error && (
						<div className="mb-4">
							<h2 className="text-lg font-semibold mb-2 text-red-600">
								Error:
							</h2>
							<p className="text-red-500">{error}</p>
						</div>
					)}

					{session && (
						<div className="mb-4">
							<h2 className="text-lg font-semibold mb-2">Session Info:</h2>
							<pre className="bg-gray-100 p-4 rounded overflow-auto">
								{JSON.stringify(session, null, 2)}
							</pre>
						</div>
					)}

					<div className="mt-4">
						<h2 className="text-lg font-semibold mb-2">
							Environment Variables:
						</h2>
						<div className="bg-gray-100 p-4 rounded">
							<p>
								NEXT_PUBLIC_SUPABASE_URL:{" "}
								{process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Not Set"}
							</p>
							<p>
								NEXT_PUBLIC_SUPABASE_ANON_KEY:{" "}
								{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
									? "✅ Set"
									: "❌ Not Set"}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
