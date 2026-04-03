"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Listing, Room, LISTINGS, ROOMS } from "@/lib/data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
export type UserRole = "searcher" | "lister" | null;

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  email?: string;
  packCount: number;
  packExpiry: string | null;
  unlockedIds: string[];
  savedIds: string[];
  isAdmin?: boolean;
}

export interface ListingFormData {
  type: "tenant" | "owner" | "agent" | null;
  flatType: "flat" | "room";
  locality: string;
  placeId: string;
  lat: number | null;
  lng: number | null;
  bhk: string;
  floor: string;
  totalFloors: string;
  furnishing: string;
  rent: string;
  serviceFee: string;
  availableFrom: string;
  answers: string[];
  honestDisclosures: boolean[];
  name: string;
  phone: string;
  photoCount: number;
  reraNo: string;
  brokerageType: "months" | "fixed" | "none";
  brokerageMonths: string;
  brokerageAmount: string;
  brokerageNegotiable: boolean;
}

export interface ToastState {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface AppContextType {
  user: User | null;
  userLoaded: boolean;
  apiDbEnabled: boolean;
  setUser: (u: User | null) => void;
  refreshUser: () => Promise<void>;
  isAuthOpen: boolean;
  openAuth: (redirect?: string, initialStep?: "phone" | "role") => void;
  authInitialStep: "phone" | "role";
  closeAuth: () => void;
  authRedirect: string;
  signOut: () => Promise<void>;
  needsProfile: boolean;
  setNeedsProfile: (v: boolean) => void;
  listings: Listing[];
  rooms: Room[];
  savedIds: string[];
  toggleSave: (id: string) => Promise<void>;
  unlockListing: (id: string) => Promise<boolean>;
  isUnlocked: (id: string) => boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilters: string[];
  toggleFilter: (f: string) => void;
  clearFilters: () => void;
  flatType: "flat" | "room";
  setFlatType: (t: "flat" | "room") => void;
  form: ListingFormData;
  updateForm: (data: Partial<ListingFormData>) => void;
  resetForm: () => void;
  toasts: ToastState[];
  showToast: (msg: string, type?: ToastState["type"]) => void;
  adminListings: any[];
  submitListing: (form: ListingFormData, user: User) => void;
  approveAdminListing: (id: string, verified?: boolean) => void;
  rejectAdminListing: (id: string, reason: string) => void;
  deleteAdminListing: (id: string) => void;
}

const DEFAULT_FORM: ListingFormData = {
  type: null,
  flatType: "flat",
  locality: "",
  placeId: "",
  lat: null,
  lng: null,
  bhk: "2 BHK",
  floor: "",
  totalFloors: "",
  furnishing: "Semi-furnished",
  rent: "",
  serviceFee: "",
  availableFrom: "",
  answers: Array(5).fill(""),
  honestDisclosures: Array(5).fill(false),
  name: "",
  phone: "",
  photoCount: 0,
  reraNo: "",
  brokerageType: "months",
  brokerageMonths: "1",
  brokerageAmount: "",
  brokerageNegotiable: false,
};

import { ADMIN_LISTINGS_DATA } from "@/lib/data";
import { useRouter } from "next/navigation";

const AppContext = createContext<AppContextType | null>(null);

type MeResponse = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  packCount: number;
  packExpiry: string | null;
  isAdmin: boolean;
  favoriteIds: string[];
  unlockedIds: string[];
  profileComplete?: boolean;
} | null;

function mapMeToUser(data: NonNullable<MeResponse>): User {
  return {
    id: data.id,
    name: data.name,
    phone: data.phone?.trim() ? data.phone : "—",
    email: data.email ?? undefined,
    role: (data.role as UserRole) ?? null,
    packCount: data.packCount,
    packExpiry: data.packExpiry,
    unlockedIds: data.unlockedIds,
    savedIds: data.favoriteIds,
    isAdmin: data.isAdmin,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [apiDbEnabled, setApiDbEnabled] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authRedirect, setAuthRedirect] = useState("/");
  const [authInitialStep, setAuthInitialStep] = useState<"phone" | "role">("phone");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [flatType, setFlatType] = useState<"flat" | "room">("flat");
  const [form, setForm] = useState<ListingFormData>(DEFAULT_FORM);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [toastId, setToastId] = useState(0);
  const [adminListings, setAdminListings] = useState(ADMIN_LISTINGS_DATA);

  const router = useRouter();

  const showToast = useCallback(
    (message: string, type: ToastState["type"] = "success") => {
      const id = toastId + 1;
      setToastId(id);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    },
    [toastId]
  );

  const loadLocalFallback = useCallback(() => {
    try {
      const saved = localStorage.getItem("gn_user");
      if (saved) {
        const u: User = JSON.parse(saved);
        if (u.packExpiry && new Date(u.packExpiry) < new Date()) {
          u.packCount = 0;
          u.packExpiry = null;
          localStorage.setItem("gn_user", JSON.stringify(u));
        }
        setUserState(u);
        setSavedIds(u.savedIds ?? []);
      }
      const savedList = localStorage.getItem("gn_saved");
      if (savedList) setSavedIds(JSON.parse(savedList));
    } catch {
      /* ignore */
    }
  }, []);

  const openAuth = useCallback(
    (redirect = "/", initialStep: "phone" | "role" = "phone") => {
      setAuthRedirect(redirect);
      setAuthInitialStep(initialStep);
      setIsAuthOpen(true);
    },
    []
  );

  const closeAuth = useCallback(() => setIsAuthOpen(false), []);

  const refreshUser = useCallback(async () => {
    try {
      const r = await fetch("/api/me", { credentials: "same-origin" });
      if (r.status === 503) {
        setApiDbEnabled(false);
        const supabase = createSupabaseBrowserClient();
        if (supabase) {
          const {
            data: { user: su },
          } = await supabase.auth.getUser();
          if (su) {
            const display =
              (su.user_metadata?.full_name as string | undefined) ??
              (su.user_metadata?.name as string | undefined) ??
              su.email?.split("@")[0] ??
              "Guest";
            let localSaved: string[] = [];
            try {
              const raw = localStorage.getItem("gn_saved");
              if (raw) localSaved = JSON.parse(raw) as string[];
            } catch {
              /* ignore */
            }
            setUserState({
              id: su.id,
              name: display,
              phone: su.phone ?? "—",
              email: su.email ?? undefined,
              role: "searcher",
              packCount: 0,
              packExpiry: null,
              unlockedIds: [],
              savedIds: localSaved,
              isAdmin: false,
            });
            setSavedIds(localSaved);
            setNeedsProfile(false);
            return;
          }
        }
        loadLocalFallback();
        return;
      }
      if (!r.ok) {
        // 4xx / 5xx — treat as unauthenticated, don't attempt to parse body
        setUserState(null);
        setSavedIds([]);
        return;
      }
      setApiDbEnabled(true);
      const data: MeResponse = await r.json();
      if (!data) {
        setUserState(null);
        setSavedIds([]);
        return;
      }
      const u = mapMeToUser(data);
      setUserState(u);
      setSavedIds(data.favoriteIds);
      setNeedsProfile(!data.profileComplete);
      if (!data.profileComplete) openAuth("/", "role");
    } catch {
      setApiDbEnabled(false);
      loadLocalFallback();
    }
  }, [loadLocalFallback, openAuth]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const init = async () => {
      try {
        if (!supabase) {
          loadLocalFallback();
          return;
        }
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) await refreshUser();
        else {
          setUserState(null);
          setSavedIds([]);
        }
      } catch {
        loadLocalFallback();
      } finally {
        if (!cancelled) setUserLoaded(true);
      }
    };

    void init();

    if (!supabase) {
      return () => {
        cancelled = true;
      };
    }

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_OUT" || !session) {
          setUserState(null);
          setSavedIds([]);
          return;
        }
        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          await refreshUser();
        }
      }
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadLocalFallback, refreshUser]);

  const setUser = useCallback(
    (u: User | null) => {
      setUserState(u);
      if (!apiDbEnabled) {
        if (u) localStorage.setItem("gn_user", JSON.stringify(u));
        else localStorage.removeItem("gn_user");
      }
    },
    [apiDbEnabled]
  );

  const signOut = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setUserState(null);
    setSavedIds([]);
    localStorage.removeItem("gn_user");
    localStorage.removeItem("gn_saved");
    showToast("Signed out successfully");
    router.push("/");
  }, [showToast, openAuth]);

  const toggleSave = useCallback(
    async (id: string) => {
      const isSaved = savedIds.includes(id);
      if (!user) {
        openAuth();
        return;
      }
      if (apiDbEnabled) {
        // Optimistic update — flip immediately, revert on failure
        const optimistic = isSaved ? savedIds.filter((i) => i !== id) : [...savedIds, id];
        setSavedIds(optimistic);
        showToast(
          !isSaved ? "Saved ♡" : "Removed from saved",
          !isSaved ? "success" : "info"
        );
        try {
          const r = await fetch("/api/favorites", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId: id, save: !isSaved }),
          });
          if (!r.ok) throw new Error("save_failed");
          const j = await r.json();
          setSavedIds(j.favoriteIds);
        } catch {
          setSavedIds(savedIds); // revert
          showToast("Could not update favourites", "error");
        }
        return;
      }
      setSavedIds((prev) => {
        const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
        localStorage.setItem("gn_saved", JSON.stringify(next));
        if (user) {
          const nextUser = { ...user, savedIds: next };
          setUserState(nextUser);
          localStorage.setItem("gn_user", JSON.stringify(nextUser));
        }
        return next;
      });
      showToast(isSaved ? "Removed from saved" : "Saved ♡", isSaved ? "info" : "success");
    },
    [apiDbEnabled, openAuth, savedIds, showToast, user]
  );

  const unlockListing = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;
      if (apiDbEnabled) {
        try {
          const r = await fetch("/api/unlocks", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId: id }),
          });
          const j = await r.json();
          if (!r.ok) return false;
          setUserState((prev) =>
            prev
              ? {
                  ...prev,
                  packCount: j.packCount ?? prev.packCount,
                  unlockedIds: j.unlockedIds ?? prev.unlockedIds,
                }
              : null
          );
          return true;
        } catch {
          return false;
        }
      }
      if (user.unlockedIds.includes(id)) return true;
      if (user.packCount <= 0) return false;
      const updated = {
        ...user,
        packCount: user.packCount - 1,
        unlockedIds: [...user.unlockedIds, id],
      };
      setUserState(updated);
      localStorage.setItem("gn_user", JSON.stringify(updated));
      return true;
    },
    [apiDbEnabled, user]
  );

  const isUnlocked = useCallback(
    (id: string) => user?.unlockedIds.includes(id) ?? false,
    [user]
  );

  const toggleFilter = useCallback((f: string) => {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }, []);

  const clearFilters = useCallback(() => setActiveFilters([]), []);

  const updateForm = useCallback((data: Partial<ListingFormData>) => {
    setForm((prev) => ({ ...prev, ...data }));
  }, []);

  const resetForm = useCallback(() => setForm(DEFAULT_FORM), []);

  const submitListing = useCallback((submitted: ListingFormData, submitter: User) => {
    const id = `GN-${Date.now().toString().slice(-4)}`;
    const title =
      submitted.flatType === "flat"
        ? `${submitted.bhk} · ${submitted.locality}`
        : `Room · ${submitted.locality}`;
    const newListing = {
      id,
      title,
      lister: submitter.name,
      phone: submitter.phone,
      type: (submitted.type || "tenant") as import("@/lib/data").ListingType,
      rent: parseInt(submitted.rent) || 0,
      fee: parseInt(submitted.serviceFee) || 0,
      status: "pending",
      submitted: "Just now",
      photo: "ph-a",
      answers: submitted.answers.filter((a: string) => a.trim()).length,
      honest: submitted.honestDisclosures.some(Boolean),
      verified: false,
      reraNo: submitted.reraNo || undefined,
      brokerageType: submitted.brokerageType,
      brokerageMonths: parseFloat(submitted.brokerageMonths) || undefined,
      brokerageAmount: parseInt(submitted.brokerageAmount) || undefined,
      brokerageNegotiable: submitted.brokerageNegotiable,
    };
    setAdminListings((prev) => [newListing, ...prev]);
  }, []);

  const approveAdminListing = useCallback(
    (listingId: string, verified = false) => {
      setAdminListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: "live", verified } : l))
      );
      showToast("Listing approved and live ✓", "success");
    },
    [showToast]
  );

  const rejectAdminListing = useCallback(
    (listingId: string, reason: string) => {
      setAdminListings((prev) =>
        prev.map((l) =>
          l.id === listingId ? { ...l, status: "rejected", rejectReason: reason } : l
        )
      );
      showToast("Listing rejected", "error");
    },
    [showToast]
  );

  const deleteAdminListing = useCallback(
    (listingId: string) => {
      setAdminListings((prev) => prev.filter((l) => l.id !== listingId));
      showToast("Listing deleted");
    },
    [showToast]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        userLoaded,
        apiDbEnabled,
        setUser,
        refreshUser,
        isAuthOpen,
        openAuth,
        closeAuth,
        authRedirect,
        authInitialStep,
        signOut,
        needsProfile,
        setNeedsProfile,
        listings: LISTINGS,
        rooms: ROOMS,
        savedIds,
        toggleSave,
        unlockListing,
        isUnlocked,
        searchQuery,
        setSearchQuery,
        activeFilters,
        toggleFilter,
        clearFilters,
        flatType,
        setFlatType,
        form,
        updateForm,
        resetForm,
        toasts,
        showToast,
        adminListings,
        submitListing,
        approveAdminListing,
        rejectAdminListing,
        deleteAdminListing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  // if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
