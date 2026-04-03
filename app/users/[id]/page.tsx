"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const ADMIN_API_BASE_URL = "";

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
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  pending: "badge-pending",
  live: "badge-live",
  rejected: "badge-rejected",
  draft: "badge-draft",
};
const TYPE_LABEL: Record<string, string> = {
  tenant: "Outgoing tenant",
  owner: "Owner",
  agent: "RERA Agent",
};

type UserDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  avatarUrl: string | null;
  kyc: { aadhaarDone: boolean; aadhaarFileUrl: string | null };
  packCount: number;
  packExpiry: string | null;
  agentSubExpiry: string | null;
  agentSubStart: string | null;
  createdAt: string;
  counts: { favorites: number; unlocks: number; listings: number };
  properties: Array<{
    id: string;
    title: string;
    status: "pending" | "live" | "rejected" | "draft";
    type: "tenant" | "owner" | "agent";
    rent: number;
    verified: boolean;
    locality: string | null;
    createdAt: string;
  }>;
};

export default function UserDetailPage() {
  const params = useParams();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    fetch(`${ADMIN_API_BASE_URL}/api/admin/users/${userId}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { item?: UserDetail }) => setUser(data.item ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="p-8 text-[#717171]">Loading…</div>;
  if (!user) return <div className="p-8 text-[#717171]">User not found</div>;

  const color = colorForId(user.id);
  const isAgent = user.agentSubExpiry !== null;
  const agentActive = isAgent && new Date(user.agentSubExpiry!) > new Date();

  return (
    <div className="p-8 animate-fade-up">
      {/* Back */}
      <Link
        href="/users"
        className="text-[13px] text-[#717171] no-underline hover:text-[#222] flex items-center gap-1.5 transition-colors mb-6 w-fit"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to users
      </Link>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 300px", alignItems: "start" }}>
        {/* LEFT */}
        <div>
          {/* Profile card */}
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-bold shrink-0"
                style={{ background: color.bg, color: color.tc }}
              >
                {initials(user.name)}
              </div>
              <div>
                <div className="text-[20px] font-bold leading-tight">{user.name}</div>
                <div className="text-[13px] text-[#717171] mt-0.5">{user.phone ?? user.email ?? "—"}</div>
                {user.isAdmin && (
                  <span className="text-[10px] font-semibold text-[#0066CC] bg-[#E8F0FB] px-2 py-0.5 rounded-full mt-1 inline-block">
                    Admin
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                ["Phone", user.phone ?? "—"],
                ["Email", user.email ?? "—"],
                ["Joined", shortDate(user.createdAt)],
                ["Favorites", String(user.counts.favorites)],
                ["Unlocks", String(user.counts.unlocks)],
                ["Pack count", String(user.packCount)],
                ...(user.packExpiry ? [["Pack expiry", shortDate(user.packExpiry)]] : []),
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-1">{label}</div>
                  <div className="text-[13px] font-medium">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Listings */}
          {user.properties.length > 0 && (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8E8E8]">
                <div className="text-[15px] font-semibold">Listings ({user.properties.length})</div>
              </div>
              <div
                className="grid bg-[#F7F7F7] border-b border-[#E8E8E8] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0]"
                style={{ gridTemplateColumns: "1fr 120px 80px 70px 80px" }}
              >
                {["Title", "Type", "Rent", "Status", "Action"].map((h) => <div key={h}>{h}</div>)}
              </div>
              {user.properties.map((p) => (
                <div
                  key={p.id}
                  className="grid items-center px-5 border-b border-[#E8E8E8] last:border-0 hover:bg-[#FAFAFA] transition-colors"
                  style={{ gridTemplateColumns: "1fr 120px 80px 70px 80px", minHeight: "56px" }}
                >
                  <div>
                    <div className="text-[13px] font-semibold leading-tight">{p.title}</div>
                    {p.locality && <div className="text-[11px] text-[#B0B0B0]">{p.locality}</div>}
                  </div>
                  <div className="text-[12px] text-[#717171]">{TYPE_LABEL[p.type]}</div>
                  <div className="text-[13px] font-semibold">
                    {p.rent >= 1000 ? `₹${Math.round(p.rent / 1000)}k` : `₹${p.rent}`}
                  </div>
                  <div>
                    <span className={`badge ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                  </div>
                  <Link
                    href={`/review/${p.id}`}
                    className="text-[12px] font-medium text-[#0066CC] no-underline hover:underline"
                  >
                    {p.status === "pending" ? "Review →" : "View"}
                  </Link>
                </div>
              ))}
            </div>
          )}

          {user.properties.length === 0 && (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl p-6 text-[13px] text-[#717171]">
              No listings submitted by this user.
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="sticky" style={{ top: "32px" }}>
          {/* KYC */}
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
            <div className="text-[14px] font-semibold mb-4">KYC status</div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] text-[#717171]">Aadhaar verified</div>
              <span className={`badge ${user.kyc.aadhaarDone ? "badge-live" : "badge-pending"}`}>
                {user.kyc.aadhaarDone ? "Verified" : "Not done"}
              </span>
            </div>
            {user.kyc.aadhaarFileUrl && (
              <a
                href={user.kyc.aadhaarFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-accent font-medium hover:underline"
              >
                View Aadhaar document →
              </a>
            )}
            {!user.kyc.aadhaarDone && !user.kyc.aadhaarFileUrl && (
              <p className="text-[12px] text-[#B0B0B0] mt-1">No document uploaded.</p>
            )}
          </div>

          {/* Agent pass */}
          {isAgent && (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
              <div className="text-[14px] font-semibold mb-4">Agent subscription</div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[13px] text-[#717171]">Status</div>
                <span className={`badge ${agentActive ? "badge-live" : "badge-rejected"}`}>
                  {agentActive ? "Active" : "Expired"}
                </span>
              </div>
              {user.agentSubStart && (
                <div className="mb-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-1">Started</div>
                  <div className="text-[13px] font-medium">{shortDate(user.agentSubStart)}</div>
                </div>
              )}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-1">
                  {agentActive ? "Expires" : "Expired"}
                </div>
                <div className="text-[13px] font-medium" style={{ color: agentActive ? "#222" : "#FF5A5F" }}>
                  {shortDate(user.agentSubExpiry!)}
                </div>
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5">
            <div className="text-[14px] font-semibold mb-4">Activity</div>
            {[
              ["Total listings", user.counts.listings],
              ["Favorites", user.counts.favorites],
              ["Unlocks", user.counts.unlocks],
            ].map(([label, val]) => (
              <div key={label as string} className="flex items-center justify-between py-2 border-b border-[#E8E8E8] last:border-0">
                <div className="text-[13px] text-[#717171]">{label}</div>
                <div className="text-[13px] font-semibold">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
