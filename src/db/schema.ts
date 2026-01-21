import {
  pgTable,
  text,
  timestamp,
  decimal,
  boolean,
  integer,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["CREATOR", "CLIPPER"]);
export const campaignTypeEnum = pgEnum("campaign_type", ["CLIPPING", "UGC"]);
export const campaignStatusEnum = pgEnum("campaign_status", [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
]);
export const clipStatusEnum = pgEnum("clip_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "FLAGGED",
]);
export const platformEnum = pgEnum("platform", [
  "YOUTUBE",
  "TIKTOK",
  "INSTAGRAM",
  "TWITTER",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
]);

// Tables
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: userRoleEnum("role"),
  pixKey: text("pix_key"),
  avatarUrl: text("avatar_url"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  balance: decimal("balance", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id").primaryKey(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    type: campaignTypeEnum("type").notNull(),
    platforms: text("platforms").array().notNull(),
    budget: decimal("budget", { precision: 10, scale: 2 }).notNull(),
    spent: decimal("spent", { precision: 10, scale: 2 }).notNull().default("0"),
    ratePerMil: decimal("rate_per_mil", { precision: 10, scale: 2 }).notNull(),
    maxPayoutPerClip: decimal("max_payout_per_clip", {
      precision: 10,
      scale: 2,
    }),
    requirements: text("requirements").array().notNull().default([]),
    instructions: text("instructions"),
    sourceContent: text("source_content"),
    thumbnailUrl: text("thumbnail_url"),
    status: campaignStatusEnum("status").notNull().default("DRAFT"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("campaigns_creator_id_idx").on(table.creatorId),
    index("campaigns_status_idx").on(table.status),
  ]
);

export const clips = pgTable(
  "clips",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    clipperId: text("clipper_id")
      .notNull()
      .references(() => users.id),
    platform: platformEnum("platform").notNull(),
    videoUrl: text("video_url").notNull(),
    videoId: text("video_id").notNull(),
    verificationCode: text("verification_code").notNull(),
    isVerified: boolean("is_verified").notNull().default(false),
    viewsAtSubmission: integer("views_at_submission").notNull().default(0),
    currentViews: integer("current_views").notNull().default(0),
    earnings: decimal("earnings", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    status: clipStatusEnum("status").notNull().default("PENDING"),
    rejectionReason: text("rejection_reason"),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("clips_campaign_video_url_idx").on(
      table.campaignId,
      table.videoUrl
    ),
    index("clips_clipper_id_idx").on(table.clipperId),
    index("clips_status_idx").on(table.status),
    // Composite index for common query: get clips by campaign and status
    index("clips_campaign_status_idx").on(table.campaignId, table.status),
  ]
);

export const deposits = pgTable(
  "deposits",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentId: text("stripe_payment_id"),
    status: paymentStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("deposits_user_id_idx").on(table.userId)]
);

export const withdrawals = pgTable(
  "withdrawals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
    netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
    pixKey: text("pix_key").notNull(),
    status: paymentStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    processedAt: timestamp("processed_at"),
  },
  (table) => [
    index("withdrawals_user_id_idx").on(table.userId),
    index("withdrawals_status_idx").on(table.status),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
  clips: many(clips),
  deposits: many(deposits),
  withdrawals: many(withdrawals),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  creator: one(users, {
    fields: [campaigns.creatorId],
    references: [users.id],
  }),
  clips: many(clips),
}));

export const clipsRelations = relations(clips, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [clips.campaignId],
    references: [campaigns.id],
  }),
  clipper: one(users, {
    fields: [clips.clipperId],
    references: [users.id],
  }),
}));

export const depositsRelations = relations(deposits, ({ one }) => ({
  user: one(users, {
    fields: [deposits.userId],
    references: [users.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Clip = typeof clips.$inferSelect;
export type NewClip = typeof clips.$inferInsert;
export type Deposit = typeof deposits.$inferSelect;
export type NewDeposit = typeof deposits.$inferInsert;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;
