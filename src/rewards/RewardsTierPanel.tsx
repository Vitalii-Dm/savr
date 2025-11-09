import React from "react";
import { motion } from "framer-motion";
import { useRewardsStore, DEFAULT_CATALOG, RedeemModal, useRedeemUI } from "./RewardsEngine";

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
  const { points } = useRewardsStore();
  const { openRedeem } = useRedeemUI();

  // compute current tier & next target
  const tier =
    points >= 5000 ? "platinum" :
    points >= 1500 ? "gold" :
    points >= 500  ? "silver" : "bronze";

  const nextTarget =
    tier==="bronze" ? 500 :
    tier==="silver" ? 1500 :
    tier==="gold"   ? 5000 : 5000;

  const pct = Math.min(100, (points/nextTarget)*100);
  const toNext = Math.max(0, nextTarget - points);

  return (
    <div className="relative grid gap-6">
      {/* Header stats + Redeem CTA */}
      <Glass>
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl ${TIER_BG[tier as keyof typeof TIER_BG]}`} />
          <div>
            <div className="text-white/70 text-xs">Current Tier</div>
            <div className="text-white font-semibold capitalize">{tier}</div>
          </div>

          <div className="ml-auto text-right">
            <div className="text-white/70 text-xs">Points</div>
            <div className="text-emerald-400 font-semibold">{points.toLocaleString()}</div>
            <div className="text-white/50 text-xs">To next: {toNext.toLocaleString()} pts</div>
          </div>
        </div>

        <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div className="h-2 bg-emerald-400" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type:"spring", stiffness:80, damping:18 }}/>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={()=>openRedeem(null)}
            className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30"
          >
            Redeem Rewards
          </button>
        </div>
      </Glass>

      {/* Four tier cards (your previous colorful layout) */}
      <div className="grid md:grid-cols-2 gap-4">
        <TierCard tier="bronze"   title="Bronze"   range="100–499 pts"  perks={["Student discounts","Cashback vouchers"]}/>
        <TierCard tier="silver"   title="Silver"   range="500–1,499 pts" perks={["Cinema passes","Restaurant deals"]}/>
        <TierCard tier="gold"     title="Gold"     range="1,500–4,999 pts" perks={["Luxury experiences","Weekend getaways"]}/>
        <TierCard tier="platinum" title="Platinum" range="5,000+ pts" perks={["Premium gyms","Designer rentals"]}/>
      </div>

      {/* Modal lives here (once per page) */}
      <RedeemModal />
    </div>
  );
};
