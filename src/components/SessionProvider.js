"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SessionContext = createContext({});

export const useSession = () => {
	return useContext(SessionContext);
};

export default function SessionProvider({ children }) {
	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		console.log("SessionProvider: Initializing...");

		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			console.log("SessionProvider: Initial session:", session);
			setSession(session);
			setLoading(false);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			console.log("SessionProvider: Auth state changed:", _event, session);
			setSession(session);
			setLoading(false);
			router.refresh();
		});

		return () => {
			subscription?.unsubscribe();
		};
	}, [router]);

	const value = {
		session,
		loading,
		signOut: () => supabase.auth.signOut(),
	};

	if (loading) {
		return null; // or a loading spinner
	}

	return (
		<SessionContext.Provider value={value}>{children}</SessionContext.Provider>
	);
}
