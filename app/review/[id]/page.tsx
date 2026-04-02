"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  const [kycModalOpen, setKycModalOpen] = useState(false);

  useEffect(() => {
    if (!listing) return;
    setEditMsg(`Hi ${listing.lister?.split(" ")[0] || "there"}, your listing looks good but we need a few changes:`);
  }, [listing]);

  useEffect(() => {
    if (!kycModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setKycModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [kycModalOpen]);

  if (loading) return <div className="p-8 text-[#717171]">Loading listing…</div>;
  if (!listing) return <div className="p-8 text-[#717171]">Listing not found</div>;

  const checkAll = checklist.every(Boolean);
  const checkedCount = checklist.filter(Boolean).length;
  const alreadyVerified = Boolean(listing.verified);
  const kycForModal: KycPayload = listing.kyc ?? {
    documents: [],
    ownerName: null,
    ownerPhone: null,
    reraNo: "",
  };

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
        <div className="flex gap-2 flex-wrap justify-end">
          {!alreadyVerified && (
            <button
              onClick={handleApprove}
              className={`btn btn-sm transition-all ${checkAll ? "btn-green" : "btn-outline"}`}
            >
              Approve & publish ✓
            </button>
          )}
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
          {!alreadyVerified && (
            <button
              onClick={() => setAction(action === "reject" ? "none" : "reject")}
              className={`btn btn-sm border transition-all ${action === "reject" ? "bg-accent text-white border-accent" : "bg-white text-accent border-accent hover:bg-[#FFF0F0]"}`}
            >
              Reject ✗
            </button>
          )}
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
            {(listing.photos ?? []).length > 0 ? (
              (listing.photos ?? []).slice(0, 8).map((photo, i) => (
                <div key={`${photo.url}-${i}`} className="rounded-xl aspect-square overflow-hidden border border-[#E8E8E8]">
                  <img src={photo.url} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))
            ) : (
              <div className="text-[13px] text-[#717171] col-span-4 py-3">No photos uploaded.</div>
            )}
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
                Insider answers ({listing.insiderAnswers?.length ?? 0} of 5)
              </div>
              {(listing.insiderAnswers ?? []).length === 0 && (
                <div className="text-[13px] text-[#717171]">No insider answers provided.</div>
              )}
              {(listing.insiderAnswers ?? []).map((item, i) => (
                <div
                  key={i}
                  className={`pb-4 ${i < (listing.insiderAnswers?.length ?? 0) - 1 ? "border-b border-[#E8E8E8] mb-4" : ""}`}
                >
                  <div className="text-[13px] font-semibold flex-1 mb-2">{item.question}</div>
                  <div className="text-[13px] text-[#717171] font-light leading-relaxed">
                    {item.answer}
                  </div>
                  <div className="text-[11px] text-[#B0B0B0] mt-1">
                    {item.answer.length} chars
                  </div>
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
              {(listing.honestDisclosures ?? []).map(
                (d) => (
                  <div
                    key={d}
                    className="flex items-center justify-between py-2.5 border-b border-[#E8E8E8] last:border-0"
                  >
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className="text-[#008A05]">✓</span>
                      {d}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Admin panel */}
        <div className="sticky" style={{ top: "32px" }}>
          {/* Checklist */}
          {!alreadyVerified ? (
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
          ) : (
            <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5 mb-4">
              <div className="text-[14px] font-semibold text-[#008A05] mb-1">
                Already verified
              </div>
              <p className="text-[12px] text-[#717171]">
                This listing has already been verified.
              </p>
            </div>
          )}

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
          {!alreadyVerified && action === "reject" && (
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
          {!alreadyVerified ? (
            <>
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
            </>
          ) : null}
        </div>
      </div>

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
              <h2 id="kyc-modal-title" className="text-[16px] font-semibold m-0">
                Listing KYC
              </h2>
              <button
                type="button"
                onClick={() => setKycModalOpen(false)}
                className="text-[13px] font-medium text-[#717171] bg-transparent border-0 cursor-pointer hover:text-[#222] px-2 py-1 rounded-lg hover:bg-[#F7F7F7]"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4 space-y-5">
              {listing.type === "tenant" && (kycForModal.ownerName || kycForModal.ownerPhone) && (
                <div className="space-y-3">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0]">
                    Outgoing tenant — registered owner (as provided)
                  </div>
                  {kycForModal.ownerName ? (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-1">
                        Owner name
                      </div>
                      <div className="text-[13px] font-medium">{kycForModal.ownerName}</div>
                    </div>
                  ) : null}
                  {kycForModal.ownerPhone ? (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-1">
                        Owner phone
                      </div>
                      <div className="text-[13px] font-medium">{kycForModal.ownerPhone}</div>
                    </div>
                  ) : null}
                </div>
              )}

              {listing.type === "agent" && kycForModal.reraNo ? (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-1">
                    RERA registration number
                  </div>
                  <div className="text-[13px] font-medium">{kycForModal.reraNo}</div>
                </div>
              ) : null}

              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-3">
                  Uploaded documents
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
