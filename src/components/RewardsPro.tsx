'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Gem, Trophy, Gift, Ticket, Dumbbell, Utensils } from 'lucide-react';

type RewardsProProps = {
  points: number;
  onOpenRewards: () => void;
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
    gradient: 'bg-[linear-gradient(135deg,#8B4513_0%,#CD7F32_35%,#D2691E_65%,#B8860B_100%)]',
    glow: 'shadow-[0_0_32px_rgba(205,127,50,0.4),0_0_0_1px_rgba(205,127,50,0.25)]',
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
    gradient: 'bg-[linear-gradient(135deg,#C0C0C0_0%,#E8E8E8_40%,#D3D3D3_60%,#B0C4DE_100%)]',
    glow: 'shadow-[0_0_32px_rgba(192,192,192,0.35),0_0_0_1px_rgba(224,224,224,0.3)]',
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
    gradient: 'bg-[linear-gradient(135deg,#FFD700_0%,#FFC700_30%,#FFE55C_50%,#FFB700_80%,#FFA500_100%)]',
    glow: 'shadow-[0_0_40px_rgba(255,215,0,0.5),0_0_0_1px_rgba(255,215,0,0.35)]',
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
    gradient: 'bg-[linear-gradient(135deg,#E6E6FA_0%,#B8C5F2_25%,#ADD8E6_50%,#D8BFD8_75%,#E6E6FA_100%)]',
    glow: 'shadow-[0_0_40px_rgba(173,216,230,0.45),0_0_0_1px_rgba(230,230,250,0.4)]',
    perks: [
      { icon: <Dumbbell className="h-4 w-4" />, label: 'Premium gyms' },
      { icon: <Gift className="h-4 w-4" />, label: 'Designer rentals' },
    ],
  },
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

export default function RewardsPro({ points, onOpenRewards }: RewardsProProps) {
  const currentTier = useMemo(() => getCurrentTier(points), [points]);
  const nextTier = useMemo(() => getNextTier(points), [points]);
  const toNext = nextTier ? Math.max(0, nextTier.min - points) : 0;

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
            onClick={onOpenRewards}
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
                whileHover={{ 
                  y: -6, 
                  filter: 'blur(0px)',
                  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } 
                }}
                className={[
                  'group relative overflow-hidden rounded-3xl border-[0.5px] p-5 md:p-6 backdrop-blur-xl premium-shine concave-surface transform-gpu',
                  'border-white/20 text-white',
                  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]',
                  tier.gradient,
                  isActive ? tier.glow : 'shadow-[0_0_0_0.5px_rgba(255,255,255,0.12)]',
                ].join(' ')}
                style={{
                  willChange: 'transform, filter',
                }}
              >
                {/* Metallic micro-texture noise */}
                <div 
                  className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  }}
                />
                
                {/* Top reflective edge highlight */}
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Diagonal metallic sheen animation */}
                <motion.div 
                  className="pointer-events-none absolute -inset-1 opacity-0 group-hover:opacity-25 transition-opacity duration-700"
                  style={{
                    background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)',
                    backgroundSize: '200% 200%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
                
                {/* Radial glow spotlight */}
                <div className="pointer-events-none absolute -top-1 -left-1 h-56 w-56 rotate-[20deg] bg-[radial-gradient(circle,rgba(255,255,255,0.25),transparent_65%)] opacity-15" />
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
