"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminApp } from "@/context/AdminAppContext";

const DAY = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
function todayLabel() {
  const d = new Date();
  return `${DAY[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

type RecentActivity = {
  id: string;
  type:
    | "listing_submitted"
    | "listing_live"
    | "listing_rejected"
    | "listing_verified"
    | "pack_purchased"
    | "agent_pass_purchased";
  text: string;
  at: string;
};

function relativeTime(iso: string) {
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return "just now";
  const diffMs = Date.now() - at;
  if (diffMs <= 0) return "just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function activityDot(type: RecentActivity["type"]) {
  if (type === "listing_rejected") return "#FF5A5F";
  if (type === "agent_pass_purchased") return "#0066CC";
  if (type === "listing_submitted") return "#B07D2A";
  return "#008A05";
}

export default function AdminDashboard() {
  const { dashboardData } = useAdminApp();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const {
    activeAgentPasses,
    expiringAgentPassesIn7Days,
    last7DaysRevenue,
    liveListings,
    pendingListings,
    totalCapturedPaymentAmount,
    totalListings,
    totalPaymentRecords,
  } = dashboardData;

  const revenueSeries = (last7DaysRevenue ?? []).slice(-7);
  const chartMax = Math.max(
    ...revenueSeries.map((entry) => entry.totalAmount),
    1
  );
  const totalRevenue = revenueSeries.reduce((sum, entry) => sum + entry.totalAmount, 0);
  const totalPaymentRevenue = revenueSeries.reduce(
    (sum, entry) => sum + entry.paymentsAmount,
    0
  );
  const totalPassRevenue = revenueSeries.reduce((sum, entry) => sum + entry.passesAmount, 0);

  useEffect(() => {
    (async function loadActivity() {
      try {
        const response = await fetch("http://localhost:3000/api/admin/activity", {
          credentials: "include",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { items?: RecentActivity[] };
        setActivities(Array.isArray(data.items) ? data.items.slice(0, 8) : []);
      } catch {
        // Keep empty activity state on network failures.
      }
    })();
  }, []);

  return (
    <div className="p-8 animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold" style={{ letterSpacing: "-0.3px" }}>
            Good morning, Admin 👋
          </h1>
          <div className="text-[14px] text-[#717171] mt-0.5">{todayLabel()}</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Pending review",
            value: String(pendingListings),
            sub: pendingListings > 0 ? "Needs attention" : "All clear ✓",
            subColor: pendingListings > 0 ? "#B07D2A" : "#008A05",
            href: "/listings",
            btn: "Review now →",
            btnColor: "#B07D2A",
          },
          {
            label: "Live listings",
            value: String(liveListings),
            sub: `${totalListings} total submitted`,
            subColor: "#008A05",
            href: "/listings?filter=all",
            btn: "View all →",
            btnColor: "#222",
          },
          {
            label: "Total pack purchases",
            value: String(totalPaymentRecords),
            sub: `₹${totalCapturedPaymentAmount.toLocaleString("en-IN")} earned`,
            subColor: "#717171",
            href: "/users",
            btn: "View users →",
            btnColor: "#222",
          },
          {
            label: "Active agent passes",
            value: String(activeAgentPasses),
            sub:
            expiringAgentPassesIn7Days > 0
                ? `${expiringAgentPassesIn7Days} expiring soon`
                : "All passes healthy",
            subColor: expiringAgentPassesIn7Days > 0 ? "#B07D2A" : "#008A05",
            href: "/passes",
            btn: "View passes →",
            btnColor: "#222",
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
              className="text-[36px] font-bold mb-1"
              style={{ letterSpacing: "-0.8px" }}
            >
              {card.value}
            </div>
            <div className="text-[12px] mb-3" style={{ color: card.subColor }}>
              {card.sub}
            </div>
            <Link
              href={card.href}
              className="text-[12px] font-semibold no-underline transition-colors hover:underline"
              style={{ color: card.btnColor }}
            >
              {card.btn}
            </Link>
          </div>
        ))}
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Activity feed */}
        <div className="bg-white border border-[#E8E8E8] rounded-2xl p-6">
          <div className="text-[15px] font-semibold mb-5">Recent activity</div>
          <div className="flex flex-col divide-y divide-[#F7F7F7]">
            {activities.length === 0 && (
              <div className="text-[13px] text-[#717171] py-3">No recent activity yet.</div>
            )}
            {activities.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 py-3.5 hover:bg-[#FAFAFA] -mx-2 px-2 rounded transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0 mt-1.5 animate-pulse-dot"
                  style={{ background: activityDot(item.type) }}
                />
                <div className="text-[13px] text-[#222] flex-1 leading-snug">
                  {item.text}
                </div>
                <div className="text-[11px] text-[#B0B0B0] shrink-0 mt-0.5 whitespace-nowrap">
                  {relativeTime(item.at)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions + Revenue */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-6">
            <div className="text-[15px] font-semibold mb-4">Quick actions</div>
            <div className="flex flex-col gap-2">
              <Link
                href="/listings"
                className="w-full py-3 rounded-xl text-[13px] font-semibold text-center no-underline block transition-all hover:opacity-90 active:scale-98"
                style={{ background: "#FDF5E6", color: "#B07D2A" }}
              >
                Review {pendingListings} pending →
              </Link>
              <Link
                href="/listings?filter=all"
                className="btn btn-outline btn-sm w-full justify-center no-underline"
              >
                View all listings
              </Link>
              <Link
                href="/passes"
                className="btn btn-sm w-full justify-center no-underline border"
                style={{ borderColor: "#B07D2A", color: "#B07D2A", background: "white" }}
              >
                Agent passes {expiringAgentPassesIn7Days > 0 ? `(${expiringAgentPassesIn7Days} expiring)` : null}
              </Link>
              <Link
                href="/users"
                className="btn btn-outline btn-sm w-full justify-center no-underline"
              >
                View all users
              </Link>
            </div>
          </div>

          {/* Mini revenue chart */}
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B0B0B0] mb-4">
              Last 7 days revenue
            </div>
            <div className="flex items-end gap-1.5 h-14 mb-3">
              {revenueSeries.map((entry, i) => (
                <div
                  key={entry.date}
                  className="flex-1 rounded-sm transition-all duration-500"
                  style={{
                    height: `${Math.max((entry.totalAmount / chartMax) * 100, 6)}%`,
                    background: i === revenueSeries.length - 1 ? "#FF5A5F" : "#E8E8E8",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-[#B0B0B0] mb-3">
              {revenueSeries.map((entry) => (
                <span key={entry.date}>
                  {new Date(entry.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                  })[0]}
                </span>
              ))}
            </div>
            <div className="text-[18px] font-bold">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-[12px] text-[#717171] mt-0.5">
              Packs + agent passes combined
            </div>
            <div className="flex gap-3 mt-2 text-[11px]">
              <span style={{ color: "#008A05" }}>
                Payments: ₹{totalPaymentRevenue.toLocaleString("en-IN")}
              </span>
              <span style={{ color: "#0066CC" }}>
                Agents: ₹{totalPassRevenue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
