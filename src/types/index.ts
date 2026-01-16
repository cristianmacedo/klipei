// Re-export types from schema
export type {
  User,
  NewUser,
  Campaign,
  NewCampaign,
  Clip,
  NewClip,
  Deposit,
  NewDeposit,
  Withdrawal,
  NewWithdrawal,
} from "@/db/schema";

// Extended types with relations
export type CampaignWithCreator = {
  campaigns: import("@/db/schema").Campaign;
  users: import("@/db/schema").User;
};

export type ClipWithRelations = {
  clips: import("@/db/schema").Clip;
  campaigns: import("@/db/schema").Campaign;
  users: import("@/db/schema").User;
};

// Form types
export type CreateCampaignInput = {
  title: string;
  description: string;
  type: "CLIPPING" | "UGC";
  platforms: string[];
  budget: number;
  ratePerMil: number;
  maxPayoutPerClip?: number;
  requirements?: string[];
  instructions?: string;
  sourceContent?: string;
  thumbnailUrl?: string;
};

export type SubmitClipInput = {
  campaignId: string;
  videoUrl: string;
  comment?: string;
};

// API response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Constants
export const MINIMUM_WITHDRAWAL_AMOUNT = 50; // R$50
export const WITHDRAWAL_FEE_PERCENTAGE = 0.05; // 5%
export const MINIMUM_BUDGET = 50; // R$50
export const MINIMUM_RATE_PER_MIL = 0.5; // R$0.50
export const MAXIMUM_RATE_PER_MIL = 50; // R$50

// Platform type
export type Platform = "YOUTUBE" | "TIKTOK" | "INSTAGRAM" | "TWITTER";
export type UserRole = "CREATOR" | "CLIPPER";
export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
export type ClipStatus = "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";
