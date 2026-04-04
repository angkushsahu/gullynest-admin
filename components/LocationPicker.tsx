"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type Prediction = {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
};

export type LocationValue = {
  lat: number;
  lng: number;
  locality: string;
  placeId: string;
  formattedAddress: string;
};

type Props = {
  value: LocationValue | null;
  onChange: (v: LocationValue | null) => void;
  error?: string;
};

function staticMapSrc(lat: number, lng: number) {
  return `${API_BASE}/api/maps/static?lat=${lat}&lng=${lng}&zoom=16&marker=1`;
}

export function LocationPicker({ value, onChange, error }: Props) {
  const [addressQuery, setAddressQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showPred, setShowPred] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [adjustingPin, setAdjustingPin] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Load Maps JS SDK on demand (only for adjust-pin)
  const loadMapsSDK = useCallback(() => {
    if (typeof window === "undefined") return;
    const g = window as typeof window & { google?: { maps?: unknown } };
    if (g.google?.maps) { setMapsLoaded(true); return; }
    const existing = document.querySelector("script[data-gm-loader]");
    if (existing) { existing.addEventListener("load", () => setMapsLoaded(true)); return; }
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
    if (!key) { console.warn("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set"); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async = true;
    script.dataset.gmLoader = "1";
    script.onload = () => setMapsLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Init interactive map when adjustingPin flips on
  useEffect(() => {
    if (!adjustingPin || !mapsLoaded || !value || !mapContainerRef.current) return;
    const center = { lat: value.lat, lng: value.lng };
    if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
    mapRef.current = new google.maps.Map(mapContainerRef.current, {
      center,
      zoom: 17,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "cooperative",
    });
    markerRef.current = new google.maps.Marker({
      position: center,
      map: mapRef.current,
      draggable: true,
      title: "Drag to adjust",
    });
    markerRef.current.addListener("dragend", async () => {
      const pos = markerRef.current?.getPosition();
      if (!pos) return;
      const lat = pos.lat();
      const lng = pos.lng();
      try {
        const r = await apiFetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
        const j = (await r.json()) as { formattedAddress: string | null; locality: string | null; placeId: string | null };
        onChange({
          lat,
          lng,
          locality: j.locality ?? value.locality,
          placeId: j.placeId ?? value.placeId,
          formattedAddress: j.formattedAddress ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        });
      } catch {
        onChange({ ...value, lat, lng });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustingPin, mapsLoaded]);

  // Address autocomplete
  useEffect(() => {
    if (!showPred || addressQuery.trim().length < 2) { setPredictions([]); return; }
    let cancelled = false;
    void (async () => {
      try {
        const r = await apiFetch(`/api/maps/autocomplete?q=${encodeURIComponent(addressQuery.trim())}&type=address`);
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as { predictions: Prediction[] };
        if (!cancelled) setPredictions(j.predictions ?? []);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [addressQuery, showPred]);

  const pickPrediction = async (p: Prediction) => {
    setShowPred(false);
    setPredictions([]);
    setAddressQuery(p.description);
    try {
      const r = await apiFetch(`/api/maps/place-location?placeId=${encodeURIComponent(p.placeId)}`);
      if (!r.ok) return;
      const j = (await r.json()) as { lat: number | null; lng: number | null; formattedAddress: string | null };
      if (j.lat != null && j.lng != null) {
        const locality = p.secondaryText.split(",")[0].trim() || p.mainText;
        onChange({
          lat: j.lat,
          lng: j.lng,
          locality,
          placeId: p.placeId,
          formattedAddress: j.formattedAddress ?? p.description,
        });
      }
    } catch { /* ignore */ }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const r = await apiFetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
          const j = (await r.json()) as { formattedAddress: string | null; locality: string | null; placeId: string | null };
          onChange({
            lat,
            lng,
            locality: j.locality ?? "",
            placeId: j.placeId ?? "",
            formattedAddress: j.formattedAddress ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          });
        } catch { /* ignore */ }
        setFetchingGps(false);
      },
      () => setFetchingGps(false),
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  const reset = () => {
    onChange(null);
    setAddressQuery("");
    setAdjustingPin(false);
    if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
    mapRef.current = null;
  };

  if (value) {
    return (
      <div className={`rounded-xl overflow-hidden border ${error ? "border-accent" : "border-[#DDDDDD]"}`}>
        {/* Static map */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={staticMapSrc(value.lat, value.lng)}
            alt="Property location"
            className="w-full block"
            style={{ height: 160, objectFit: "cover" }}
          />
          <div className="absolute top-2 right-2">
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white"
              style={{ color: "var(--green)", boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4.5" fill="var(--green)" />
                <path d="M3 5l1.5 1.5L7.5 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Location set
            </span>
          </div>
        </div>

        {/* Address row */}
        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[#222]">{value.locality}</div>
            <div className="text-[11px] text-[#717171] truncate">{value.formattedAddress}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setAdjustingPin((v) => {
                  if (!v) loadMapsSDK();
                  return !v;
                });
              }}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                adjustingPin
                  ? "bg-[#222] text-white border-[#222]"
                  : "bg-white text-[#222] border-[#222] hover:bg-[#F7F7F7]"
              }`}
            >
              {adjustingPin ? "✓ Done" : "Adjust pin"}
            </button>
            {!adjustingPin && (
              <button
                type="button"
                onClick={reset}
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[#DDDDDD] bg-white text-[#444] hover:border-[#999] cursor-pointer transition-all"
              >
                Change
              </button>
            )}
          </div>
        </div>

        {/* Interactive map */}
        {adjustingPin && (
          <div className="border-t border-[#E8E8E8]">
            {mapsLoaded ? (
              <>
                <div ref={mapContainerRef} className="w-full" style={{ height: 260 }} />
                <div className="px-4 py-2.5 bg-[#F7F7F7] text-[11px] text-[#717171]">
                  Drag the pin to mark the exact building entrance.
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-[#DDDDDD] border-t-[#222] rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* GPS */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={fetchingGps}
        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border-[1.5px] border-[#222] bg-[#222] text-white text-[13px] font-semibold cursor-pointer transition-all hover:bg-[#333] disabled:opacity-60"
      >
        {fetchingGps ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Getting location…
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="9" strokeWidth="1.5" strokeDasharray="2 3" />
            </svg>
            Use current location
          </>
        )}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#E8E8E8]" />
        <span className="text-[12px] text-[#B0B0B0]">or</span>
        <div className="flex-1 h-px bg-[#E8E8E8]" />
      </div>

      {/* Address search */}
      <div className="relative">
        <input
          className={`input pl-9 ${error ? "error" : ""}`}
          placeholder="Search address or locality…"
          value={addressQuery}
          onChange={(e) => { setAddressQuery(e.target.value); setShowPred(true); }}
          onFocus={() => addressQuery.length >= 2 && setShowPred(true)}
          onBlur={() => setTimeout(() => setShowPred(false), 150)}
          onKeyDown={(e) => { if (e.key === "Enter" && predictions.length > 0) void pickPrediction(predictions[0]); }}
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0B0B0] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        {showPred && predictions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#DDDDDD] rounded-xl shadow-lg z-50 max-h-52 overflow-y-auto py-1">
            {predictions.map((p) => (
              <li key={p.placeId}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void pickPrediction(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F7F7F7] border-0 bg-white cursor-pointer"
                >
                  <div className="text-[13px] font-semibold text-[#222]">{p.mainText}</div>
                  <div className="text-[11px] text-[#717171]">{p.secondaryText}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-[12px] text-accent -mt-1">{error}</p>}
    </div>
  );
}
