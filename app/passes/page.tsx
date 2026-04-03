"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminApp } from "@/context/AdminAppContext";
import { apiFetch } from "@/lib/api-fetch";

type PassApiItem = {
  userId: string;
  agentName: string;
  reraNo: string | null;
  packBoughtDate: string | null;
  packExpiresIn: string | null;
  listingsCreatedThroughCurrentPass: number;
  revenueGeneratedThroughCurrentPass: number;
  active: boolean;
};

type PassesApiResponse = {
  summary: {
    agentPassesSoldThisMonth: number;
    amountGeneratedByAgentPassesThisMonth: number;
    listingsCreatedByUsingAgentPassesThisMonth: number;
  };
  items: PassApiItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

function formatShortDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function daysLeft(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function AdminPasses() {
  const { showToast, dashboardData } = useAdminApp();
  const { activeAgentPasses, expiringAgentPassesIn7Days } = dashboardData;
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PassesApiResponse["summary"]>({
    agentPassesSoldThisMonth: 0,
    amountGeneratedByAgentPassesThisMonth: 0,
    listingsCreatedByUsingAgentPassesThisMonth: 0,
  });
  const [pagination, setPagination] = useState<PassesApiResponse["pagination"]>({
    page: 1,
    pageSize: 8,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [passes, setPasses] = useState<
    Array<{
      id: string;
      name: string;
      rera: string;
      bought: string;
      expires: string;
      daysLeft: number | null;
      used: number;
      max: number;
      revenue: number;
      status: "Active" | "Expiring" | "Expired";
    }>
  >([]);

  useEffect(() => {
    (async function loadPasses() {
      try {
        setLoading(true);
        const response = await apiFetch(`/api/admin/passes?page=${page}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("failed_to_load_passes");
        const data = (await response.json()) as PassesApiResponse;
        setSummary(data.summary);
        setPagination(data.pagination);
        setPasses(
          (data.items ?? []).map((item) => {
            const left = daysLeft(item.packExpiresIn);
            const status: "Active" | "Expiring" | "Expired" = !item.active
              ? "Expired"
              : left !== null && left <= 7
                ? "Expiring"
                : "Active";
            return {
              id: item.userId,
              name: item.agentName || "—",
              rera: item.reraNo || "—",
              bought: formatShortDate(item.packBoughtDate),
              expires: formatShortDate(item.packExpiresIn),
              daysLeft: left,
              used: item.listingsCreatedThroughCurrentPass,
              max: 10,
              revenue: item.revenueGeneratedThroughCurrentPass,
              status,
            };
          })
        );
      } catch {
        showToast("Could not load agent pass data", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, showToast]);

  const sendReminder = (name: string) =>
    showToast(`Renewal reminder sent to ${name}`, "info");
  const sendAll = () => {
    showToast("Renewal reminders sent to all expiring agents", "success");
  };

  const STATUS_STYLE: Record<string, { badge: string; color: string }> = {
    Active: { badge: "badge-live", color: "#008A05" },
    Expiring: { badge: "badge-pending", color: "#B07D2A" },
    Expired: { badge: "badge-rejected", color: "#FF5A5F" },
  };
  const soldThisMonth = summary.agentPassesSoldThisMonth;
  const revenueThisMonth = summary.amountGeneratedByAgentPassesThisMonth;
  const listingsThisMonth = summary.listingsCreatedByUsingAgentPassesThisMonth;
  const expiringCountOnPage = useMemo(
    () => passes.filter((p) => p.status === "Expiring").length,
    [passes]
  );

  return (
    <div className="p-8 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold" style={{ letterSpacing: "-0.3px" }}>
            Agent passes
          </h1>
          <div className="text-[14px] text-[#717171] mt-0.5">
            ₹{revenueThisMonth.toLocaleString("en-IN")} collected this month
          </div>
        </div>
        <button className="btn btn-outline btn-sm">Export CSV</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          {
            label: "Active passes",
            value: activeAgentPasses,
            sub: "Currently live",
            color: "#008A05",
          },
          {
            label: "Expiring this week",
            value: expiringAgentPassesIn7Days,
            sub: "Need renewal",
            color: "#B07D2A",
          },
          {
            label: "Revenue this month",
            value: `₹${revenueThisMonth.toLocaleString("en-IN")}`,
            sub: `${soldThisMonth} passes sold`,
            color: "#222",
          },
          {
            label: "Listings under passes",
            value: listingsThisMonth,
            sub: "Created this month",
            color: "#0066CC",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white border border-[#E8E8E8] rounded-2xl p-5 hover:shadow-sm transition-shadow"
          >
            <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-2">
              {card.label}
            </div>
            <div
              className="text-[26px] font-bold mb-1"
              style={{ letterSpacing: "-0.5px", color: card.color }}
            >
              {card.value}
            </div>
            <div className="text-[12px] text-[#717171]">{card.sub}</div>
          </div>
        ))}
      </div>

      {expiringAgentPassesIn7Days > 0 && (
        <div
          className="rounded-xl p-4 flex items-center justify-between mb-5"
          style={{ background: "#FDF5E6", border: "1px solid rgba(176,125,42,0.2)" }}
        >
          <div className="text-[13px] font-medium" style={{ color: "#B07D2A" }}>
            ⚠️ {expiringAgentPassesIn7Days} pass{expiringAgentPassesIn7Days !== 1 ? "es" : ""} expiring within 7 days
          </div>
          <button
            onClick={sendAll}
            className="text-[13px] font-semibold bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif]"
            style={{ color: "#B07D2A" }}
          >
            Send all renewal reminders →
          </button>
        </div>
      )}
      {expiringAgentPassesIn7Days === 0 && expiringCountOnPage > 0 && (
        <div
          className="rounded-xl p-4 flex items-center justify-between mb-5"
          style={{ background: "#FDF5E6", border: "1px solid rgba(176,125,42,0.2)" }}
        >
          <div className="text-[13px] font-medium" style={{ color: "#B07D2A" }}>
            ⚠️ {expiringCountOnPage} pass{expiringCountOnPage !== 1 ? "es" : ""} in this page are expiring soon
          </div>
        </div>
      )}

      <div className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden">
        <div
          className="grid bg-[#F7F7F7] border-b border-[#E8E8E8] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0]"
          style={{ gridTemplateColumns: "1fr 200px 90px 90px 1fr 90px 80px 140px" }}
        >
          {[
            "Agent",
            "RERA No.",
            "Bought",
            "Expires",
            "Listings",
            "Revenue",
            "Status",
            "Actions",
          ].map((h) => (
            <div key={h}>{h}</div>
          ))}
        </div>

        {passes.map((p) => (
          <div
            key={p.id}
            className="grid items-center px-5 border-b border-[#E8E8E8] last:border-0 hover:bg-[#FAFAFA] transition-colors"
            style={{
              gridTemplateColumns: "1fr 200px 90px 90px 1fr 90px 80px 140px",
              minHeight: "64px",
              opacity: p.status === "Expired" ? 0.65 : 1,
            }}
          >
            <div className="text-[13px] font-semibold">{p.name}</div>
            <div className="text-[11px] text-[#717171] font-mono truncate">{p.rera}</div>
            <div className="text-[13px] text-[#717171]">{p.bought}</div>
            <div
              className="text-[13px]"
              style={{
                color:
                  p.status === "Expired"
                    ? "#FF5A5F"
                    : p.daysLeft !== null && p.daysLeft <= 14
                      ? "#B07D2A"
                      : "#717171",
              }}
            >
              {p.expires}
              {p.status !== "Expired" && p.daysLeft !== null && p.daysLeft <= 14 && (
                <div className="text-[10px]">{p.daysLeft}d left</div>
              )}
            </div>
            <div>
              <div className="text-[13px] font-semibold mb-0.5">
                {p.used}/{p.max}
              </div>
              <div className="h-1.5 bg-[#F0F0F0] rounded-full w-20">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${(p.used / p.max) * 100}%`,
                    background: p.used === p.max ? "#FF5A5F" : "#008A05",
                  }}
                />
              </div>
            </div>
            <div className="text-[13px] font-semibold">
              ₹{p.revenue.toLocaleString("en-IN")}
            </div>
            <div>
              <span className={`badge ${STATUS_STYLE[p.status]?.badge || "badge-gray"}`}>
                {p.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-[12px] font-medium text-[#0066CC] bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif] p-0">
                View
              </button>
              {p.status !== "Active" && (
                <button
                  onClick={() => sendReminder(p.name)}
                  className="text-[11px] font-medium text-[#008A05] bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif] p-0 whitespace-nowrap"
                >
                  Remind
                </button>
              )}
              {p.status === "Active" && (
                <button className="text-[12px] font-medium text-accent bg-transparent border-0 cursor-pointer hover:underline font-[Sora,sans-serif] p-0">
                  Suspend
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 text-[13px] text-[#717171]">
        <span>
          {loading
            ? "Loading passes..."
            : `Showing ${passes.length} of ${pagination.total}`}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={!pagination.hasPrevPage || loading}
            className="btn btn-outline btn-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-2 py-1 text-[12px] text-[#717171]">
            Page {pagination.page} / {Math.max(1, pagination.totalPages)}
          </span>
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!pagination.hasNextPage || loading}
            className="btn btn-outline btn-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
