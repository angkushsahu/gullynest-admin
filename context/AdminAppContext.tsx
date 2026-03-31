"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import { AppContextType, ToastState, User, UserStatus, AdminDashboardResponse, initialDashboardData } from "./types";

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
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse>(initialDashboardData);

  useEffect(() => {
    (async function () {
      try {
        const response = await fetch("http://localhost:3000/api/admin/dashboard", { credentials: "include" });
        const data = await response.json() as AdminDashboardResponse;
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching user", error);
      }
    })();
  }, []);

  return (
    <AppContext.Provider value={{ showToast, dashboardData, user, userStatus }}>
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
