import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRewardsEngine } from "@/lib/rewardsEngine";
import RedeemModal from "@/components/redeem/RedeemModal";
import type { Reward } from "@/lib/rewardsEngine";

// metallic gradients for the four tiers (match your previous design)
const TIER_BG = {
  bronze:   "bg-gradient-to-br from-[#7a4b2b] to-[#bf8a5a]",
  silver:   "bg-gradient-to-br from-[#585c68] to-[#b9c4cf]",
  gold:     "bg-gradient-to-br from-[#9a7a2f] to-[#f0d27a]",
  platinum: "bg-gradient-to-br from-[#5b6a78] to-[#c0d8ee]",
};

const Glass: React.FC<React.PropsWithChildren<{className?:string}>> = ({className="", children}) => (
  <div className={`rounded-3xl p-6 backdrop-blur-lg bg-white/5 border border-white/10 ${className}`}>{children}</div>
);

const TierCard: React.FC<{ tier:"bronze"|"silver"|"gold"|"platinum"; title:string; perks:string[]; range:string; }> = ({tier,title,perks,range})=>{
  return (
    <motion.div whileHover={{ y:-2 }} className={`rounded-2xl p-4 ${TIER_BG[tier]} text-white/90 shadow-inner`}>
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-xs opacity-80">{range}</div>
      <div className="mt-3 grid gap-1 text-sm opacity-90">
        {perks.map((p)=> <div key={p}>• {p}</div>)}
      </div>
    </motion.div>
  );
};

export const RewardsTierPanel: React.FC = () => {
  const { user, rewards } = useRewardsEngine();
  const [chosen, setChosen] = useState<Reward | null>(null);

  // compute current tier & next target
  const tierLower = user.tier.toLowerCase() as "bronze" | "silver" | "gold" | "platinum";

  const nextTarget =
    tierLower === "bronze" ? 500 :
    tierLower === "silver" ? 1500 :
    tierLower === "gold"   ? 5000 : 5000;

  const pct = Math.min(100, (user.points / nextTarget) * 100);
  const toNext = Math.max(0, nextTarget - user.points);

  const visible = useMemo(
    () => rewards.filter(r => user.points >= r.pointsCost * 0.5),
    [rewards, user.points]
  );

  return (
    <div className="relative grid gap-6">
      {/* Header stats */}
      <Glass>
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl ${TIER_BG[tierLower]}`} />
          <div>
            <div className="text-white/70 text-xs">Current Tier</div>
            <div className="text-white font-semibold capitalize">{user.tier}</div>
          </div>

          <div className="ml-auto text-right">
            <div className="text-white/70 text-xs">Points</div>
            <div className="text-emerald-400 font-semibold">{user.points.toLocaleString()}</div>
            <div className="text-white/50 text-xs">To next: {toNext.toLocaleString()} pts</div>
          </div>
        </div>

        <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div className="h-2 bg-emerald-400" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type:"spring", stiffness:80, damping:18 }}/>
        </div>
      </Glass>

      {/* Four tier cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <TierCard tier="bronze"   title="Bronze"   range="0–499 pts"  perks={["Student discounts","Cashback vouchers"]}/>
        <TierCard tier="silver"   title="Silver"   range="500–1,499 pts" perks={["Cinema passes","Restaurant deals"]}/>
        <TierCard tier="gold"     title="Gold"     range="1,500–4,999 pts" perks={["Luxury experiences","Weekend getaways"]}/>
        <TierCard tier="platinum" title="Platinum" range="5,000+ pts" perks={["Premium gyms","Designer rentals"]}/>
      </div>

      {/* Available perks grid */}
      <Glass>
        <h3 className="text-white font-semibold mb-4">Available Rewards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((r) => {
            const canAfford = user.points >= r.pointsCost;
            const tierColors = {
              Bronze: "from-[#7a4b2b] to-[#bf8a5a]",
              Silver: "from-[#585c68] to-[#b9c4cf]",
              Gold: "from-[#9a7a2f] to-[#f0d27a]",
              Platinum: "from-[#5b6a78] to-[#c0d8ee]",
            };
            return (
              <motion.button
                key={r.id}
                onClick={() => setChosen(r)}
                whileHover={{ y: -2 }}
                className={`group text-left rounded-2xl ring-1 ring-white/10 bg-white/5 hover:bg-white/10 p-4 transition-all ${!canAfford ? "opacity-50" : ""}`}
              >
                <div className={`h-20 w-full rounded-xl bg-gradient-to-br ${tierColors[r.tier]} mb-3`} />
                <div className="text-white font-medium">{r.title}</div>
                <div className="text-xs text-white/60">{r.partner}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-emerald-400 text-sm font-semibold">{r.pointsCost} pts</div>
                  <div className="inline-flex items-center gap-2 text-sm text-white/90">
                    <span className="rounded-lg bg-emerald-500/20 px-3 py-1">Redeem</span>
                    <span className="opacity-60 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </Glass>

      {/* Modal */}
      <RedeemModal
        open={!!chosen}
        onClose={() => setChosen(null)}
        reward={chosen}
      />
    </div>
  );
};
