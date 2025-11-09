// Minimal, robust state + helpers for the redeem flow.
// Persists to localStorage so it survives reloads during demo.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import QRCode from "qrcode";
import { nanoid } from "nanoid";

export type Tier = "Bronze" | "Silver" | "Gold" | "Platinum";

export type Reward = {
  id: string;
  title: string;
  partner: string;
  description?: string;
  pointsCost: number;
  tier: Tier;            // minimum tier required
  stock?: number;        // undefined = unlimited for demo
  image?: string;        // optional card art
};

export type Ticket = {
  id: string;            // ticket id
  rewardId: string;
  title: string;
  partner: string;
  pointsSpent: number;
  issuedAt: number;      // ms
  expiresAt: number;     // ms
  qrPayload: string;     // what we encode
  qrDataUrl: string;     // rendered QR as data URL
  status: "active" | "used" | "expired";
};

export type UserState = {
  points: number;
  tier: Tier;
};

type EngineState = {
  user: UserState;
  rewards: Reward[];
  tickets: Ticket[];
  // actions
  setUserPoints: (pts: number) => void;
  addPoints: (delta: number) => void;
  redeem: (rewardId: string) => Promise<Ticket>;
  markUsed: (ticketId: string) => void;
  expireSweep: () => void;
};

export const tierThresholds: Record<Tier, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 1500,
  Platinum: 5000,
};

function computeTier(points: number): Tier {
  if (points >= tierThresholds.Platinum) return "Platinum";
  if (points >= tierThresholds.Gold) return "Gold";
  if (points >= tierThresholds.Silver) return "Silver";
  return "Bronze";
}

// Demo catalog (adjust to your visuals)
export const CATALOG: Reward[] = [
  { id: "coffee10", title: "£10 Coffee Voucher", partner: "Campus Coffee", pointsCost: 250, tier: "Bronze" },
  { id: "spotify1m", title: "1 mo Spotify Premium", partner: "Spotify", pointsCost: 750, tier: "Silver" },
  { id: "gymday", title: "Premium Gym Day Pass", partner: "Anytime Fitness", pointsCost: 1600, tier: "Gold" },
  { id: "weekendLite", title: "Weekend Getaway Lite", partner: "Student Breaks", pointsCost: 4800, tier: "Platinum" },
];

export const useRewardsEngine = create<EngineState>()(
  persist(
    (set, get) => ({
      user: { points: 1250, tier: computeTier(1250) }, // demo balance
      rewards: CATALOG,
      tickets: [],

      setUserPoints: (pts) => set({ user: { points: pts, tier: computeTier(pts) } }),
      addPoints: (delta) => {
        const pts = Math.max(0, get().user.points + delta);
        set({ user: { points: pts, tier: computeTier(pts) } });
      },

      // Core redeem: checks balance/tier/stock, creates time-limited ticket, deducts points.
      redeem: async (rewardId: string) => {
        const state = get();
        const reward = state.rewards.find(r => r.id === rewardId);
        if (!reward) throw new Error("Reward not found.");

        // Stock check (if enabled)
        if (typeof reward.stock === "number" && reward.stock <= 0) {
          throw new Error("Out of stock.");
        }

        // Tier check
        const requiredTier = reward.tier;
        const tiers: Tier[] = ["Bronze", "Silver", "Gold", "Platinum"];
        if (tiers.indexOf(state.user.tier) < tiers.indexOf(requiredTier)) {
          throw new Error(`Requires ${requiredTier} tier.`);
        }

        // Points check
        if (state.user.points < reward.pointsCost) {
          throw new Error("Not enough points.");
        }

        // Deduct points
        const newPts = state.user.points - reward.pointsCost;
        set({ user: { points: newPts, tier: computeTier(newPts) } });

        // Optional: reduce stock
        if (typeof reward.stock === "number") {
          const updated = state.rewards.map(r => r.id === reward.id ? { ...r, stock: r.stock! - 1 } : r);
          set({ rewards: updated });
        }

        // Build QR payload and image (15-minute expiry)
        const id = nanoid(12);
        const now = Date.now();
        const expiresAt = now + 15 * 60 * 1000;

        const payload = JSON.stringify({
          t: "savr.redeem",
          ticket: id,
          rewardId: reward.id,
          title: reward.title,
          partner: reward.partner,
          issuedAt: now,
          expiresAt,
          // simple anti-replay salt
          sig: nanoid(10),
        });

        const qrDataUrl = await QRCode.toDataURL(payload, { width: 512, margin: 1 });

        const ticket: Ticket = {
          id,
          rewardId: reward.id,
          title: reward.title,
          partner: reward.partner,
          pointsSpent: reward.pointsCost,
          issuedAt: now,
          expiresAt,
          qrPayload: payload,
          qrDataUrl,
          status: "active",
        };

        set({ tickets: [ticket, ...get().tickets] });
        return ticket;
      },

      markUsed: (ticketId) => {
        const updated = get().tickets.map(t =>
          t.id === ticketId ? { ...t, status: "used" as const } : t
        );
        set({ tickets: updated });
      },

      // Expire tickets that passed expiry
      expireSweep: () => {
        const now = Date.now();
        const updated = get().tickets.map(t =>
          t.status === "active" && t.expiresAt < now ? { ...t, status: "expired" as const } : t
        );
        set({ tickets: updated });
      },
    }),
    { name: "savr-redeem-v1" }
  )
);
