"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";

import { AppContextType, ToastState, User, UserStatus, AdminDashboardResponse, initialDashboardData } from "./types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AdminAppProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  // Toast state
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [toastId, setToastId] = useState(0);

  const showToast = useCallback(
    (message: string, type: ToastState["type"] = "success") => {
      const id = toastId + 1;
      setToastId(id);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    },
    [toastId]
  );

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus>("loading");

  const fetchAdminUser = useCallback(async () => {
    setUserStatus("loading");
    try {
      const response = await fetch("http://localhost:3000/api/admin", { credentials: "include" });
      if (!response.ok) {
        setUser(null);
        setUserStatus("unauthenticated");
        return;
      }
      const data = (await response.json()) as User;
      setUser(data);
      setUserStatus("authenticated");
    } catch {
      setUser(null);
      setUserStatus("unauthenticated");
    }
  }, []);

  // Sidebar state
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse>(initialDashboardData);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3000/api/admin/dashboard", { credentials: "include" });
      if (!response.ok) return;
      const data = (await response.json()) as AdminDashboardResponse;
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard", error);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setUserStatus("unauthenticated");
      return;
    }

    let active = true;
    (async function bootstrap() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) {
        setUserStatus("unauthenticated");
        setUser(null);
        return;
      }
      await fetchAdminUser();
      await fetchDashboard();
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (!session) {
        setUser(null);
        setDashboardData(initialDashboardData);
        setUserStatus("unauthenticated");
        return;
      }
      await fetchAdminUser();
      await fetchDashboard();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchAdminUser, fetchDashboard, supabase]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      showToast("Supabase env is missing for Google auth", "error");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/")}`,
      },
    });
    if (error) showToast(error.message, "error");
  }, [showToast, supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setDashboardData(initialDashboardData);
    setUserStatus("unauthenticated");
  }, [supabase]);

  return (
    <AppContext.Provider value={{ dashboardData, showToast, signInWithGoogle, signOut, toasts, user, userStatus,  }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAdminApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAdminApp must be used within an AdminAppProvider");
  }
  return context;
}
