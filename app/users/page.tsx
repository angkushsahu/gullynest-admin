"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type UserTab = "searchers" | "listers" | "agents";

type AdminUserItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  isAdmin: boolean;
  packCount: number;
  packExpiry: string | null;
  createdAt: string;
  updatedAt: string;
  counts: {
    listings: number;
    favorites: number;
    unlocks: number;
    liveListings: number;
    pendingListings: number;
    agentListings: number;
    nonAgentListings: number;
  };
};

type UsersApiResponse = {
  items: AdminUserItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    type: UserTab | "all" | "admins";
    q: string;
  };
};

const ADMIN_API_BASE_URL = "http://localhost:3000";
const AVATAR_COLORS = [
  { bg: "#E1F5EE", tc: "#0F6E56" },
  { bg: "#EEEDFE", tc: "#3C3489" },
  { bg: "#FAEEDA", tc: "#854F0B" },
  { bg: "#E8F0FB", tc: "#185FA5" },
  { bg: "#EBFAEB", tc: "#005A03" },
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function colorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function shortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function AdminUsers() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = (searchParams.get("tab") || "searchers") as UserTab;
  const q = searchParams.get("q") || "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = 8;

  const [rows, setRows] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(q);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [counts, setCounts] = useState<Record<UserTab, number>>({
    searchers: 0,
    listers: 0,
    agents: 0,
  });

  const setSearch = useCallback(
    (patch: Partial<{ tab: UserTab; q: string; page: number }>) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (patch.tab) sp.set("tab", patch.tab);
      if (patch.q !== undefined) sp.set("q", patch.q);
      if (patch.page !== undefined) sp.set("page", String(Math.max(1, patch.page)));
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== q) {
        setSearch({ q: searchInput, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, searchInput, setSearch]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const sp = new URLSearchParams();
        sp.set("type", tab);
        sp.set("q", q);
        sp.set("page", String(page));
        sp.set("pageSize", String(pageSize));
        const r = await fetch(`${ADMIN_API_BASE_URL}/api/admin/users?${sp.toString()}`, {
          credentials: "include",
        });
        if (!r.ok) throw new Error("Failed to fetch users");
        const json = (await r.json()) as UsersApiResponse;
        setRows(json.items);
        setPagination(json.pagination);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchUsers();
  }, [page, pageSize, q, tab]);

  useEffect(() => {
    const fetchCounts = async () => {
      const tabs: UserTab[] = ["searchers", "listers", "agents"];
      const results = await Promise.all(
        tabs.map(async (t) => {
          const sp = new URLSearchParams();
          sp.set("type", t);
          sp.set("q", q);
          sp.set("page", "1");
          sp.set("pageSize", "1");
          const r = await fetch(`${ADMIN_API_BASE_URL}/api/admin/users?${sp.toString()}`, {
            credentials: "include",
          });
          if (!r.ok) return { t, total: 0 };
          const json = (await r.json()) as UsersApiResponse;
          return { t, total: json.pagination.total };
        })
      );
      setCounts(
        results.reduce(
          (acc, cur) => {
            acc[cur.t] = cur.total;
            return acc;
          },
          { searchers: 0, listers: 0, agents: 0 } as Record<UserTab, number>
        )
      );
    };
    void fetchCounts();
  }, [q]);

  const pageButtons = useMemo(() => {
    const total = Math.max(1, pagination.totalPages);
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [pagination.totalPages]);

  return (
    <div className="p-8 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold" style={{ letterSpacing: "-0.3px" }}>
            Users
          </h1>
          <div className="text-[14px] text-[#717171] mt-0.5">{pagination.total} registered users</div>
        </div>
        <div className="flex gap-2">
          <input
            className="input py-2 px-4 rounded-full text-[13px] w-56"
            placeholder="Search by name or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button className="btn btn-outline btn-sm">Export CSV</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6">
        {[
          { id: "searchers" as const, label: "Searchers", count: counts.searchers },
          { id: "listers" as const, label: "Listers", count: counts.listers },
          { id: "agents" as const, label: "Agents", count: counts.agents },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSearch({ tab: t.id, page: 1 })}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium border-[1.5px] cursor-pointer transition-all font-[Sora,sans-serif] ${tab === t.id ? "bg-[#222] text-white border-[#222]" : "bg-white text-[#717171] border-[#DDDDDD] hover:border-[#222]"}`}
          >
            {t.label}
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? "bg-white/20 text-white" : "bg-[#F0F0F0] text-[#717171]"}`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden">
        {tab === "searchers" && (
          <>
            <div
              className="grid bg-[#F7F7F7] border-b border-[#E8E8E8] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0]"
              style={{ gridTemplateColumns: "1fr 100px 80px 80px 100px 110px 80px" }}
            >
              {["User", "Joined", "Role", "Fav", "Unlocks", "Pack", "Action"].map((h) => (
                <div key={h}>{h}</div>
              ))}
            </div>
            {rows.map((u) => {
              const c = colorForId(u.id);
              return (
                <div
                  key={u.id}
                  className="grid items-center px-5 border-b border-[#E8E8E8] last:border-0 hover:bg-[#FAFAFA] transition-colors"
                  style={{
                    gridTemplateColumns: "1fr 100px 80px 80px 100px 110px 80px",
                    minHeight: "64px",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                      style={{ background: c.bg, color: c.tc }}
                    >
                      {initials(u.name)}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold">{u.name}</div>
                      <div className="text-[11px] text-[#B0B0B0]">{u.phone ?? u.email ?? "—"}</div>
                    </div>
                  </div>
                  <div className="text-[13px] text-[#717171]">{shortDate(u.createdAt)}</div>
                  <div className="text-[13px] font-semibold">{u.role ?? "—"}</div>
                  <div className="text-[13px]">{u.counts.favorites}</div>
                  <div className="text-[13px] font-semibold text-[#008A05]">{u.counts.unlocks}</div>
                  <div className="text-[13px] text-[#717171]">{u.packCount}</div>
                  <button className="text-[12px] font-medium text-[#0066CC] bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif] p-0">
                    View
                  </button>
                </div>
              );
            })}
          </>
        )}

        {tab === "listers" && (
          <>
            <div
              className="grid bg-[#F7F7F7] border-b border-[#E8E8E8] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0]"
              style={{ gridTemplateColumns: "1fr 140px 80px 60px 70px 80px 80px" }}
            >
              {["User", "Type", "Listings", "Live", "Pending", "Joined", "Action"].map(
                (h) => (
                  <div key={h}>{h}</div>
                )
              )}
            </div>
            {rows.map((u) => {
              const c = colorForId(u.id);
              const listerType = u.counts.agentListings > 0 ? "Agent + Lister" : "Lister";
              return (
                <div
                  key={u.id}
                  className="grid items-center px-5 border-b border-[#E8E8E8] last:border-0 hover:bg-[#FAFAFA] transition-colors"
                  style={{
                    gridTemplateColumns: "1fr 140px 80px 60px 70px 80px 80px",
                    minHeight: "64px",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                      style={{ background: c.bg, color: c.tc }}
                    >
                      {initials(u.name)}
                    </div>
                    <div className="text-[13px] font-semibold">{u.name}</div>
                  </div>
                  <div className="text-[12px] text-[#717171]">{listerType}</div>
                  <div className="text-[13px] font-semibold">{u.counts.listings}</div>
                  <div className="text-[13px] font-semibold text-[#008A05]">{u.counts.liveListings}</div>
                  <div className="text-[13px] font-semibold text-[#B07D2A]">
                    {u.counts.pendingListings}
                  </div>
                  <div className="text-[13px] text-[#717171]">{shortDate(u.createdAt)}</div>
                  <button className="text-[12px] font-medium text-[#0066CC] bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif] p-0">
                    View
                  </button>
                </div>
              );
            })}
          </>
        )}

        {tab === "agents" && (
          <>
            <div
              className="grid bg-[#F7F7F7] border-b border-[#E8E8E8] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0]"
              style={{ gridTemplateColumns: "1fr 200px 100px 120px 100px 120px" }}
            >
              {["Agent", "RERA No.", "Status", "Listings", "Expiry", "Action"].map(
                (h) => (
                  <div key={h}>{h}</div>
                )
              )}
            </div>
            {rows.map((a) => {
              const status = a.counts.agentListings > 0 ? "Active" : "Expired";
              return (
                <div
                  key={a.id}
                  className="grid items-center px-5 border-b border-[#E8E8E8] last:border-0 hover:bg-[#FAFAFA] transition-colors"
                  style={{
                    gridTemplateColumns: "1fr 200px 100px 120px 100px 120px",
                    minHeight: "64px",
                    opacity: status === "Expired" ? 0.6 : 1,
                  }}
                >
                  <div className="text-[13px] font-semibold">{a.name}</div>
                  <div className="text-[11px] text-[#717171] font-mono truncate">
                    {a.email ?? "—"}
                  </div>
                  <div>
                    <span
                      className={`badge ${status === "Active" ? "badge-live" : "badge-rejected"}`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="text-[13px]">
                    {a.counts.agentListings}/{a.counts.listings || a.counts.agentListings}
                  </div>
                  <div
                    className="text-[13px]"
                    style={{ color: status === "Expired" ? "#FF5A5F" : "#717171" }}
                  >
                    {a.packExpiry ? shortDate(a.packExpiry) : "—"}
                  </div>
                  <div className="flex gap-2">
                    <button className="text-[12px] font-medium text-[#0066CC] bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif] p-0">
                      View
                    </button>
                    <button className="text-[12px] font-medium text-accent bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif] p-0">
                      Suspend
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
      {loading ? (
        <div className="text-[13px] text-[#717171] mt-4">Loading users…</div>
      ) : (
        <div className="flex items-center justify-between mt-4 text-[13px] text-[#717171]">
          <span>Showing {rows.length} of {pagination.total}</span>
          <div className="flex gap-1">
            {pageButtons.map((p) => (
              <button
                key={p}
                onClick={() => setSearch({ page: p })}
                className={`w-8 h-8 rounded-lg text-[13px] font-medium cursor-pointer transition-all border font-[Sora,sans-serif] ${p === pagination.page ? "bg-[#222] text-white border-[#222]" : "bg-white text-[#717171] border-[#DDDDDD] hover:border-[#222]"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
