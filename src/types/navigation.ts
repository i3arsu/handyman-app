import { UserRole } from '@/types/auth';

// ─── Root Stack (single navigator that owns all top-level screens) ───────────
export type RootStackParamList = {
  Auth: undefined;
  ClientApp: undefined;
  HandymanApp: undefined;
};

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Register: { role: UserRole };
  HandymanVerification: { email: string; password: string };
};

// ─── Client Stack (wraps tabs + detail screens) ──────────────────────────────
export type ClientStackParamList = {
  Tabs: undefined;
  JobProgress: { jobId: string };
  Chat: { jobId: string; counterpartyName: string; counterpartyInitials: string };
  Notifications: undefined;
  EditProfile: undefined;
};

// ─── Client Tab Navigator ────────────────────────────────────────────────────
export type ClientTabParamList = {
  Explore: undefined;
  Dashboard: undefined;
  Settings: undefined;
};

// ─── Post Job Stack (nested inside the Explore tab) ──────────────────────────
export type PostJobStackParamList = {
  SelectCategory: undefined;
  JobDetails: { category: string };
  ReviewPost: {
    category: string;
    title: string;
    description: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    isUrgent: boolean;
  };
};

// ─── Handyman Stack (wraps tabs + detail screens) ────────────────────────────
export type HandymanStackParamList = {
  Tabs: undefined;
  ListView: undefined;
  JobInformation: {
    jobId: string;
    jobTitle: string;
    jobDescription: string | null;
    jobAddress: string | null;
    locationLat: number | null;
    locationLng: number | null;
    category: string;
    isUrgent: boolean;
    payout: number;
    showUpFee: number;
    scheduledStart: string | null;
    createdAt: string;
  };
  Notifications: undefined;
  PricingRouting: {
    jobId: string;
    jobTitle: string;
    jobAddress: string | null;
    category: string | null;
  };
  Chat: { jobId: string; counterpartyName: string; counterpartyInitials: string };
  EditProfile: undefined;
};

// ─── Handyman Tab Navigator ──────────────────────────────────────────────────
export type HandymanTabParamList = {
  MapView: undefined;
  MyJobs: undefined;
  Profile: undefined;
};
