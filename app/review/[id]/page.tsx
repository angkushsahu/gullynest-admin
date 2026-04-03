"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminListings } from "@/hooks/useAdminListings";
import { useAdminApp } from "@/context/AdminAppContext";

const CATEGORY_ORDER = [
  "LIVING_ROOM","BEDROOM","BATHROOM","KITCHEN",
  "BALCONY","EXTERIOR","DINING","LOCALITY","OTHER",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  LIVING_ROOM: "Living room",
  BEDROOM:     "Bedroom",
  BATHROOM:    "Bathroom",
  KITCHEN:     "Kitchen",
  BALCONY:     "Balcony",
  EXTERIOR:    "Building front",
  DINING:      "Dining",
  LOCALITY:    "Locality",
  OTHER:       "Other",
};

type PhotoGroup = { category: string; label: string; urls: string[] };

function buildGroups(photos: Array<{ url: string; category?: string }>): PhotoGroup[] {
  const map = new Map<string, string[]>();
  for (const p of photos) {
    const cat = p.category ?? "OTHER";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(p.url);
  }
  return CATEGORY_ORDER
    .filter((c) => map.has(c))
    .map((c) => ({ category: c, label: CATEGORY_LABELS[c] ?? c, urls: map.get(c)! }));
}

const CHECKLIST_ITEMS = [
  "Phone number is real and reachable",
  "Photos are genuine and match description",
  "No contact info hidden in listing text or photos",
  "Not a duplicate listing",
  "Rent amount is plausible for this locality",
  "Insider answers are genuinely informative",
  "Service fee is within reasonable range (if applicable)",
];

type KycPayload = {
  documents: Array<{ title: string; docType: string; url: string }>;
  ownerName: string | null;
  ownerPhone: string | null;
  reraNo: string;
};

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
  hasCapturedPayment: boolean;
  insiderAnswers?: Array<{ question: string; answer: string; honestDisclosure?: boolean }>;
  honestDisclosures?: string[];
  photos?: Array<{ url: string; category?: string; sortOrder?: number }>;
  kyc?: KycPayload;
};

export default function AdminReview() {
  const params = useParams();
  const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const [listing, setListing] = useState<ReviewListing | null>(null);
  const [loading, setLoading] = useState(true);
  const { approveAdminListing, rejectAdminListing } = useAdminListings();
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
  const [action, setAction] = useState<"none" | "edit" | "reject">("none");
  const [rejectReason, setRejectReason] = useState("");
  const [editMsg, setEditMsg] = useState("");
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryCategory, setGalleryCategory] = useState<string>("ALL");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const activeLenRef = useRef(0);

  useEffect(() => {
    if (!listing) return;
    setEditMsg(`Hi ${listing.lister?.split(" ")[0] || "there"}, your listing looks good but we need a few changes:`);
  }, [listing]);

  useEffect(() => {
    if (!kycModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setKycModalOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [kycModalOpen]);

  useEffect(() => {
    if (!galleryOpen) return;
    const handler = (e: KeyboardEvent) => {
      const len = activeLenRef.current;
      if (e.key === "Escape") {
        if (lightboxIndex !== null) setLightboxIndex(null);
        else setGalleryOpen(false);
      }
      if (lightboxIndex === null || len === 0) return;
      if (e.key === "ArrowRight") setLightboxIndex((i) => ((i ?? 0) + 1) % len);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => ((i ?? 0) - 1 + len) % len);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [galleryOpen, lightboxIndex]);

  if (loading) return <div className="p-8 text-[#717171]">Loading listing…</div>;
  if (!listing) return <div className="p-8 text-[#717171]">Listing not found</div>;

  const checkAll = checklist.every(Boolean);
  const checkedCount = checklist.filter(Boolean).length;
  const kycForModal: KycPayload = listing.kyc ?? { documents: [], ownerName: null, ownerPhone: null, reraNo: "" };

  const allPhotos = (listing.photos ?? []).map((p) => p.url);
  const photoGroups = buildGroups(listing.photos ?? []);
  const hasCategorized = photoGroups.length > 0;
  const activePhotos =
    galleryCategory === "ALL"
      ? allPhotos
      : (photoGroups.find((g) => g.category === galleryCategory)?.urls ?? []);
  activeLenRef.current = activePhotos.length;

  const handleApprove = async () => {
    await approveAdminListing(listing.id, verifiedBadge);
    setDone("approved");
    setTimeout(() => router.push("/listings"), 1500);
  };

  const handleReject = async () => {
    if (!rejectReason) {
      showToast("Please select a rejection reason", "error");
      return;
    }
    await rejectAdminListing(listing.id, rejectReason);
    setDone("rejected");
    setTimeout(() => router.push("/listings"), 1000);
  };

  const handleAwardVerified = async () => {
    await approveAdminListing(listing.id, true);
    showToast("Verified badge awarded", "success");
    setListing((prev) => prev ? { ...prev, verified: true } : prev);
  };

  const handleDelist = async () => {
    await rejectAdminListing(listing.id, "Delisted by admin");
    setDone("rejected");
    setTimeout(() => router.push("/listings"), 1000);
  };

  const handleReapprove = async () => {
    await approveAdminListing(listing.id, false);
    showToast("Listing re-approved and live", "success");
    setListing((prev) => prev ? { ...prev, status: "live" } : prev);
  };

  if (done === "approved") {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center animate-bounce-soft">
          <div className="w-20 h-20 rounded-full bg-[#EBFAEB] border-2 border-[#008A05] flex items-center justify-center mx-auto mb-4 text-4xl">✓</div>
          <div className="text-[20px] font-bold text-[#008A05]">Listing approved and live!</div>
          <div className="text-[14px] text-[#717171] mt-2">Redirecting to queue…</div>
        </div>
      </div>
    );
  }

  if (done === "rejected") {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#FFF0F0] border-2 border-[#FF5A5F] flex items-center justify-center mx-auto mb-4 text-4xl">✗</div>
          <div className="text-[20px] font-bold text-[#FF5A5F]">Listing rejected</div>
          <div className="text-[14px] text-[#717171] mt-2">Redirecting…</div>
        </div>
      </div>
    );
  }

  // --- Header buttons by status ---
  const headerButtons = (() => {
    if (listing.status === "pending") {
      return (
        <>
          <button
            type="button"
            onClick={() => setKycModalOpen(true)}
            className="btn btn-outline btn-sm"
          >
            KYC documents
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
        </>
      );
    }

    if (listing.status === "live" && !listing.verified) {
      return (
        <>
          <button
            onClick={handleAwardVerified}
            disabled={!listing.hasCapturedPayment}
            title={!listing.hasCapturedPayment ? "No captured payment for this listing" : undefined}
            className="btn btn-sm btn-green disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Award Verified ✓
          </button>
          <button
            type="button"
            onClick={() => setKycModalOpen(true)}
            className="btn btn-outline btn-sm"
          >
            KYC documents
          </button>
          <button
            onClick={() => setAction(action === "edit" ? "none" : "edit")}
            className={`btn btn-outline btn-sm ${action === "edit" ? "border-[#222] bg-[#F7F7F7]" : ""}`}
          >
            Request edits
          </button>
          <button
            onClick={handleDelist}
            className="btn btn-sm bg-white text-accent border border-accent hover:bg-[#FFF0F0]"
          >
            Delist ✗
          </button>
        </>
      );
    }

    if (listing.status === "live" && listing.verified) {
      return (
        <>
          <span className="text-[12px] font-semibold text-[#008A05] bg-[#EBFAEB] border border-[#CDECCF] px-3 py-1.5 rounded-lg leading-none">
            Verified ✓
          </span>
          <button
            type="button"
            onClick={() => setKycModalOpen(true)}
            className="btn btn-outline btn-sm"
          >
            KYC documents
          </button>
          <button
            onClick={() => setAction(action === "edit" ? "none" : "edit")}
            className={`btn btn-outline btn-sm ${action === "edit" ? "border-[#222] bg-[#F7F7F7]" : ""}`}
          >
            Request edits
          </button>
        </>
      );
    }

    if (listing.status === "rejected") {
      return (
        <>
          <button
            onClick={handleReapprove}
            className="btn btn-sm btn-green"
          >
            Re-approve ✓
          </button>
          <button
            type="button"
            onClick={() => setKycModalOpen(true)}
            className="btn btn-outline btn-sm"
          >
            KYC documents
          </button>
        </>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setKycModalOpen(true)}
        className="btn btn-outline btn-sm"
      >
        KYC documents
      </button>
    );
  })();

  return (
    <div className="p-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/listings"
            className="text-[13px] text-[#717171] no-underline hover:text-[#222] flex items-center gap-1.5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to queue
          </Link>
          <span className="text-[12px] text-[#B0B0B0] font-mono">{listing.id}</span>
        </div>
        <div className="flex gap-2 flex-wrap justify-end items-center">
          {headerButtons}
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px", alignItems: "start" }}>
        {/* LEFT */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <h1 className="text-[20px] font-bold">{listing.title}</h1>
          </div>
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className={`badge ${listing.type === "tenant" ? "badge-tenant" : listing.type === "owner" ? "badge-owner" : "badge-agent"}`}>
              {listing.type === "tenant" ? "Outgoing tenant" : listing.type === "owner" ? "Owner" : "RERA Agent"}
            </span>
            <span className={`badge ${listing.status === "live" ? "badge-live" : listing.status === "rejected" ? "badge-rejected" : listing.status === "draft" ? "badge-draft" : "badge-pending"}`}>
              {listing.status === "live" ? "Live" : listing.status === "rejected" ? "Rejected" : listing.status === "draft" ? "Draft" : "Pending review"}
            </span>
            <span className="text-[12px] text-[#B0B0B0]">Submitted {listing.submitted}</span>
            {listing.honest && <span className="badge badge-honest">✓ Honest</span>}
          </div>

          {/* Photos */}
          {allPhotos.length === 0 ? (
            <div className="text-[13px] text-[#717171] mb-6 py-3">No photos uploaded.</div>
          ) : (
            <div className="mb-6">
              {/* Preview strip */}
              <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: allPhotos.length === 1 ? "1fr" : allPhotos.length === 2 ? "1fr 1fr" : "2fr 1fr 1fr" }}>
                {allPhotos.slice(0, 3).map((url, i) => (
                  <div
                    key={url + i}
                    className="rounded-xl overflow-hidden border border-[#E8E8E8] cursor-pointer group relative"
                    style={{ aspectRatio: i === 0 ? "16/10" : "1/1" }}
                    onClick={() => { setGalleryCategory("ALL"); setLightboxIndex(i); setGalleryOpen(true); }}
                  >
                    <img src={url} alt={`Property ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {/* "Show all" overlay on last visible tile when there are more */}
                    {i === 2 && allPhotos.length > 3 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-[13px] font-semibold">+{allPhotos.length - 3} more</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setGalleryCategory("ALL"); setLightboxIndex(null); setGalleryOpen(true); }}
                className="text-[12px] font-medium text-[#717171] bg-transparent border-0 cursor-pointer hover:text-[#222] font-[Sora,sans-serif] p-0 transition-colors"
              >
                Show all {allPhotos.length} photos →
              </button>
            </div>
          )}

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
                ["Service fee", listing.fee > 0 ? `₹${listing.fee.toLocaleString("en-IN")}` : "None"],
                ["Available", "April 1, 2026"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-1">{l}</div>
                  <div className="text-[13px] font-medium">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Insider Q&A */}
          {listing.type === "tenant" && (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
              <div className="text-[15px] font-semibold mb-4">
                Insider answers ({listing.insiderAnswers?.length ?? 0} of 5)
              </div>
              {(listing.insiderAnswers ?? []).length === 0 && (
                <div className="text-[13px] text-[#717171]">No insider answers provided.</div>
              )}
              {(listing.insiderAnswers ?? []).map((item, i) => (
                <div key={i} className={`pb-4 ${i < (listing.insiderAnswers?.length ?? 0) - 1 ? "border-b border-[#E8E8E8] mb-4" : ""}`}>
                  <div className="text-[13px] font-semibold flex-1 mb-2">{item.question}</div>
                  <div className="text-[13px] text-[#717171] font-light leading-relaxed">{item.answer}</div>
                  <div className="text-[11px] text-[#B0B0B0] mt-1">{item.answer.length} chars</div>
                </div>
              ))}
            </div>
          )}

          {/* Honest disclosures */}
          {listing.honest && (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5">
              <div className="text-[15px] font-semibold mb-4">Honest disclosures</div>
              {(listing.honestDisclosures ?? []).length === 0 && (
                <div className="text-[13px] text-[#717171]">No explicit honest disclosures provided.</div>
              )}
              {(listing.honestDisclosures ?? []).map((d) => (
                <div key={d} className="flex items-center justify-between py-2.5 border-b border-[#E8E8E8] last:border-0">
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-[#008A05]">✓</span>
                    {d}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Admin panel — only shown for pending listings */}
        {listing.status === "pending" && (
          <div className="sticky" style={{ top: "32px" }}>
            {/* Checklist */}
            <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[14px] font-semibold">Review checklist</div>
                <div className="text-[12px] text-[#717171]">{checkedCount}/{CHECKLIST_ITEMS.length}</div>
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
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13px] leading-snug select-none" style={{ color: checklist[i] ? "#222" : "#717171" }}>
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

              <div className="border-t border-[#E8E8E8] pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[13px] font-semibold">Award Verified badge</div>
                  <div
                    onClick={() => listing.hasCapturedPayment && setVerifiedBadge(!verifiedBadge)}
                    className={`toggle-track ${verifiedBadge ? "on" : "off"} ${listing.hasCapturedPayment ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
                    title={!listing.hasCapturedPayment ? "No captured payment for this listing" : undefined}
                  >
                    <div className="toggle-thumb" />
                  </div>
                </div>
                <p className="text-[11px] text-[#B0B0B0] leading-relaxed">
                  {listing.hasCapturedPayment
                    ? "Award after checklist passes + optional callback to confirm lister is genuine."
                    : "Unavailable — no captured payment on file for this listing."}
                </p>
              </div>
            </div>

            {/* Edit request */}
            {action === "edit" && (
              <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4 animate-slide-down">
                <div className="text-[13px] font-semibold mb-3">Message to lister (via WhatsApp)</div>
                <textarea
                  className="input resize-none text-[13px] mb-3"
                  style={{ minHeight: "80px" }}
                  value={editMsg}
                  onChange={(e) => setEditMsg(e.target.value)}
                />
                <button
                  onClick={() => { showToast("Edit request sent via WhatsApp", "success"); setAction("none"); }}
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
                <button onClick={handleReject} className="btn btn-primary btn-sm w-full justify-center">
                  Reject & notify lister ✗
                </button>
              </div>
            )}

            {/* Approve button — truly disabled until checklist complete */}
            <button
              onClick={handleApprove}
              disabled={!checkAll}
              className="btn btn-lg w-full justify-center transition-all btn-green disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Approve &amp; publish ✓
            </button>
            <p className="text-[12px] text-[#717171] text-center mt-2">
              {checkAll ? "Listing goes live immediately." : `Complete all ${CHECKLIST_ITEMS.length} checklist items to approve.`}
            </p>
          </div>
        )}

        {/* Right panel for live/rejected — minimal info card */}
        {listing.status !== "pending" && (
          <div className="sticky" style={{ top: "32px" }}>
            {listing.status === "live" && (
              <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
                <div className="text-[14px] font-semibold text-[#008A05] mb-1">Listing is live</div>
                <p className="text-[12px] text-[#717171]">
                  {listing.verified ? "This listing has a verified badge." : "No verified badge yet."}
                  {!listing.verified && !listing.hasCapturedPayment && (
                    <span className="block mt-1 text-[#B07D2A]">No captured payment on file — verified badge unavailable.</span>
                  )}
                </p>
              </div>
            )}
            {listing.status === "rejected" && (
              <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
                <div className="text-[14px] font-semibold text-accent mb-1">Listing is rejected</div>
                <p className="text-[12px] text-[#717171]">Use Re-approve to make it live again.</p>
              </div>
            )}
            {listing.status === "draft" && (
              <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
                <div className="text-[14px] font-semibold text-[#717171] mb-1">Draft</div>
                <p className="text-[12px] text-[#717171]">This listing has not been submitted for review.</p>
              </div>
            )}
            {/* Edit request panel — available for all non-pending statuses too */}
            {action === "edit" && (
              <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 animate-slide-down">
                <div className="text-[13px] font-semibold mb-3">Message to lister (via WhatsApp)</div>
                <textarea
                  className="input resize-none text-[13px] mb-3"
                  style={{ minHeight: "80px" }}
                  value={editMsg}
                  onChange={(e) => setEditMsg(e.target.value)}
                />
                <button
                  onClick={() => { showToast("Edit request sent via WhatsApp", "success"); setAction("none"); }}
                  className="btn btn-secondary btn-sm w-full justify-center"
                >
                  Send edit request →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gallery Modal */}
      {galleryOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" role="presentation">
          {/* Fullscreen lightbox */}
          {lightboxIndex !== null && (
            <div
              className="absolute inset-0 z-10 bg-black flex items-center justify-center"
              onClick={() => setLightboxIndex(null)}
            >
              <img
                src={activePhotos[lightboxIndex]}
                alt={`Photo ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors border-0 cursor-pointer text-xl z-20"
              >
                ×
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[12px] font-medium px-3 py-1.5 rounded-full">
                {lightboxIndex + 1} / {activePhotos.length}
              </div>
              {activePhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + activePhotos.length) % activePhotos.length); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-colors border-0 cursor-pointer text-lg z-20"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % activePhotos.length); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-colors border-0 cursor-pointer text-lg z-20"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          )}

          {/* Gallery header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
            <div className="text-white text-[14px] font-semibold">{listing.title}</div>
            <button
              type="button"
              onClick={() => setGalleryOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors border-0 cursor-pointer text-xl"
            >
              ×
            </button>
          </div>

          {/* Category tabs */}
          {hasCategorized && (
            <div className="flex gap-2 px-6 pb-4 overflow-x-auto flex-shrink-0">
              <button
                type="button"
                onClick={() => { setGalleryCategory("ALL"); setLightboxIndex(null); }}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium flex-shrink-0 border-0 cursor-pointer transition-all font-[Sora,sans-serif] ${galleryCategory === "ALL" ? "bg-white text-[#222]" : "bg-white/10 text-white hover:bg-white/20"}`}
              >
                All ({allPhotos.length})
              </button>
              {photoGroups.map((g) => (
                <button
                  key={g.category}
                  type="button"
                  onClick={() => { setGalleryCategory(g.category); setLightboxIndex(null); }}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium flex-shrink-0 border-0 cursor-pointer transition-all font-[Sora,sans-serif] ${galleryCategory === g.category ? "bg-white text-[#222]" : "bg-white/10 text-white hover:bg-white/20"}`}
                >
                  {g.label} ({g.urls.length})
                </button>
              ))}
            </div>
          )}

          {/* Photo grid */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {activePhotos.length === 0 ? (
              <div className="text-white/50 text-[13px] text-center mt-16">No photos in this category.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-w-[900px] mx-auto">
                {activePhotos.map((url, i) => (
                  <div
                    key={url + i}
                    className={`rounded-xl overflow-hidden bg-[#111] cursor-pointer group ${i === 0 && activePhotos.length > 1 ? "col-span-2 aspect-video" : "aspect-video"}`}
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KYC Modal */}
      {kycModalOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-black/45"
          role="presentation"
          onClick={() => setKycModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="kyc-modal-title"
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[min(85vh,640px)] flex flex-col overflow-hidden border border-[#E8E8E8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#E8E8E8] shrink-0">
              <h2 id="kyc-modal-title" className="text-[16px] font-semibold m-0">Listing KYC</h2>
              <button
                type="button"
                onClick={() => setKycModalOpen(false)}
                className="text-[13px] font-medium text-[#717171] bg-transparent border-0 cursor-pointer hover:text-[#222] px-2 py-1 rounded-lg hover:bg-[#F7F7F7]"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4 space-y-5">

              {/* Tenant: owner identity */}
              {listing.type === "tenant" && (kycForModal.ownerName || kycForModal.ownerPhone) && (
                <div className="space-y-3">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0]">
                    Registered owner (as provided by outgoing tenant)
                  </div>
                  {kycForModal.ownerName && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-1">Owner name</div>
                      <div className="text-[13px] font-medium">{kycForModal.ownerName}</div>
                    </div>
                  )}
                  {kycForModal.ownerPhone && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-1">Owner phone</div>
                      <div className="text-[13px] font-medium">{kycForModal.ownerPhone}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Agent: RERA number */}
              {listing.type === "agent" && kycForModal.reraNo && (
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-2">Agent RERA details</div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-1">RERA registration number</div>
                    <div className="text-[13px] font-medium font-mono">{kycForModal.reraNo}</div>
                  </div>
                </div>
              )}

              {/* Documents by type */}
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-3">
                  {listing.type === "tenant" && "Uploaded documents (rental agreement, property doc)"}
                  {listing.type === "owner" && "Uploaded documents (property ownership proof)"}
                  {listing.type === "agent" && "Uploaded documents (RERA license)"}
                </div>
                {kycForModal.documents.length === 0 ? (
                  <p className="text-[13px] text-[#717171] m-0">No documents on file for this listing.</p>
                ) : (
                  <ul className="list-none m-0 p-0 space-y-4">
                    {kycForModal.documents.map((doc) => (
                      <li key={`${doc.docType}-${doc.url}`} className="border border-[#E8E8E8] rounded-xl p-3">
                        <div className="text-[13px] font-semibold mb-2 leading-snug">{doc.title}</div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-accent font-medium hover:underline break-all"
                        >
                          Open file →
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* No KYC info at all */}
              {!kycForModal.ownerName && !kycForModal.ownerPhone && !kycForModal.reraNo && kycForModal.documents.length === 0 && (
                <p className="text-[13px] text-[#717171]">No KYC information submitted for this listing.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
