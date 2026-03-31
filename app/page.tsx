"use client";
import Link from "next/link";
import { useAdminApp } from "@/context/AdminAppContext";
import { SEARCHER_USERS, AGENT_PASSES } from "@/lib/data";

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

const ACTIVITY = [
  {
    dot: "#B07D2A",
    text: "New listing submitted — 2 BHK Koramangala by Riya K.",
    time: "2 hrs ago",
  },
  { dot: "#008A05", text: "Pack purchased — Arjun M. · ₹499", time: "3 hrs ago" },
  {
    dot: "#008A05",
    text: "Listing approved and live — HSR Layout 1 BHK",
    time: "4 hrs ago",
  },
  {
    dot: "#0066CC",
    text: "Agent pass purchased — Ramesh Properties · ₹1,999",
    time: "5 hrs ago",
  },
  {
    dot: "#B07D2A",
    text: "New listing submitted — Room Indiranagar by Priya D.",
    time: "6 hrs ago",
  },
  {
    dot: "#FF5A5F",
    text: "Listing rejected — duplicate detected · Whitefield",
    time: "8 hrs ago",
  },
  {
    dot: "#008A05",
    text: "Verified badge awarded — 3 BHK Bellandur",
    time: "10 hrs ago",
  },
  { dot: "#008A05", text: "Pack purchased — Meena R. · ₹499", time: "12 hrs ago" },
];

export default function AdminDashboard() {
  const { sidebarData } = useAdminApp();
  const { pendingListings, liveListings, totalListings } = sidebarData;

  const activeAgentPasses = AGENT_PASSES.filter((p) => p.status === "Active").length;
  const expiringAgentPasses = AGENT_PASSES.filter(
    (p) => p.status === "Expiring" || p.daysLeft <= 7
  ).length;
  const totalPacksBought = SEARCHER_USERS.reduce((sum, u) => sum + u.packs, 0);
  const totalPackRevenue = totalPacksBought * 499;
  const totalAgentRevenue = AGENT_PASSES.length * 1999;
  const totalRevenue = totalPackRevenue + totalAgentRevenue;
  // Users active today

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
            value: String(totalPacksBought),
            sub: `₹${totalPackRevenue.toLocaleString("en-IN")} earned`,
            subColor: "#717171",
            href: "/users",
            btn: "View users →",
            btnColor: "#222",
          },
          {
            label: "Active agent passes",
            value: String(activeAgentPasses),
            sub:
              expiringAgentPasses > 0
                ? `${expiringAgentPasses} expiring soon`
                : "All passes healthy",
            subColor: expiringAgentPasses > 0 ? "#B07D2A" : "#008A05",
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
            {ACTIVITY.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3.5 hover:bg-[#FAFAFA] -mx-2 px-2 rounded transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0 mt-1.5 animate-pulse-dot"
                  style={{ background: item.dot }}
                />
                <div className="text-[13px] text-[#222] flex-1 leading-snug">
                  {item.text}
                </div>
                <div className="text-[11px] text-[#B0B0B0] flex-shrink-0 mt-0.5 whitespace-nowrap">
                  {item.time}
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
                Agent passes (2 expiring)
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
              Total platform revenue
            </div>
            <div className="flex items-end gap-1.5 h-14 mb-3">
              {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-500"
                  style={{ height: `${h}%`, background: i === 6 ? "#FF5A5F" : "#E8E8E8" }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-[#B0B0B0] mb-3">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i}>{d}</span>
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
                Packs: ₹{totalPackRevenue.toLocaleString("en-IN")}
              </span>
              <span style={{ color: "#0066CC" }}>
                Agents: ₹{totalAgentRevenue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
