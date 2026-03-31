export type RevenueDay = {
  date: string;
  paymentsAmount: number;
  passesAmount: number;
  totalAmount: number;
};

export type AdminDashboardResponse = {
  pendingListings: number;
  liveListings: number;
  rejectedListings: number;
  totalListings: number;

  registeredAgents: number;
  searchers: number;
  listers: number;
  totalUsers: number;

  totalPaymentRecords: number;
  totalCapturedPaymentAmount: number;

  activeAgentPasses: number;
  expiringAgentPassesIn7Days: number;
  totalPassesRevenue: number;

  last7DaysRevenue: RevenueDay[];
};

export interface User {
  id: string;
  supabaseId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  packCount: number;
  packExpiry: string | null;
}

export type UserStatus = "authenticated" | "unauthenticated" | "loading";

export interface ToastState {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export interface AppContextType {
  dashboardData: AdminDashboardResponse;
  showToast: (message: string, type: ToastState["type"]) => void;
  user: User | null;
  userStatus: UserStatus;
}

export const initialDashboardData: AdminDashboardResponse = {
  pendingListings: 0,
  liveListings: 0,
  rejectedListings: 0,
  registeredAgents: 0,
  totalListings: 0,
  searchers: 0,
  listers: 0,
  totalUsers: 0,
  totalPaymentRecords: 0,
  totalCapturedPaymentAmount: 0,
  activeAgentPasses: 0,
  expiringAgentPassesIn7Days: 0,
  totalPassesRevenue: 0,
  last7DaysRevenue: [],
}