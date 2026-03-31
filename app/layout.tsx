"use client";

import "@/styles/globals.css";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AGENT_PASSES } from "@/lib/data";
import ToastContainer from "@/components/ui/ToastContainer";
import { AdminAppProvider, useAdminApp } from "@/context/AdminAppContext";

const NAV = [
  { href: "/", icon: "📊", label: "Dashboard" },
  {
    href: "/listings",
    icon: "⏳",
    label: "Pending review",
    badge: "pending",
  },
  {
    href: "/listings?filter=all",
    icon: "🏠",
    label: "All listings",
    badge: "all",
  },
  { href: "/users", icon: "👥", label: "Users" },
  { href: "/passes", icon: "💳", label: "Agent passes" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
          <AdminAppProvider>
            <LayoutComponent>
              {children}
              <ToastContainer />
            </LayoutComponent>
          </AdminAppProvider>
      </body>
    </html>
  );
}

function LayoutComponent({ children }: { children: React.ReactNode }) {
  const { sidebarData, user, userStatus } = useAdminApp();
  const { pendingListings, liveListings, totalListings, totalUsers } = sidebarData;

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (userStatus !== "authenticated") return;
    if (!user || !user.isAdmin) router.push("/");
  }, [user]);

  if (userStatus !== "authenticated") return null;

  if (!user?.isAdmin)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-[20px] font-bold mb-2">Admin access required</h2>
          <p className="text-[14px] text-[#717171] mb-6">
            Sign in with admin credentials to access this panel.
          </p>
          <Link
            href="/"
            className="btn btn-secondary btn-md mt-4 inline-flex no-underline"
          >
            Go to home
          </Link>
        </div>
      </div>
    );

  const activeAgentCount = AGENT_PASSES.filter((p) => p.status === "Active").length;

  const getBadgeCount = (badge?: string) => {
    if (badge === "pending") return pendingListings;
    if (badge === "all") return totalListings;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-[#E8E8E8] shrink-0 flex flex-col fixed left-0 top-0 bottom-0 z-50">
        <div className="p-6 border-b border-[#E8E8E8]">
          <Link href="/" className="block no-underline">
            <div className="text-[18px] font-bold">
              <span style={{ color: "#FF5A5F" }}>gully</span>
              <span style={{ color: "#222" }}>nest</span>
              <span className="ml-2 text-[11px] font-semibold bg-[#222] text-white px-2 py-0.5 rounded-full align-middle">
                Admin
              </span>
            </div>
          </Link>
          <div className="text-[12px] text-[#717171] mt-1">admin@gullynest.in</div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/listings" && pathname === "/listings");
            const count = getBadgeCount(item.badge);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-item ${isActive ? "active" : ""}`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {count !== null && count > 0 && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-accent text-white" : item.badge === "pending" ? "bg-[#FDF5E6] text-[#B07D2A]" : "bg-[#F0F0F0] text-[#717171]"}`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="mt-4 pt-4 border-t border-[#E8E8E8]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#B0B0B0] px-3 mb-2">
              Quick stats
            </div>
            {[
              {
                label: `${pendingListings} pending`,
                bg: "#FDF5E6",
                color: "#B07D2A",
              },
              { label: `${liveListings} live`, bg: "#EBFAEB", color: "#008A05" },
              {
                label: `${activeAgentCount} agents`,
                bg: "#E8F0FB",
                color: "#0066CC",
              },
              {
                label: `${totalUsers} users`,
                bg: "#F3F0FF",
                color: "#4B3DC8",
              },
            ].map((s) => (
              <div key={s.label} className="px-3 py-1">
                <span
                  className="inline-block text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{ background: s.bg, color: s.color }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-[#E8E8E8]">
          <Link
            href="/"
            className="text-[12px] text-[#717171] no-underline hover:text-[#222] transition-colors flex items-center gap-1.5"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to site
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-60 min-h-screen">{children}</main>
    </div>
  );
}
