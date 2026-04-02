"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type Filter = "pending" | "live" | "rejected" | "all";
type ApiStatus = "pending" | "live" | "rejected" | "draft" | "all";

type TabCounts = { pending: number; live: number; rejected: number; all: number };

type ApiAdminProperty = {
  id: string;
  title: string;
  lister: string;
  phone: string;
  type: "tenant" | "owner" | "agent";
  rent: number;
  fee: number;
  status: "pending" | "live" | "rejected" | "draft";
  submitted: string;
  verified: boolean;
  honest: boolean;
  photoUrl: string | null;
  locality: string;
  updatedAt: string;
};

type AdminListing = {
  id: string;
  title: string;
  lister: string;
  phone: string;
  type: "tenant" | "owner" | "agent";
  rent: number;
  fee: number;
  status: "pending" | "live" | "rejected";
  submitted: string;
  photo: string;
  answers: number;
  honest: boolean;
  verified: boolean;
};

type ApiListResponse = {
  items: ApiAdminProperty[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: { status: ApiStatus; q: string };
};

type PaginationState = ApiListResponse["pagination"];

const ADMIN_API_BASE_URL = "http://localhost:3000";
const PHOTO_PLACEHOLDERS = ["ph-a", "ph-b", "ph-c", "ph-d", "ph-e", "ph-f", "ph-g", "ph-h"] as const;

function placeholderPhoto(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PHOTO_PLACEHOLDERS[hash % PHOTO_PLACEHOLDERS.length];
}

function mapApiToUiListing(p: ApiAdminProperty): AdminListing {
  return {
    id: p.id,
    title: p.title,
    lister: p.lister,
    phone: p.phone,
    type: p.type,
    rent: p.rent,
    fee: p.fee,
    status: p.status === "draft" ? "pending" : p.status,
    submitted: p.submitted,
    photo: placeholderPhoto(p.id),
    answers: 0,
    honest: p.honest,
    verified: p.verified,
  };
}

function mapFilterToApiStatus(filter: Filter): ApiStatus {
  if (filter === "all") return "all";
  return filter;
}

function getInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function useAdminListings() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filter = (searchParams.get("filter") || "pending") as Filter;
  const searchQuery = (searchParams.get("q") || "").trim();
  const page = getInt(searchParams.get("page"), 1);
  const pageSize = Math.min(getInt(searchParams.get("pageSize") ?? searchParams.get("limit"), 8), 100);

  const [adminListings, setAdminListings] = useState<AdminListing[]>([]);
  const [counts, setCounts] = useState<TabCounts>({ pending: 0, live: 0, rejected: 0, all: 0 });
  const [pagination, setPagination] = useState<PaginationState>({
    page,
    pageSize,
    total: 0,
    totalPages: 1,
  });

  type CacheEntry = { items: AdminListing[]; pagination: PaginationState };
  const cacheRef = useRef(new Map<string, CacheEntry>());
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQueryKey = useMemo(() => {
    return JSON.stringify({ filter, page, pageSize, q: searchQuery });
  }, [filter, page, pageSize, searchQuery]);

  const fetchList = useCallback(
    async (opts: { filter: Filter; page: number; pageSize: number; q: string }) => {
      const apiStatus = mapFilterToApiStatus(opts.filter);
      const qs = new URLSearchParams();
      qs.set("page", String(opts.page));
      qs.set("pageSize", String(opts.pageSize));
      // backend expects `status`
      qs.set("status", apiStatus);
      if (opts.q.trim()) qs.set("q", opts.q.trim());

      const url = `${ADMIN_API_BASE_URL}/api/admin/properties?${qs.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch admin listings (${res.status})`);
      }
      const json = (await res.json()) as ApiListResponse;

      const items = json.items
        // UI only supports pending/live/rejected
        .filter((x) => x.status !== "draft")
        .filter((x) => opts.filter === "all" || x.status === opts.filter)
        .map(mapApiToUiListing);

      return {
        items,
        pagination: json.pagination,
      };
    },
    []
  );

  const fetchTabCounts = useCallback(async () => {
    const statuses: Array<"pending" | "live" | "rejected"> = ["pending", "live", "rejected"];

    const results = await Promise.all(
      statuses.map(async (st) => {
        const apiStatus = mapFilterToApiStatus(st);
        const qs = new URLSearchParams();
        qs.set("page", "1");
        qs.set("pageSize", "1"); // just to get pagination.total
        qs.set("status", apiStatus);
        if (searchQuery) qs.set("q", searchQuery);

        const url = `${ADMIN_API_BASE_URL}/api/admin/properties?${qs.toString()}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return { status: st, total: 0 };
        const json = (await res.json()) as ApiListResponse;
        return { status: st, total: json.pagination.total };
      })
    );

    const byStatus = results.reduce<Record<"pending" | "live" | "rejected", number>>(
      (acc, cur) => {
        acc[cur.status] = cur.total;
        return acc;
      },
      { pending: 0, live: 0, rejected: 0 }
    );

    setCounts({
      pending: byStatus.pending,
      live: byStatus.live,
      rejected: byStatus.rejected,
      all: byStatus.pending + byStatus.live + byStatus.rejected,
    });
  }, [searchQuery]);

  const refreshNow = useCallback(
    async (prefetchNext: boolean, force = false) => {
      const key = currentQueryKey;
      if (!force && cacheRef.current.has(key)) {
        const cached = cacheRef.current.get(key)!;
        setAdminListings(cached.items);
        setPagination(cached.pagination);
      } else {
        const entry = await fetchList({ filter, page, pageSize, q: searchQuery });
        cacheRef.current.set(key, entry);
        setAdminListings(entry.items);
        setPagination(entry.pagination);
      }
      // Counts are global and not dependent on page, so refresh them too.
      await fetchTabCounts();

      if (prefetchNext) {
        const nextPage = page + 1;
        const nextKey = JSON.stringify({ filter, page: nextPage, pageSize });
        if (!cacheRef.current.has(nextKey)) {
          fetchList({ filter, page: nextPage, pageSize, q: searchQuery })
            .then((entry) => cacheRef.current.set(nextKey, entry))
            .catch(() => {
              /* ignore prefetch failures */
            });
        }
      }
    },
    [currentQueryKey, fetchList, fetchTabCounts, filter, page, pageSize, searchQuery]
  );

  const scheduleRefresh = useCallback(
    (prefetchNext = true) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        // After mutations we want fresh data, so bypass cached entries.
        void refreshNow(prefetchNext, true);
      }, 250);
    },
    [refreshNow]
  );

  useEffect(() => {
    void refreshNow(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, pageSize, searchQuery]);

  const mutate = useCallback(
    async (propertyId: string, body: Record<string, unknown>, method: "PATCH" | "PUT" | "DELETE") => {
      const url = `${ADMIN_API_BASE_URL}/api/admin/properties/${encodeURIComponent(propertyId)}`;
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: method === "DELETE" ? undefined : JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`Mutation failed (${res.status})`);
      }
      scheduleRefresh(true);
    },
    [scheduleRefresh]
  );

  const approveAdminListing = useCallback(
    async (id: string, verified: boolean = true) => {
      await mutate(id, { action: "approve", verified }, "PATCH");
    },
    [mutate]
  );

  const rejectAdminListing = useCallback(
    async (id: string, _reason: string) => {
      // Reason is currently not persisted server-side; kept for UI compatibility.
      void _reason;
      await mutate(id, { action: "reject" }, "PATCH");
    },
    [mutate]
  );

  const deleteAdminListing = useCallback(
    async (id: string) => {
      await mutate(id, {}, "DELETE");
    },
    [mutate]
  );

  const setFilterAndSyncUrl = useCallback(
    (next: Filter) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("filter", next);
      sp.set("page", "1"); // reset pagination when filter changes
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const setPageAndSyncUrl = useCallback(
    (nextPage: number) => {
      const safe = nextPage > 0 ? nextPage : 1;
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("page", String(safe));
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const setSearchQueryAndSyncUrl = useCallback(
    (nextQuery: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      const value = nextQuery.trim();
      if (value) sp.set("q", value);
      else sp.delete("q");
      sp.set("page", "1");
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return {
    filter,
    searchQuery,
    adminListings,
    counts,
    page,
    pageSize,
    totalPages: pagination.totalPages,
    pagination,
    setFilter: setFilterAndSyncUrl,
    setSearchQuery: setSearchQueryAndSyncUrl,
    setPage: setPageAndSyncUrl,
    approveAdminListing,
    rejectAdminListing,
    deleteAdminListing,
  };
}

