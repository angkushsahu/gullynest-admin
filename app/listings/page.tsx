"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useAdminListings, type Filter } from "@/hooks/useAdminListings";

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
    approveAdminListing,
    rejectAdminListing,
    deleteAdminListing,
  } = useAdminListings();

  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = adminListings.filter((l) => filter === "all" || l.status === filter);

  const tabs: Array<{ id: Filter; label: string; count: number }> = [
    { id: "pending", label: "Pending", count: counts.pending },
    { id: "all", label: "All", count: counts.all },
    { id: "live", label: "Live", count: counts.live },
    { id: "rejected", label: "Rejected", count: counts.rejected },
    { id: "draft", label: "Draft", count: counts.draft },
  ];

  const toggleSelect = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  const selectAll = (check: boolean) =>
    setSelected(check ? filtered.map((l) => l.id) : []);

  const handleBulkApprove = () => {
    selected.forEach((id) => approveAdminListing(id));
    setSelected([]);
  };
  const handleBulkReject = () => {
    selected.forEach((id) => rejectAdminListing(id, "Bulk rejected"));
    setSelected([]);
  };
  const handleDelete = (id: string) => {
    deleteAdminListing(id);
    setConfirmDelete(null);
  };

  return (
    <div className="p-8 animate-fade-up">
      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-[360px] w-full mx-4 shadow-xl animate-scale-in">
            <h3 className="text-[16px] font-bold mb-2">Delete listing?</h3>
            <p className="text-[13px] text-[#717171] mb-5">
              This cannot be undone. The lister will not be notified.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn btn-outline btn-md flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="btn btn-primary btn-md flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
              setSelected([]);
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

      {/* Batch bar */}
      {selected.length > 0 && (
        <div className="bg-[#222] text-white rounded-xl px-5 py-3 flex items-center gap-4 mb-4 animate-slide-down">
          <span className="text-[13px] font-medium">{selected.length} selected</span>
          <button
            onClick={handleBulkApprove}
            className="text-[13px] font-semibold text-[#EBFAEB] bg-transparent border-0 cursor-pointer hover:text-white transition-colors font-[Sora,sans-serif]"
          >
            Approve all ✓
          </button>
          <button
            onClick={handleBulkReject}
            className="text-[13px] font-semibold text-[#FFD0D0] bg-transparent border-0 cursor-pointer hover:text-white transition-colors font-[Sora,sans-serif]"
          >
            Reject all ✗
          </button>
          <button
            onClick={() => setSelected([])}
            className="ml-auto text-[13px] text-white/60 bg-transparent border-0 cursor-pointer font-[Sora,sans-serif]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden">
        {/* Header */}
        <div
          className="grid items-center bg-[#F7F7F7] border-b border-[#E8E8E8] px-5 py-3"
          style={{ gridTemplateColumns: "32px 1fr 140px 130px 80px 70px 90px 140px" }}
        >
          <input
            type="checkbox"
            className="cursor-pointer accent-[#222] w-4 h-4"
            checked={selected.length === filtered.length && filtered.length > 0}
            onChange={(e) => selectAll(e.target.checked)}
          />
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
              gridTemplateColumns: "32px 1fr 140px 130px 80px 70px 90px 140px",
              minHeight: "64px",
            }}
          >
            <input
              type="checkbox"
              checked={selected.includes(listing.id)}
              onChange={() => toggleSelect(listing.id)}
              className="cursor-pointer accent-[#222] w-4 h-4"
            />

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
              <button
                onClick={() => setConfirmDelete(listing.id)}
                className="text-[12px] text-[#B0B0B0] bg-transparent border-0 cursor-pointer hover:text-accent transition-colors font-[Sora,sans-serif] p-0"
              >
                ✕
              </button>
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
