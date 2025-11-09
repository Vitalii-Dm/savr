'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Star, Gem, Trophy, Gift, Ticket, Dumbbell, Utensils } from 'lucide-react';

/** 
 * Props:
 *  - points: current user points (e.g., 1250)
 *  - onRedeem?: (rewardId: string) => void
 */
type RewardsProProps = {
  points: number;
  onRedeem?: (rewardId: string) => void;
};

type TierId = 'bronze' | 'silver' | 'gold' | 'platinum';

type Tier = {
  id: TierId;
  name: string;
  min: number;
  max?: number;
  icon: React.ReactNode;
  // Metallic gradient stops for the capsule card
  gradient: string;
  // Subtle iridescent border glow color
  glow: string;
  perks: { icon: React.ReactNode; label: string }[];
};

const TIERS: Tier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    min: 100,
    max: 499,
    icon: <Trophy className="h-5 w-5" />,
    gradient: 'bg-[linear-gradient(135deg,#7a4c22_0%,#c3833d_55%,#6a3b17_100%)]',
    glow: 'shadow-[0_0_0_2px_rgba(195,131,61,0.35)]',
    perks: [
      { icon: <Ticket className="h-4 w-4" />, label: 'Student discounts' },
      { icon: <Gift className="h-4 w-4" />, label: 'Cashback vouchers' },
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    min: 500,
    max: 1499,
    icon: <Star className="h-5 w-5" />,
    gradient: 'bg-[linear-gradient(135deg,#bfc6cf_0%,#e6ebf1_55%,#9aa3ad_100%)]',
    glow: 'shadow-[0_0_0_2px_rgba(191,198,207,0.35)]',
    perks: [
      { icon: <Ticket className="h-4 w-4" />, label: 'Cinema passes' },
      { icon: <Utensils className="h-4 w-4" />, label: 'Restaurant deals' },
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    min: 1500,
    max: 4999,
    icon: <Crown className="h-5 w-5" />,
    gradient: 'bg-[linear-gradient(135deg,#cfa63a_0%,#ffe07a_50%,#bb8b12_100%)]',
    glow: 'shadow-[0_0_0_2px_rgba(255,224,122,0.40)]',
    perks: [
      { icon: <Gift className="h-4 w-4" />, label: 'Luxury experiences' },
      { icon: <Ticket className="h-4 w-4" />, label: 'Weekend getaways' },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    min: 5000,
    icon: <Gem className="h-5 w-5" />,
    gradient: 'bg-[linear-gradient(135deg,#a9b6ff_0%,#b7e3ff_35%,#d0b0ff_70%,#9bd5ff_100%)]',
    glow: 'shadow-[0_0_0_2px_rgba(169,182,255,0.40)]',
    perks: [
      { icon: <Dumbbell className="h-4 w-4" />, label: 'Premium gyms' },
      { icon: <Gift className="h-4 w-4" />, label: 'Designer rentals' },
    ],
  },
];

type Reward = {
  id: string;
  title: string;
  cost: number;
  tier: TierId;
  art: string; // emoji or small art marker
  blurb: string;
};

const CATALOG: Reward[] = [
  { id: 'cinema-2', title: '2× Cinema Tickets', cost: 600, tier: 'silver', art: '🎬', blurb: 'Grab a friend and enjoy the latest release.' },
  { id: 'spotify-1', title: '1 mo Spotify Premium', cost: 750, tier: 'silver', art: '🎧', blurb: 'Music on us for a month.' },
  { id: 'gym-pass', title: 'Premium Gym Day Pass', cost: 1600, tier: 'gold', art: '🏋️', blurb: 'Train, swim, sauna — the full package.' },
  { id: 'restaurant-50', title: '£50 Restaurant Voucher', cost: 2000, tier: 'gold', art: '🍽️', blurb: 'Treat yourself to a proper dinner.' },
  { id: 'weekend-lite', title: 'Weekend Getaway Lite', cost: 4800, tier: 'gold', art: '🏞️', blurb: 'Escape for two days — you earned it.' },
  { id: 'designer-rent', title: 'Designer Outfit Rental', cost: 5200, tier: 'platinum', art: '🧥', blurb: 'Look sharp for your big event.' },
];

function getCurrentTier(points: number): Tier {
  // Find highest tier eligible
  const eligible = TIERS.filter(t => points >= t.min).sort((a, b) => (b.min - a.min));
  return eligible[0] ?? TIERS[0];
}

function getNextTier(points: number): Tier | null {
  const sorted = [...TIERS].sort((a, b) => a.min - b.min);
  for (const t of sorted) {
    if (points < t.min) return t;
  }
  return null;
}

export default function RewardsPro({ points, onRedeem }: RewardsProProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Reward | null>(null);

  const currentTier = useMemo(() => getCurrentTier(points), [points]);
  const nextTier = useMemo(() => getNextTier(points), [points]);
  const toNext = nextTier ? Math.max(0, nextTier.min - points) : 0;

  const redeemables = useMemo(
    () => CATALOG.filter(r => r.cost <= points),
    [points]
  );

  return (
    <section
      id="rewards"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(1100px_480px_at_60%_-10%,rgba(0,255,200,0.10),transparent),linear-gradient(180deg,#0f1317, #0b0f13)] px-6 py-14 md:px-10 md:py-18"
    >
      {/* Soft ambient moving glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.18, 0.35, 0.18] }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{
          background:
            'radial-gradient(800px 320px at 20% 0%, rgba(0,255,180,0.08), transparent), radial-gradient(900px 360px at 90% 30%, rgba(160,180,255,0.08), transparent)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-6">
        <header className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
              Rewards
            </h2>
            <p className="mt-2 text-white/70">
              From student discounts to luxury experiences. Level up for better perks.
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="group inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-emerald-300 hover:bg-emerald-500/15 hover:text-emerald-200 transition-colors"
          >
            <Gift className="h-4 w-4" />
            Redeem Rewards
            <span className="ml-2 rounded-md bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-300">
              {points.toLocaleString()} pts
            </span>
          </button>
        </header>

        {/* Tier grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {TIERS.map((tier, idx) => {
            const isActive = tier.id === currentTier.id;
            const range = `${tier.min}${tier.max ? `–${tier.max}` : '–∞'} pts`;
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: idx * 0.12, type: 'spring', stiffness: 110 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={[
                  'relative overflow-hidden rounded-3xl border p-5 md:p-6 backdrop-blur-xl',
                  'border-white/15 text-white',
                  tier.gradient,
                  isActive ? tier.glow : 'shadow-[0_0_0_1px_rgba(255,255,255,0.08)]',
                ].join(' ')}
              >
                {/* Diagonal metallic shine */}
                <div className="pointer-events-none absolute -inset-1 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="pointer-events-none absolute -top-1 -left-1 h-56 w-56 rotate-[20deg] bg-[radial-gradient(circle,rgba(255,255,255,0.35),transparent_60%)] opacity-10" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-black/25 backdrop-blur-md p-2">
                      {tier.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{tier.name}</h3>
                  </div>
                  <span className="rounded-full bg-black/30 px-2 py-1 text-xs">{range}</span>
                </div>

                {/* perks strip */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  {tier.perks.map((p, i) => (
                    <div key={i} className="inline-flex items-center gap-1.5 text-white/90">
                      {p.icon}
                      <span>{p.label}</span>
                    </div>
                  ))}
                </div>

                {/* active glow band */}
                {isActive && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-3xl"
                    initial={{ opacity: 0.0 }}
                    animate={{ opacity: [0.18, 0.35, 0.18] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    style={{
                      boxShadow: 'inset 0 0 80px rgba(255,255,255,0.15)',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress to next tier */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-white/90">
              <div className="text-sm">Current: {currentTier.name}</div>
              <div className="text-xs text-white/60">
                {nextTier
                  ? <>You're <span className="text-emerald-300">{toNext.toLocaleString()} pts</span> away from <b>{nextTier.name}</b> — where perks get serious ✨</>
                  : <>You're at the top — enjoy Platinum perks ✨</>}
              </div>
            </div>
            <div className="text-sm text-white/70">{points.toLocaleString()} pts</div>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,#2fe6a6,#22d3ee)]"
              initial={{ width: 0 }}
              animate={{ width: `${nextTier ? Math.min(100, (points - currentTier.min) / (nextTier.min - currentTier.min) * 100) : 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>

          {/* drifting sparkles */}
          <div className="relative mt-2 h-4 overflow-visible">
            <span className="pointer-events-none absolute -left-6 top-1 h-2 w-2 animate-sparkle rounded-full bg-emerald-300/70" />
            <span className="pointer-events-none absolute -left-2 top-2 h-1.5 w-1.5 animate-sparkle-slow rounded-full bg-cyan-300/60" />
          </div>
        </div>

        {/* Redeem modal */}
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-[80] flex items-end md:items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
              {/* Panel */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 110 }}
                className="relative z-[90] w-[92vw] max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(180deg,#0d1115,#0a0e12)] p-6 md:p-7"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Redeem Rewards</h3>
                    <p className="text-sm text-white/70">
                      Choose a perk and claim it using your points.
                    </p>
                  </div>
                  <span className="rounded-lg bg-emerald-500/15 px-3 py-1 text-emerald-300 text-sm">
                    {points.toLocaleString()} pts
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {CATALOG.map((r, i) => {
                    const affordable = r.cost <= points;
                    return (
                      <motion.button
                        key={r.id}
                        type="button"
                        onClick={() => setSelected(r)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={[
                          'group flex items-center justify-between gap-3 rounded-2xl border p-4 text-left',
                          'backdrop-blur-xl transition-all',
                          affordable
                            ? 'border-white/12 bg-white/[0.04] hover:bg-white/[0.06]'
                            : 'border-white/[0.06] bg-white/[0.02] opacity-60 cursor-not-allowed',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-black/30 text-lg">
                            {r.art}
                          </div>
                          <div>
                            <div className="font-medium text-white">{r.title}</div>
                            <div className="text-xs text-white/60">{r.blurb}</div>
                          </div>
                        </div>
                        <div className="text-xs text-white/75">
                          {r.cost.toLocaleString()} pts
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-white/15 px-4 py-2 text-white/80 hover:bg-white/5"
                  >
                    Close
                  </button>
                </div>

                {/* Selected reward claim panel */}
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ scale: 0.96, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.98, opacity: 0 }}
                      className="pointer-events-auto absolute inset-x-6 bottom-6 z-[95] rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/20 text-base">
                            {selected.art}
                          </div>
                          <div>
                            <div className="font-medium text-emerald-200">{selected.title}</div>
                            <div className="text-xs text-emerald-200/80">
                              Cost: {selected.cost.toLocaleString()} pts
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onRedeem?.(selected.id);
                            // mini celebration pulse
                            setSelected(null);
                            setOpen(false);
                          }}
                          className="rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-2 text-black font-medium hover:brightness-110 transition"
                        >
                          Claim
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Local keyframes for sparkles + shine */}
      <style>{`
        @keyframes sparkle {
          0% { transform: translateX(0); opacity: .8; }
          100% { transform: translateX(110%); opacity: 0; }
        }
        .animate-sparkle { animation: sparkle 3.5s linear infinite; }
        .animate-sparkle-slow { animation: sparkle 5.8s linear infinite; }
      `}</style>
    </section>
  );
}
