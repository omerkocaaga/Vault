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

export async function archiveSave(id) {
	const { error } = await supabase
		.from("saves")
		.update({ status: "archived" })
		.eq("id", id);

	if (error) {
		console.error("Error archiving save:", error);
		throw error;
	}
}

export async function unarchiveSave(id) {
	const { error } = await supabase
		.from("saves")
		.update({ status: "active" })
		.eq("id", id);

	if (error) {
		console.error("Error unarchiving save:", error);
		throw error;
	}
}

export async function markAsRead(id) {
	const { error } = await supabase
		.from("saves")
		.update({ status: "active" })
		.eq("id", id);

	if (error) {
		console.error("Error marking save as read:", error);
		throw error;
	}
}
