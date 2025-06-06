import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function deleteSave(id) {
	const { error } = await supabase.from("saves").delete().eq("id", id);

	if (error) {
		console.error("Error deleting save:", error);
		throw error;
	}
}
