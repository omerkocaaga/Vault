"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
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
		});

		return () => subscription.unsubscribe();
	}, []);

	const value = {
		session,
		loading,
	};

	return (
		<SessionContext.Provider value={value}>
			{!loading && children}
		</SessionContext.Provider>
	);
}

export function useSession() {
	const context = useContext(SessionContext);
	if (context === undefined) {
		throw new Error("useSession must be used within a SessionProvider");
	}
	return context;
}
