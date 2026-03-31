"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

interface AdminSidebarResponse {
  pendingListings: number;
  liveListings: number;
  rejectedListings: number;
  totalListings: number;
  agents: number;
  searchers: number;
  listers: number;
  totalUsers: number;
}

interface User {
  id: string;
  supabaseId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  packCount: number;
  packExpiry: string | null;
}

type UserStatus = "authenticated" | "unauthenticated" | "loading";

export interface ToastState {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface AppContextType {
  sidebarData: AdminSidebarResponse;
  showToast: (message: string, type: ToastState["type"]) => void;
  user: User | null;
  userStatus: UserStatus;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AdminAppProvider({ children }: { children: React.ReactNode }) {
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

  useEffect(() => {
    (async function () {
      setUserStatus("loading");

      try {
        const response = await fetch("http://localhost:3000/api/admin", { credentials: "include" });
        const data = await response.json() as User;
        setUser(data);

        setUserStatus("authenticated");
      } catch (error) {
        setUserStatus("unauthenticated");
      }
    })();
  }, []);

  // Sidebar state
  const [sidebarData, setSidebarData] = useState<AdminSidebarResponse>({
    pendingListings: 0,
    liveListings: 0,
    rejectedListings: 0,
    totalListings: 0,
    agents: 0,
    searchers: 0,
    listers: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    (async function () {
      try {
        const response = await fetch("http://localhost:3000/api/admin/dashboard", { credentials: "include" });
        const data = await response.json() as AdminSidebarResponse;
        setSidebarData(data);
      } catch (error) {
        console.error("Error fetching user", error);
      }
    })();
  }, []);

  return (
    <AppContext.Provider value={{ showToast, sidebarData, user, userStatus }}>
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
