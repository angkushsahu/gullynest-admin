"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminApp } from "@/context/AdminAppContext";
import { apiFetch } from "@/lib/api-fetch";
import { LocationPicker, type LocationValue } from "@/components/LocationPicker";
import { PhotoUploader } from "@/components/PhotoUploader";
import { InsiderAnswers, buildInitialSuggestions, type SuggestionItem } from "@/components/InsiderAnswers";

type ListingKind = "owner" | "tenant" | "agent";
type FlatKind = "flat" | "room";
type BrokerageType = "months" | "fixed" | "none";
type Status = "LIVE" | "PENDING" | "DRAFT";

type FormState = {
  listingKind: ListingKind;
  flatKind: FlatKind;
  location: LocationValue | null;
  bhk: string;
  floorLabel: string;
  totalFloors: string;
  furnishing: string;
  rentMonthly: string;
  maintenanceMonthly: string;
  depositOneTime: string;
  serviceFee: string;
  availableFrom: string;
  ownerName: string;
  ownerPhone: string;
  reraNo: string;
  brokerageType: BrokerageType;
  brokerageMonths: string;
  brokerageAmount: string;
  brokerageNegotiable: boolean;
  listerName: string;
  listerPhone: string;
};

const INITIAL: FormState = {
  listingKind: "owner",
  flatKind: "flat",
  location: null,
  bhk: "",
  floorLabel: "",
  totalFloors: "",
  furnishing: "",
  rentMonthly: "",
  maintenanceMonthly: "",
  depositOneTime: "",
  serviceFee: "",
  availableFrom: "",
  ownerName: "",
  ownerPhone: "",
  reraNo: "",
  brokerageType: "months",
  brokerageMonths: "1",
  brokerageAmount: "",
  brokerageNegotiable: false,
  listerName: "",
  listerPhone: "",
};

const BHK_OPTIONS = ["1 RK", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "4+ BHK"];
const FURNISHING_OPTIONS = ["Unfurnished", "Semi-furnished", "Fully furnished"];

// Prevent scroll wheel from changing number input values
const noScroll = { onWheel: (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur() };

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-[12px] font-semibold text-[#717171] uppercase tracking-[0.05em] mb-1.5">
      {children}
      {optional && <span className="ml-1 normal-case font-normal text-[#B0B0B0]">(optional)</span>}
    </label>
  );
}

function SectionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[14px] font-bold text-[#222]">{children}</h3>
      {subtitle && <p className="text-[12px] text-[#717171] mt-0.5">{subtitle}</p>}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[12px] text-accent mt-1">{msg}</p>;
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-[#DDDDDD] overflow-hidden w-fit">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 text-[13px] font-semibold transition-colors ${
            value === opt.value
              ? "bg-[#222] text-white"
              : "bg-white text-[#717171] hover:bg-[#F7F7F7]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── build payload ────────────────────────────────────────────────────────────

function buildPayload(form: FormState, existingId: string | null, status: Status) {
  return {
    ...(existingId ? { id: existingId } : {}),
    listingKind: form.listingKind,
    flatKind: form.flatKind,
    locality: form.location?.locality,
    placeId: form.location?.placeId || undefined,
    lat: form.location?.lat,
    lng: form.location?.lng,
    bhk: form.bhk || undefined,
    floorLabel: form.floorLabel || undefined,
    totalFloors: form.totalFloors || undefined,
    furnishing: form.furnishing || undefined,
    rentMonthly: form.rentMonthly || undefined,
    maintenanceMonthly: form.maintenanceMonthly || undefined,
    depositOneTime: form.depositOneTime || undefined,
    serviceFee: form.listingKind === "tenant" ? form.serviceFee || undefined : undefined,
    availableFrom: form.availableFrom || undefined,
    ownerName: form.listingKind === "tenant" ? form.ownerName : undefined,
    ownerPhone: form.listingKind === "tenant" ? form.ownerPhone : undefined,
    reraNo: form.listingKind === "agent" ? form.reraNo : undefined,
    brokerageType: form.listingKind === "agent" ? form.brokerageType : undefined,
    brokerageMonths:
      form.listingKind === "agent" && form.brokerageType === "months"
        ? form.brokerageMonths
        : undefined,
    brokerageAmount:
      form.listingKind === "agent" && form.brokerageType === "fixed"
        ? form.brokerageAmount
        : undefined,
    brokerageNegotiable:
      form.listingKind === "agent" ? form.brokerageNegotiable : undefined,
    listerName: form.listerName,
    listerPhone: form.listerPhone,
    status,
  };
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function CreateListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useAdminApp();

  const urlId = searchParams.get("id")?.trim() ?? null;
  const [listingId, setListingId] = useState<string | null>(urlId);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submittingLive, setSubmittingLive] = useState(false);
  const [submittingPending, setSubmittingPending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [initialPhotos, setInitialPhotos] = useState<import("@/components/PhotoUploader").UploadedPhoto[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>(buildInitialSuggestions);
  const [loadingDraft, setLoadingDraft] = useState(!!urlId);
  const hydratedRef = useRef(false);

  // Load existing draft when ?id= is present
  useEffect(() => {
    if (!urlId || hydratedRef.current) return;
    hydratedRef.current = true;

    const load = async () => {
      try {
        const res = await apiFetch(`/api/admin/properties/${encodeURIComponent(urlId)}`);
        if (!res.ok) { showToast("Could not load listing", "error"); return; }

        const data = (await res.json()) as {
          item?: {
            raw?: {
              listingKind?: string;
              flatKind?: string;
              locality?: string;
              placeId?: string | null;
              lat?: number | null;
              lng?: number | null;
              bhk?: string;
              floorLabel?: string;
              totalFloors?: string;
              furnishing?: string;
              rentMonthly?: number;
              maintenanceMonthly?: number | null;
              depositOneTime?: number | null;
              serviceFee?: number | null;
              availableFrom?: string;
              brokerageType?: string;
              brokerageMonths?: number | null;
              brokerageAmount?: number | null;
              brokerageNegotiable?: boolean;
              listerName?: string;
              listerPhone?: string;
              ownerName?: string;
              ownerPhone?: string;
              reraNo?: string;
              status?: string;
            };
            insiderAnswers?: { question: string; answer: string; honestDisclosure?: boolean }[];
            photos?: { id: string; url: string; category: string; sortOrder: number }[];
          };
        };

        const raw = data.item?.raw;
        if (!raw) return;

        setForm((prev) => ({
          ...prev,
          listingKind: (raw.listingKind as ListingKind) ?? prev.listingKind,
          flatKind: (raw.flatKind as FlatKind) ?? prev.flatKind,
          location: raw.locality && raw.lat != null && raw.lng != null
            ? {
                locality: raw.locality,
                placeId: raw.placeId ?? '',
                lat: raw.lat,
                lng: raw.lng,
                formattedAddress: raw.locality,
              }
            : prev.location,
          bhk: raw.bhk ?? prev.bhk,
          floorLabel: raw.floorLabel ?? prev.floorLabel,
          totalFloors: raw.totalFloors ?? prev.totalFloors,
          furnishing: raw.furnishing ?? prev.furnishing,
          rentMonthly: raw.rentMonthly ? String(raw.rentMonthly) : prev.rentMonthly,
          maintenanceMonthly: raw.maintenanceMonthly ? String(raw.maintenanceMonthly) : prev.maintenanceMonthly,
          depositOneTime: raw.depositOneTime ? String(raw.depositOneTime) : prev.depositOneTime,
          serviceFee: raw.serviceFee ? String(raw.serviceFee) : prev.serviceFee,
          availableFrom: raw.availableFrom ?? prev.availableFrom,
          brokerageType: (raw.brokerageType as BrokerageType) ?? prev.brokerageType,
          brokerageMonths: raw.brokerageMonths ? String(raw.brokerageMonths) : prev.brokerageMonths,
          brokerageAmount: raw.brokerageAmount ? String(raw.brokerageAmount) : prev.brokerageAmount,
          brokerageNegotiable: raw.brokerageNegotiable ?? prev.brokerageNegotiable,
          listerName: raw.listerName ?? prev.listerName,
          listerPhone: raw.listerPhone ?? prev.listerPhone,
          ownerName: raw.ownerName ?? prev.ownerName,
          ownerPhone: raw.ownerPhone ?? prev.ownerPhone,
          reraNo: raw.reraNo ?? prev.reraNo,
        }));

        // Restore insider answers if present
        const insiderAnswers = data.item?.insiderAnswers;
        if (insiderAnswers && insiderAnswers.length > 0) {
          setSuggestions(insiderAnswers.map((a) => ({ question: a.question, answer: a.answer, honestDisclosure: a.honestDisclosure ?? false, required: false })));
        }

        // Restore photos
        const photos = data.item?.photos;
        if (photos && photos.length > 0) {
          const typed = photos.map((p) => ({
            id: p.id,
            url: p.url,
            category: p.category as import("@/components/PhotoUploader").UploadedPhoto["category"],
            sortOrder: p.sortOrder,
          }));
          setInitialPhotos(typed);
          setPhotoCount(typed.length);
        }
      } catch {
        showToast("Error loading draft", "error");
      } finally {
        setLoadingDraft(false);
      }
    };
    void load();
  }, [urlId, showToast]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleKindChange(kind: ListingKind) {
    setForm((prev) => ({
      ...prev,
      listingKind: kind,
      flatKind: kind === "agent" ? "flat" : prev.flatKind,
    }));
    setErrors({});
  }

  function validateForPublish(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.location) e.location = "Required";
    const rent = Number(form.rentMonthly);
    if (!form.rentMonthly || !Number.isFinite(rent) || rent <= 0) e.rentMonthly = "Required";
    if (!form.listerName.trim()) e.listerName = "Required";
    if (!form.listerPhone.trim()) e.listerPhone = "Required";
    if (form.listingKind === "tenant") {
      if (!form.ownerName.trim()) e.ownerName = "Required for tenant listings";
      if (!form.ownerPhone.trim()) e.ownerPhone = "Required for tenant listings";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const save = useCallback(async (targetStatus: Status) => {
    const isDraft = targetStatus === "DRAFT";
    if (!isDraft && !validateForPublish()) return;

    const setter = isDraft ? setSavingDraft : targetStatus === "LIVE" ? setSubmittingLive : setSubmittingPending;
    setter(true);

    try {
      const res = await apiFetch("/api/admin/properties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form, listingId, targetStatus)),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        property?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.ok) {
        showToast(data.error ?? "Failed to save listing", "error");
        setter(false);
        return;
      }

      const savedId = data.property!.id;

      if (!listingId) {
        setListingId(savedId);
        const sp = new URLSearchParams(searchParams.toString());
        sp.set("id", savedId);
        window.history.replaceState(null, "", `?${sp.toString()}`);
      }

      // Save insider answers if tenant and any filled
      if (form.listingKind === "tenant") {
        const hasAnyAnswer = suggestions.some((s) => s.answer.trim());
        if (hasAnyAnswer) {
          await apiFetch(`/api/list/tenant-suggestions?id=${encodeURIComponent(savedId)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ suggestions }),
          });
        }
      }

      if (isDraft) {
        showToast("Draft saved", "success");
      } else if (targetStatus === "LIVE") {
        showToast("Listing is now live", "success");
        router.push(`/review/${savedId}`);
      } else {
        showToast("Submitted for review", "success");
        router.push(`/review/${savedId}`);
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setter(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, listingId, suggestions, searchParams, showToast, router]);

  const isBusy = submittingLive || submittingPending || savingDraft;

  const isAgent = form.listingKind === "agent";
  const isTenant = form.listingKind === "tenant";
  const isFlat = form.flatKind === "flat";

  if (loadingDraft) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#DDDDDD] border-t-[#222] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 xl:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#222]" style={{ letterSpacing: "-0.3px" }}>
            {listingId ? "Edit listing" : "New listing"}
          </h1>
          <p className="text-[13px] text-[#717171] mt-0.5">
            {listingId
              ? `Editing draft · ${listingId}`
              : "Create a listing directly — bypasses the multi-step lister flow."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-outline btn-sm"
        >
          Cancel
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">

        {/* ── LEFT: form ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Listing type */}
          <div className="card p-5">
            <SectionTitle>Listing type</SectionTitle>
            <div className="flex flex-col gap-4">
              <div>
                <Label>Who is listing?</Label>
                <ToggleGroup
                  options={[
                    { value: "owner", label: "Owner" },
                    { value: "tenant", label: "Outgoing tenant" },
                    { value: "agent", label: "RERA Agent" },
                  ]}
                  value={form.listingKind}
                  onChange={handleKindChange}
                />
              </div>
              {!isAgent && (
                <div>
                  <Label>Property type</Label>
                  <ToggleGroup
                    options={[
                      { value: "flat", label: "Flat / Apartment" },
                      { value: "room", label: "Room / PG" },
                    ]}
                    value={form.flatKind}
                    onChange={(v) => set("flatKind", v)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="card p-5">
            <SectionTitle>Location</SectionTitle>
            <LocationPicker
              value={form.location}
              onChange={(v) => set("location", v)}
              error={errors.location}
            />
          </div>

          {/* Property details */}
          <div className="card p-5">
            <SectionTitle>Property details</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              {isFlat && (
                <div>
                  <Label optional>BHK</Label>
                  <select value={form.bhk} onChange={(e) => set("bhk", e.target.value)} className="input">
                    <option value="">Select BHK</option>
                    {BHK_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}
              <div>
                <Label optional>Floor</Label>
                <input className="input" placeholder="e.g. 3rd, Ground" value={form.floorLabel} onChange={(e) => set("floorLabel", e.target.value)} />
              </div>
              <div>
                <Label optional>Total floors</Label>
                <input className="input" placeholder="e.g. 5" value={form.totalFloors} onChange={(e) => set("totalFloors", e.target.value)} />
              </div>
              <div>
                <Label optional>Furnishing</Label>
                <select value={form.furnishing} onChange={(e) => set("furnishing", e.target.value)} className="input">
                  <option value="">Select furnishing</option>
                  {FURNISHING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card p-5">
            <SectionTitle>Pricing</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly rent (₹) *</Label>
                <input
                  className={`input ${errors.rentMonthly ? "error" : ""}`}
                  type="number" min={0} placeholder="e.g. 25000"
                  value={form.rentMonthly}
                  onChange={(e) => set("rentMonthly", e.target.value)}
                  {...noScroll}
                />
                <FieldError msg={errors.rentMonthly} />
              </div>
              <div>
                <Label optional>Security deposit (₹)</Label>
                <input className="input" type="number" min={0} placeholder="e.g. 50000" value={form.depositOneTime} onChange={(e) => set("depositOneTime", e.target.value)} {...noScroll} />
              </div>
              <div>
                <Label optional>Maintenance / month (₹)</Label>
                <input className="input" type="number" min={0} placeholder="e.g. 2000" value={form.maintenanceMonthly} onChange={(e) => set("maintenanceMonthly", e.target.value)} {...noScroll} />
              </div>
              {isTenant && (
                <div>
                  <Label optional>Service fee (₹)</Label>
                  <input className="input" type="number" min={0} placeholder="e.g. 5000" value={form.serviceFee} onChange={(e) => set("serviceFee", e.target.value)} {...noScroll} />
                </div>
              )}
            </div>
          </div>

          {/* Tenant: property owner details */}
          {isTenant && (
            <div className="card p-5">
              <SectionTitle subtitle="The actual owner of the property — not the outgoing tenant listing it.">Property owner details</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Owner name *</Label>
                  <input
                    className={`input ${errors.ownerName ? "error" : ""}`}
                    placeholder="Full name" value={form.ownerName}
                    onChange={(e) => set("ownerName", e.target.value)}
                  />
                  <FieldError msg={errors.ownerName} />
                </div>
                <div>
                  <Label>Owner phone *</Label>
                  <input
                    className={`input ${errors.ownerPhone ? "error" : ""}`}
                    placeholder="10-digit mobile" value={form.ownerPhone}
                    onChange={(e) => set("ownerPhone", e.target.value)}
                  />
                  <FieldError msg={errors.ownerPhone} />
                </div>
              </div>
            </div>
          )}

          {/* Agent details */}
          {isAgent && (
            <div className="card p-5">
              <SectionTitle>Agent details</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>RERA number <span className="text-[#B0B0B0] font-normal">(optional)</span></Label>
                  <input
                    className={`input ${errors.reraNo ? "error" : ""}`}
                    placeholder="e.g. PRM/KA/RERA/…" value={form.reraNo}
                    onChange={(e) => set("reraNo", e.target.value)}
                  />
                  <FieldError msg={errors.reraNo} />
                </div>
                <div>
                  <Label>Brokerage type</Label>
                  <select value={form.brokerageType} onChange={(e) => set("brokerageType", e.target.value as BrokerageType)} className="input">
                    <option value="months">Months of rent</option>
                    <option value="fixed">Fixed amount</option>
                    <option value="none">No brokerage</option>
                  </select>
                </div>
                {form.brokerageType === "months" && (
                  <div>
                    <Label>Brokerage (months)</Label>
                    <input className="input" type="number" min={0} step={0.5} placeholder="e.g. 1" value={form.brokerageMonths} onChange={(e) => set("brokerageMonths", e.target.value)} {...noScroll} />
                  </div>
                )}
                {form.brokerageType === "fixed" && (
                  <div>
                    <Label>Brokerage amount (₹)</Label>
                    <input className="input" type="number" min={0} placeholder="e.g. 15000" value={form.brokerageAmount} onChange={(e) => set("brokerageAmount", e.target.value)} {...noScroll} />
                  </div>
                )}
                {form.brokerageType !== "none" && (
                  <div className="flex items-center gap-2 h-[46px] mt-5">
                    <input
                      id="brokerageNeg" type="checkbox"
                      checked={form.brokerageNegotiable}
                      onChange={(e) => set("brokerageNegotiable", e.target.checked)}
                      className="w-4 h-4 accent-[#222]"
                    />
                    <label htmlFor="brokerageNeg" className="text-[13px] text-[#222]">Brokerage is negotiable</label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Availability & lister */}
          <div className="card p-5">
            <SectionTitle subtitle="The person whose contact will be shown to searchers after unlock.">Availability &amp; lister</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label optional>Available from</Label>
                <input className="input" type="date" value={form.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} />
              </div>
              <div className="col-span-2 border-t border-[#E8E8E8] pt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label>Lister name *</Label>
                  <input
                    className={`input ${errors.listerName ? "error" : ""}`}
                    placeholder="Full name" value={form.listerName}
                    onChange={(e) => set("listerName", e.target.value)}
                  />
                  <FieldError msg={errors.listerName} />
                </div>
                <div>
                  <Label>Lister phone *</Label>
                  <input
                    className={`input ${errors.listerPhone ? "error" : ""}`}
                    placeholder="+91 XXXXX XXXXX" value={form.listerPhone}
                    onChange={(e) => set("listerPhone", e.target.value)}
                  />
                  <FieldError msg={errors.listerPhone} />
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="card p-5">
            <SectionTitle subtitle="Each button saves and immediately applies the chosen status.">Publish or save</SectionTitle>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void save("LIVE")}
                disabled={isBusy}
                className="btn btn-md flex items-center gap-2 font-semibold"
                style={{ background: "#008A05", color: "white" }}
              >
                {submittingLive
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                  : "Go live →"}
              </button>
              <button
                type="button"
                onClick={() => void save("PENDING")}
                disabled={isBusy}
                className="btn btn-primary btn-md"
              >
                {submittingPending
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                  : "Submit for review →"}
              </button>
              <button
                type="button"
                onClick={() => void save("DRAFT")}
                disabled={isBusy}
                className="btn btn-outline btn-md"
              >
                {savingDraft
                  ? <><div className="w-4 h-4 border-2 border-[#222]/20 border-t-[#222] rounded-full animate-spin" />Saving…</>
                  : "Save draft"}
              </button>
            </div>
            <p className="text-[12px] text-[#717171] mt-3">
              <span className="font-semibold text-[#008A05]">Go live</span> — visible to searchers immediately.&ensp;
              <span className="font-semibold text-[#222]">Submit for review</span> — sits in the pending queue.&ensp;
              <span className="font-semibold text-[#717171]">Save draft</span> — not visible, come back later.
            </p>
          </div>
        </div>

        {/* ── RIGHT: photos + insider answers ──────────────────────────── */}
        <div className="flex flex-col gap-5 xl:sticky xl:top-6">

          {/* Photos */}
          <div className="card p-5">
            <SectionTitle subtitle="Upload photos by category. Add more any time from the review page.">Photos</SectionTitle>
            {listingId ? (
              <PhotoUploader
                propertyId={listingId}
                initialPhotos={initialPhotos}
                onCountChange={setPhotoCount}
              />
            ) : (
              <div className="rounded-xl border-2 border-dashed border-[#DDDDDD] py-10 text-center">
                <svg className="mx-auto mb-2 text-[#DDDDDD]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <p className="text-[13px] text-[#B0B0B0]">Save as draft first to upload photos</p>
              </div>
            )}
          </div>

          {/* Insider answers — tenant only */}
          {isTenant && (
            <div className="card p-5">
              <SectionTitle subtitle="Tenant perspective — shown to searchers as inside knowledge.">Insider answers</SectionTitle>
              <InsiderAnswers value={suggestions} onChange={setSuggestions} />
              {!listingId && suggestions.some((s) => s.answer.trim()) && (
                <p className="text-[12px] text-[#717171] mt-3">Answers will be saved when you save the listing.</p>
              )}
            </div>
          )}

          {/* Status summary chip when photo count > 0 */}
          {photoCount > 0 && (
            <p className="text-[12px] text-[#717171] text-right">
              {photoCount} photo{photoCount !== 1 ? "s" : ""} uploaded
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
