"use client";

import "@/styles/globals.css";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ToastContainer from "@/components/ui/ToastContainer";
import { AdminAppProvider, useAdminApp } from "@/context/AdminAppContext";
import { Sidebar } from "@/components/sidebar";



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
  const { user, userStatus, signInWithGoogle, signOut } = useAdminApp();
  const router = useRouter();

  useEffect(() => {
    if (userStatus !== "authenticated") return;
    if (!user || !user.isAdmin) router.push("/");
  }, [router, user, userStatus]);

  if (userStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-[14px] text-[#717171]">Checking session...</div>
      </div>
    );
  }

  if (userStatus === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="bg-white border border-[#E8E8E8] rounded-2xl p-8 w-full max-w-[420px] text-center">
          <h2 className="text-[22px] font-bold mb-2">Admin sign in</h2>
          <p className="text-[14px] text-[#717171] mb-6">
            Continue with Google to access the admin dashboard.
          </p>
          <button onClick={() => void signInWithGoogle()} className="btn btn-primary btn-md w-full">
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  if (!user?.isAdmin)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-[20px] font-bold mb-2">Admin access required</h2>
          <p className="text-[14px] text-[#717171] mb-6">
            Sign in with admin credentials to access this panel.
          </p>
          <button
            onClick={() => void signOut()}
            className="btn btn-outline btn-md inline-flex"
          >
            Sign out
          </button>
          <Link
            href="/"
            className="btn btn-secondary btn-md mt-4 inline-flex no-underline"
          >
            Go to home
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">{children}</main>
    </div>
  );
}
