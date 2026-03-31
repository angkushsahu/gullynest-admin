"use client";
import { useState } from "react";
import { AGENT_PASSES } from "@/lib/data";
import { useAdminApp } from "@/context/AdminAppContext";

export default function AdminPasses() {
  const { showToast } = useAdminApp();
  const [passes, setPasses] = useState(AGENT_PASSES);

  const sendReminder = (name: string) =>
    showToast(`Renewal reminder sent to ${name}`, "info");
  const sendAll = () => {
    showToast("Renewal reminders sent to all expiring agents", "success");
  };

  const totalRevenue = passes.reduce((s, p) => s + p.revenue, 0);
  const active = passes.filter((p) => p.status === "Active").length;
  const expiring = passes.filter((p) => p.status === "Expiring").length;
  const totalListings = passes.reduce((s, p) => s + p.used, 0);

  const STATUS_STYLE: Record<string, { badge: string; color: string }> = {
    Active: { badge: "badge-live", color: "#008A05" },
    Expiring: { badge: "badge-pending", color: "#B07D2A" },
    Expired: { badge: "badge-rejected", color: "#FF5A5F" },
  };

  return (
    <div className="p-8 animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold" style={{ letterSpacing: "-0.3px" }}>
            Agent passes
          </h1>
          <div className="text-[14px] text-[#717171] mt-0.5">
            ₹{totalRevenue.toLocaleString("en-IN")} collected this month
          </div>
        </div>
        <button className="btn btn-outline btn-sm">Export CSV</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          {
            label: "Active passes",
            value: active,
            sub: "Currently live",
            color: "#008A05",
          },
          {
            label: "Expiring this week",
            value: expiring,
            sub: "Need renewal",
            color: "#B07D2A",
          },
          {
            label: "Revenue this month",
            value: `₹${totalRevenue.toLocaleString("en-IN")}`,
            sub: `${passes.length} passes sold`,
            color: "#222",
          },
          {
            label: "Listings under passes",
            value: totalListings,
            sub: "Currently live",
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

      {expiring > 0 && (
        <div
          className="rounded-xl p-4 flex items-center justify-between mb-5"
          style={{ background: "#FDF5E6", border: "1px solid rgba(176,125,42,0.2)" }}
        >
          <div className="text-[13px] font-medium" style={{ color: "#B07D2A" }}>
            ⚠️ {expiring} pass{expiring !== 1 ? "es" : ""} expiring within 7 days
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
            key={p.name}
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
                    : p.daysLeft <= 14
                      ? "#B07D2A"
                      : "#717171",
              }}
            >
              {p.expires}
              {p.status !== "Expired" && p.daysLeft <= 14 && (
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
    </div>
  );
}
