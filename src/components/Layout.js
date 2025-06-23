"use client";

import { useSession } from "@/components/SessionProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "./Header";

export default function Layout({ children, onAddNew, onLogout, onImportCSV }) {
	const { session, loading: sessionLoading } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (!session && !sessionLoading) {
			router.push("/login");
		}
	}, [session, sessionLoading, router]);

	if (sessionLoading || !session) {
		return null;
	}

	return (
		<div className="min-h-screen container mx-auto px-4 md:px-6 lg:px-8">
			<Header
				onLogout={onLogout}
				onAddNew={onAddNew}
				onImportCSV={onImportCSV}
			/>
			<main className="pb-8">{children}</main>
		</div>
	);
}
