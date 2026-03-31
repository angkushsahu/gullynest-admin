"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { INSIDER_QA } from "@/lib/data";
import { useAdminListings } from "@/hooks/useAdminListings";
import { useAdminApp } from "@/context/AdminAppContext";

const CHECKLIST_ITEMS = [
  "Phone number is real and reachable",
  "Photos are genuine and match description",
  "No contact info hidden in listing text or photos",
  "Not a duplicate listing",
  "Rent amount is plausible for this locality",
  "Insider answers are genuinely informative",
  "Service fee is within reasonable range (if applicable)",
];

type ReviewListing = {
  id: string;
  title: string;
  lister: string;
  phone: string;
  type: "tenant" | "owner" | "agent";
  rent: number;
  fee: number;
  status: "pending" | "live" | "rejected" | "draft";
  submitted: string;
  answers: number;
  honest: boolean;
  verified: boolean;
};

export default function AdminReview() {
  const params = useParams();
  const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [listing, setListing] = useState<ReviewListing | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    approveAdminListing,
    rejectAdminListing,
  } = useAdminListings();
  const { showToast } = useAdminApp();

  useEffect(() => {
    const fetchListing = async () => {
      if (!propertyId) {
        setListing(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/admin/properties/${propertyId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        setListing(null);
        setLoading(false);
        return;
      }
      const data = (await response.json()) as { item?: ReviewListing };
      setListing(data.item ?? null);
      setLoading(false);
    };
    fetchListing().catch(console.error);
  }, [propertyId]);

  const [checklist, setChecklist] = useState<boolean[]>(Array(7).fill(false));
  const [verifiedBadge, setVerifiedBadge] = useState(false);
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"none" | "edit" | "reject">("none");
  const [rejectReason, setRejectReason] = useState("");
  const [editMsg, setEditMsg] = useState(
    `Hi ${listing?.lister?.split(" ")[0] || "there"}, your listing looks good but we need a few changes:`
  );
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!listing) return;
    setEditMsg(`Hi ${listing.lister?.split(" ")[0] || "there"}, your listing looks good but we need a few changes:`);
  }, [listing]);

  if (loading) return <div className="p-8 text-[#717171]">Loading listing…</div>;
  if (!listing) return <div className="p-8 text-[#717171]">Listing not found</div>;

  const checkAll = checklist.every(Boolean);
  const checkedCount = checklist.filter(Boolean).length;

  const handleApprove = () => {
    approveAdminListing(listing.id, verifiedBadge);
    setApproved(true);
    setTimeout(() => router.push("/listings"), 1500);
  };

  const handleReject = () => {
    if (!rejectReason) {
      showToast("Please select a rejection reason", "error");
      return;
    }
    rejectAdminListing(listing.id, rejectReason);
    setTimeout(() => router.push("/listings"), 1000);
  };

  if (approved) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center animate-bounce-soft">
          <div className="w-20 h-20 rounded-full bg-[#EBFAEB] border-2 border-[#008A05] flex items-center justify-center mx-auto mb-4 text-4xl">
            ✓
          </div>
          <div className="text-[20px] font-bold text-[#008A05]">
            Listing approved and live!
          </div>
          <div className="text-[14px] text-[#717171] mt-2">Redirecting to queue…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/listings"
            className="text-[13px] text-[#717171] no-underline hover:text-[#222] flex items-center gap-1.5 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to queue
          </Link>
          <span className="text-[12px] text-[#B0B0B0] font-mono">{listing.id}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            className={`btn btn-sm transition-all ${checkAll ? "btn-green" : "btn-outline"}`}
          >
            Approve & publish ✓
          </button>
          <button
            onClick={() => setAction(action === "edit" ? "none" : "edit")}
            className={`btn btn-outline btn-sm ${action === "edit" ? "border-[#222] bg-[#F7F7F7]" : ""}`}
          >
            Request edits
          </button>
          <button
            onClick={() => setAction(action === "reject" ? "none" : "reject")}
            className={`btn btn-sm border transition-all ${action === "reject" ? "bg-accent text-white border-accent" : "bg-white text-accent border-accent hover:bg-[#FFF0F0]"}`}
          >
            Reject ✗
          </button>
        </div>
      </div>

      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: "1fr 340px", alignItems: "start" }}
      >
        {/* LEFT */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h1 className="text-[20px] font-bold">{listing.title}</h1>
          </div>
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span
              className={`badge ${listing.type === "tenant" ? "badge-tenant" : listing.type === "owner" ? "badge-owner" : "badge-agent"}`}
            >
              {listing.type === "tenant"
                ? "Outgoing tenant"
                : listing.type === "owner"
                  ? "Owner"
                  : "RERA Agent"}
            </span>
            <span
              className={`badge ${listing.status === "live" ? "badge-live" : listing.status === "rejected" ? "badge-rejected" : "badge-pending"}`}
            >
              {listing.status === "live"
                ? "Live"
                : listing.status === "rejected"
                  ? "Rejected"
                  : "Pending review"}
            </span>
            <span className="text-[12px] text-[#B0B0B0]">
              Submitted {listing.submitted}
            </span>
            {listing.honest && <span className="badge badge-honest">✓ Honest</span>}
          </div>

          {/* Photos */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {["ph-a", "ph-b", "ph-c", "ph-d"].map((ph, i) => (
              <div
                key={i}
                className={`${ph} rounded-xl aspect-square flex items-center justify-center text-2xl opacity-35 relative group cursor-pointer hover:opacity-50 transition-opacity`}
              >
                🏠
                <button className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent text-white rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity border-0 cursor-pointer">
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Basic details */}
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[15px] font-semibold">Basic details</div>
              <button className="text-[12px] font-medium text-accent bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif]">
                Edit all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Title", listing.title],
                ["Lister", listing.lister],
                ["Phone", `${listing.phone} (OTP ✓)`],
                ["Rent", `₹${listing.rent.toLocaleString("en-IN")}/month`],
                [
                  "Service fee",
                  listing.fee > 0 ? `₹${listing.fee.toLocaleString("en-IN")}` : "None",
                ],
                ["Available", "April 1, 2026"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-1">
                    {l}
                  </div>
                  <div className="text-[13px] font-medium">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Insider Q&A */}
          {listing.type === "tenant" && (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
              <div className="text-[15px] font-semibold mb-4">
                Insider answers ({listing.answers} of 5)
              </div>
              {INSIDER_QA.slice(0, listing.answers).map((item, i) => (
                <div
                  key={i}
                  className={`pb-4 ${i < listing.answers - 1 ? "border-b border-[#E8E8E8] mb-4" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="text-[13px] font-semibold flex-1">{item.q}</div>
                    <div className="flex gap-2 shrink-0">
                      <button className="text-[11px] text-[#0066CC] font-medium bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif] p-0">
                        Edit
                      </button>
                      <button className="text-[11px] text-accent font-medium bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif] p-0">
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-[13px] text-[#717171] font-light leading-relaxed">
                    {item.a}
                  </div>
                  <div className="text-[11px] text-[#B0B0B0] mt-1">
                    {item.a.length} chars
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Honest disclosures */}
          {listing.honest && (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5">
              <div className="text-[15px] font-semibold mb-4">Honest disclosures</div>
              {["Weekend pub noise after 10pm", "Power cuts 1–2x/week in summer"].map(
                (d) => (
                  <div
                    key={d}
                    className="flex items-center justify-between py-2.5 border-b border-[#E8E8E8] last:border-0"
                  >
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className="text-[#008A05]">✓</span>
                      {d}
                    </div>
                    <button className="text-[11px] text-accent bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif] p-0">
                      Remove
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Admin panel */}
        <div className="sticky" style={{ top: "32px" }}>
          {/* Checklist */}
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[14px] font-semibold">Review checklist</div>
              <div className="text-[12px] text-[#717171]">
                {checkedCount}/{CHECKLIST_ITEMS.length}
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {CHECKLIST_ITEMS.map((item, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() =>
                      setChecklist((prev) => {
                        const n = [...prev];
                        n[i] = !n[i];
                        return n;
                      })
                    }
                    className={`w-5 h-5 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center cursor-pointer transition-all ${checklist[i] ? "bg-[#008A05] border-[#008A05]" : "border-[#DDDDDD] group-hover:border-[#222]"}`}
                  >
                    {checklist[i] && (
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="text-[13px] leading-snug select-none"
                    style={{ color: checklist[i] ? "#222" : "#717171" }}
                  >
                    {item}
                  </span>
                </label>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(checkedCount / 7) * 100}%`,
                  background: checkAll ? "#008A05" : "#B07D2A",
                }}
              />
            </div>

            {/* Verified badge toggle */}
            <div className="border-t border-[#E8E8E8] pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[13px] font-semibold">Award Verified badge</div>
                <div
                  onClick={() => setVerifiedBadge(!verifiedBadge)}
                  className={`toggle-track ${verifiedBadge ? "on" : "off"} cursor-pointer`}
                >
                  <div className="toggle-thumb" />
                </div>
              </div>
              <p className="text-[11px] text-[#B0B0B0] leading-relaxed">
                Award after checklist passes + optional callback to confirm lister is
                genuine.
              </p>
            </div>
          </div>

          {/* Internal note */}
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
            <div className="text-[13px] font-semibold mb-3">Internal note</div>
            <textarea
              className="input resize-none text-[13px]"
              style={{ minHeight: "70px" }}
              placeholder="Add note for team (not shown to lister)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Edit request */}
          {action === "edit" && (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4 animate-slide-down">
              <div className="text-[13px] font-semibold mb-3">
                Message to lister (via WhatsApp)
              </div>
              <textarea
                className="input resize-none text-[13px] mb-3"
                style={{ minHeight: "80px" }}
                value={editMsg}
                onChange={(e) => setEditMsg(e.target.value)}
              />
              <button
                onClick={() => {
                  showToast("Edit request sent via WhatsApp", "success");
                  setAction("none");
                }}
                className="btn btn-secondary btn-sm w-full justify-center"
              >
                Send edit request →
              </button>
            </div>
          )}

          {/* Reject */}
          {action === "reject" && (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4 animate-slide-down">
              <div className="text-[13px] font-semibold mb-3">Reason for rejection</div>
              <select
                className="input mb-3 text-[13px] cursor-pointer"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              >
                <option value="">Select reason…</option>
                <option>Duplicate listing</option>
                <option>Fake or stock photos</option>
                <option>Contact info in listing text</option>
                <option>Low quality / no useful info</option>
                <option>Outside Bengaluru</option>
                <option>Other</option>
              </select>
              <button
                onClick={handleReject}
                className="btn btn-primary btn-sm w-full justify-center"
              >
                Reject & notify lister ✗
              </button>
            </div>
          )}

          {/* Approve */}
          <button
            onClick={handleApprove}
            className={`btn btn-lg w-full justify-center transition-all ${checkAll ? "btn-green" : "btn-outline"}`}
          >
            {checkAll ? "Approve & publish ✓" : `Complete checklist (${checkedCount}/7)`}
          </button>
          <p className="text-[12px] text-[#717171] text-center mt-2">
            {checkAll
              ? "Listing goes live immediately."
              : "All 7 items must be checked to approve."}
          </p>
        </div>
      </div>
    </div>
  );
}
