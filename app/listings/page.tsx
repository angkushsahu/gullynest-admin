"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useAdminListings, type Filter } from "@/hooks/useAdminListings";
import { useAdminApp } from "@/context/AdminAppContext";

const TYPE_BADGE: Record<string, string> = {
  tenant: "badge-tenant",
  owner: "badge-owner",
  agent: "badge-agent",
};
const TYPE_LABEL: Record<string, string> = {
  tenant: "Outgoing tenant",
  owner: "Owner",
  agent: "RERA Agent",
};
const STATUS_BADGE: Record<string, string> = {
  pending: "badge-pending",
  live: "badge-live",
  rejected: "badge-rejected",
  draft: "badge-draft",
};

function ListingsContent() {
  const {
    filter,
    setFilter,
    adminListings,
    searchQuery,
    setSearchQuery,
    counts,
    page,
    totalPages,
    setPage,
  } = useAdminListings();
  const { user } = useAdminApp();

  const filtered = adminListings.filter((l) => filter === "all" || l.status === filter);

  const tabs: Array<{ id: Filter; label: string; count: number }> = [
    { id: "pending", label: "Pending", count: counts.pending },
    { id: "all", label: "All", count: counts.all },
    { id: "live", label: "Live", count: counts.live },
    { id: "rejected", label: "Rejected", count: counts.rejected },
    { id: "draft", label: "Draft", count: counts.draft },
  ];

  return (
    <div className="p-8 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold" style={{ letterSpacing: "-0.3px" }}>
            {filter === "pending"
              ? "Pending review"
              : filter === "live"
                ? "Live listings"
                : filter === "rejected"
                  ? "Rejected"
                  : filter === "draft"
                    ? "Drafts"
                    : "All listings"}
          </h1>
          <div className="text-[14px] text-[#717171] mt-0.5">
            {filtered.length} listings
          </div>
        </div>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input py-2 px-4 rounded-full text-[13px] w-72"
          placeholder="Search by ID, lister, or type..."
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setFilter(tab.id);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium border-[1.5px] cursor-pointer transition-all font-[Sora,sans-serif] ${filter === tab.id ? "bg-[#222] text-white border-[#222]" : "bg-white text-[#717171] border-[#DDDDDD] hover:border-[#222]"}`}
          >
            {tab.label}
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${filter === tab.id ? "bg-white/20 text-white" : "bg-[#F0F0F0] text-[#717171]"}`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden">
        {/* Header */}
        <div
          className="grid items-center bg-[#F7F7F7] border-b border-[#E8E8E8] px-5 py-3"
          style={{ gridTemplateColumns: "1fr 140px 130px 80px 70px 90px 140px" }}
        >
          {["Listing", "Type", "Lister", "Rent", "Fee", "Status", "Actions"].map((h) => (
            <div
              key={h}
              className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0]"
            >
              {h}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-[14px] text-[#717171]">
            No listings in this category
          </div>
        )}

        {filtered.map((listing) => (
          <div
            key={listing.id}
            className={`grid items-center px-5 border-b border-[#E8E8E8] last:border-0 transition-colors hover:bg-[#FAFAFA] ${listing.status === "rejected" ? "opacity-60" : ""}`}
            style={{
              gridTemplateColumns: "1fr 140px 130px 80px 70px 90px 140px",
              minHeight: "64px",
            }}
          >
            <div className="flex items-center gap-3 py-2">
              <div
                className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-xl opacity-40 ${listing.photo}`}
              >
                🏠
              </div>
              <div>
                <div className="text-[13px] font-semibold leading-tight">
                  {listing.title}
                </div>
                <div className="text-[11px] text-[#B0B0B0]">
                  {listing.id} · {listing.submitted}
                </div>
              </div>
            </div>

            <div>
              <span className={`badge ${TYPE_BADGE[listing.type]}`}>
                {TYPE_LABEL[listing.type]}
              </span>
            </div>
            <div className="text-[13px] text-[#717171] truncate">{listing.lister}</div>
            <div className="text-[13px] font-semibold">
              {listing.rent >= 1000 ? `₹${Math.round(listing.rent / 1000)}k` : `₹${listing.rent}`}
            </div>
            <div
              className="text-[13px]"
              style={{ color: listing.fee > 0 ? "#B07D2A" : "#B0B0B0" }}
            >
              {listing.fee > 0 ? `₹${listing.fee / 1000}k` : "—"}
            </div>
            <div>
              <span className={`badge ${STATUS_BADGE[listing.status]}`}>
                {listing.status}
              </span>
            </div>

            <div className="flex items-center gap-2 py-2">
              {listing.status === "pending" ? (
                <Link
                  href={`/review/${listing.id}`}
                  className="text-[12px] font-semibold text-white px-3 py-1.5 rounded-lg no-underline hover:opacity-90 transition-opacity"
                  style={{ background: "#FF5A5F" }}
                >
                  Review →
                </Link>
              ) : listing.status === "draft" ? (
                listing.listerId === user?.id ? (
                  <Link
                    href={`/create?id=${listing.id}`}
                    className="text-[12px] font-semibold text-white px-3 py-1.5 rounded-lg no-underline hover:opacity-90 transition-opacity"
                    style={{ background: "#222" }}
                  >
                    Edit →
                  </Link>
                ) : (
                  <span
                    className="text-[12px] font-semibold text-[#B0B0B0] px-3 py-1.5 rounded-lg cursor-not-allowed"
                    title="Only the admin who created this draft can edit it"
                  >
                    Edit →
                  </span>
                )
              ) : (
                <>
                  {listing.status === "live" && listing.verified && (
                    <span className="text-[10px] font-semibold text-[#008A05] bg-[#EBFAEB] border border-[#CDECCF] px-2 py-1 rounded-full leading-none">
                      Verified
                    </span>
                  )}
                  <Link
                    href={`/review/${listing.id}`}
                    className="text-[12px] font-medium text-[#717171] no-underline hover:text-[#222]"
                  >
                    View
                  </Link>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 text-[13px] text-[#717171]">
        <span>Showing {filtered.length} listings</span>
        <div className="flex gap-1">
          {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-[13px] font-medium cursor-pointer transition-all border font-[Sora,sans-serif] ${p === page ? "bg-[#222] text-white border-[#222]" : "bg-white text-[#717171] border-[#DDDDDD] hover:border-[#222]"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminListings() {
  return (
    <Suspense fallback={<div className="p-8 text-[#717171]">Loading…</div>}>
      <ListingsContent />
    </Suspense>
  );
}
