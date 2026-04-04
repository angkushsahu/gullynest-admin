"use client";

import { useCallback, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";

const CATEGORIES = [
  { value: "LIVING_ROOM", label: "Living room" },
  { value: "BEDROOM",     label: "Bedroom" },
  { value: "BATHROOM",    label: "Bathroom" },
  { value: "KITCHEN",     label: "Kitchen" },
  { value: "BALCONY",     label: "Balcony" },
  { value: "EXTERIOR",    label: "Building front" },
  { value: "LOCALITY",    label: "Locality" },
  { value: "DINING",      label: "Dining" },
  { value: "OTHER",       label: "Other" },
] as const;

type Category = typeof CATEGORIES[number]["value"];

export type UploadedPhoto = {
  id: string;
  url: string;
  category: Category;
  sortOrder: number;
};

type Props = {
  propertyId: string;
  initialPhotos?: UploadedPhoto[];
  onCountChange?: (count: number) => void;
};

export function PhotoUploader({ propertyId, initialPhotos = [], onCountChange }: Props) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>(initialPhotos);
  const [category, setCategory] = useState<Category>("LIVING_ROOM");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updatePhotos = useCallback((next: UploadedPhoto[]) => {
    setPhotos(next);
    onCountChange?.(next.length);
  }, [onCountChange]);

  const uploadFiles = useCallback(async (files: File[]) => {
    const valid = files.filter((f) => f.size > 0 && f.size <= 10 * 1024 * 1024);
    if (!valid.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("id", propertyId);
      fd.append("category", category);
      valid.forEach((f) => fd.append("files", f));
      const res = await apiFetch("/api/list/photos", { method: "POST", body: fd });
      if (!res.ok) return;
      const data = (await res.json()) as { photos?: UploadedPhoto[] };
      if (data.photos) updatePhotos([...photos, ...data.photos]);
    } catch { /* ignore */ }
    setUploading(false);
  }, [propertyId, category, photos, updatePhotos]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    void uploadFiles(Array.from(files));
  };

  const deletePhoto = async (photoId: string) => {
    setDeletingId(photoId);
    try {
      await apiFetch(`/api/list/photos?photoId=${encodeURIComponent(photoId)}&id=${encodeURIComponent(propertyId)}`, {
        method: "DELETE",
      });
      updatePhotos(photos.filter((p) => p.id !== photoId));
    } catch { /* ignore */ }
    setDeletingId(null);
  };

  // Group photos by category for display
  const groups = CATEGORIES
    .map((cat) => ({
      ...cat,
      photos: photos.filter((p) => p.category === cat.value),
    }))
    .filter((g) => g.photos.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Upload area */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-[12px] font-semibold text-[#717171] uppercase tracking-[0.05em] mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="input"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[12px] font-semibold text-[#717171] uppercase tracking-[0.05em] mb-1.5">
              &nbsp;
            </label>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn btn-secondary btn-md w-full"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  Select photos
                </>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </div>

        {/* Drag & drop zone */}
        <div
          className={`rounded-xl border-2 border-dashed py-8 text-center transition-colors cursor-pointer ${
            dragOver ? "border-[#222] bg-[#F7F7F7]" : "border-[#DDDDDD]"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <svg className="mx-auto mb-2 text-[#B0B0B0]" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <p className="text-[13px] text-[#717171]">
            Drag & drop photos here, or <span className="font-semibold text-[#222]">click to select</span>
          </p>
          <p className="text-[11px] text-[#B0B0B0] mt-1">Max 10 MB per image · JPG, PNG, WebP</p>
        </div>
      </div>

      {/* Photo grid grouped by category */}
      {photos.length === 0 ? (
        <p className="text-[13px] text-[#B0B0B0] text-center py-2">No photos uploaded yet.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.value}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[12px] font-semibold text-[#717171] uppercase tracking-[0.05em]">
                  {group.label}
                </span>
                <span className="text-[11px] text-[#B0B0B0]">({group.photos.length})</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {group.photos.map((photo) => (
                  <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-square bg-[#F0F0F0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => void deletePhoto(photo.id)}
                      disabled={deletingId === photo.id}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-[#222] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      {deletingId === photo.id ? (
                        <div className="w-3 h-3 border border-[#222] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <p className="text-[12px] text-[#717171] text-right">
          {photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded
        </p>
      )}
    </div>
  );
}
