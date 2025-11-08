import React, { useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Upload, ArrowRight, Trophy, Coffee, Footprints, Utensils,
  CheckCircle2, Crown, Star, Sparkles, Gift, TrendingUp
} from "lucide-react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

/**
 * PRISM – Student Finances. Smarter. Rewarded.
 * Ultra‑premium single‑page experience (Revolut‑style) with long, cinematic sections,
 * horizontal motion on scroll, metallic tiers, and interactive visuals.
 *
 * Tech: React + Tailwind + Framer Motion + Recharts
 *
 * Sections (keep only these):
 * 1) Hero (balance, points, CTAs)
 * 2) Intelligence (donut breakdown + trend line)
 * 3) Challenges (interactive cards, tilt)
 * 4) Rewards (metallic tier carousel + progress)
 * 5) CTA
 */

// ---------------- Demo Data ----------------
const BALANCE = 2847;
const POINTS = 1250; // Silver

const spendBreakdown = [
  { name: "Food", value: 38 },
  { name: "Transport", value: 17 },
  { name: "Entertainment", value: 15 },
  { name: "Bills", value: 20 },
  { name: "Other", value: 10 },
];

const monthlyTrend = [
  { m: "Apr", v: 812 },
  { m: "May", v: 793 },
  { m: "Jun", v: 768 },
  { m: "Jul", v: 845 },
  { m: "Aug", v: 807 },
  { m: "Sep", v: 829 },
];

const CHALLENGES = [
  { id: 1, icon: Coffee, label: "Skip 2 coffees", pts: 50, progress: 0.3 },
  { id: 2, icon: Utensils, label: "Cook 3 dinners", pts: 75, progress: 0.66 },
  { id: 3, icon: Footprints, label: "Walk once", pts: 100, progress: 0.0 },
];

const TIERS = [
  { key: "bronze", name: "Bronze", min: 100, max: 499, grad: "from-amber-700 via-amber-600 to-amber-500", ring: "ring-amber-400/40", icon: Trophy },
  { key: "silver", name: "Silver", min: 500, max: 1499, grad: "from-zinc-300 via-zinc-200 to-zinc-100", ring: "ring-zinc-300/40", icon: Star },
  { key: "gold", name: "Gold", min: 1500, max: 4999, grad: "from-yellow-400 via-amber-300 to-yellow-200", ring: "ring-yellow-300/40", icon: Crown },
  { key: "platinum", name: "Platinum", min: 5000, max: Infinity, grad: "from-indigo-200 via-sky-200 to-fuchsia-200", ring: "ring-sky-200/40", icon: Sparkles },
];

const currentTier = TIERS.find(t => POINTS >= t.min && POINTS <= t.max) || TIERS[0];
const nextTier = TIERS[Math.min(TIERS.indexOf(currentTier) + 1, TIERS.length - 1)];
const ptsToNext = nextTier && nextTier.min > POINTS ? nextTier.min - POINTS : 0;

// ---------------- Helpers ----------------
const fade = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.33, 1, 0.68, 1] as any },
  viewport: { once: true, amount: 0.3 },
};

const COLORS = ["#34d399", "#10b981", "#a7f3d0", "#6ee7b7", "#064e3b"];

function useParallax(ref: React.RefObject<HTMLElement>) {
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  return x;
}

function Card({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

// ---------------- Main ----------------
export default function PrismLanding() {
  const heroRef = useRef<HTMLDivElement>(null);
  const xHero = useParallax(heroRef);

  const donutData = useMemo(() => spendBreakdown.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] })), []);

  return (
    <div className="min-h-screen bg-[#0b1210] text-white selection:bg-emerald-500/30">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
        <div className="mx-auto max-w-[1200px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-emerald-500/20 grid place-content-center"><span className="block size-2.5 rounded-sm bg-emerald-400" /></div>
            <span className="font-semibold tracking-wide">PRISM</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#intel" className="hover:text-white">Insights</a>
            <a href="#chals" className="hover:text-white">Challenges</a>
            <a href="#rewards" className="hover:text-white">Rewards</a>
            <a href="#start" className="hover:text-white">Start</a>
          </nav>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      </header>

      {/* HERO – long, cinematic */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(16,185,129,0.16),transparent_60%)]" />
        <div className="mx-auto max-w-[1200px] px-6 pt-24 pb-20">
          <motion.h1 style={{ x: xHero }} className="text-5xl md:text-7xl font-extrabold leading-[0.95] tracking-tight">
            Your Money.
            <span className="block text-emerald-400">Decoded & Rewarded.</span>
          </motion.h1>
          <motion.div {...fade} className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-7">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">Current Balance</div>
              <div className="mt-3 text-5xl font-bold tabular-nums">£{BALANCE.toLocaleString()}</div>
              <div className="mt-2 flex items-center gap-2 text-emerald-400/80"><TrendingUp className="size-4"/>+2.3% this month</div>
            </Card>
            <Card className="p-7">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">Reward Points</div>
              <div className="mt-3 text-5xl font-bold tabular-nums">{POINTS.toLocaleString()}</div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${currentTier.grad} px-3 py-1 text-black/80 font-semibold`}>{currentTier.name}</span>
                {ptsToNext > 0 && <span className="text-white/70">{ptsToNext} pts to next</span>}
              </div>
            </Card>
          </motion.div>
          <motion.div {...fade} className="mt-10 flex flex-wrap items-center gap-3">
            <a href="#start" className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 font-semibold text-black shadow-lg shadow-emerald-500/25">
              <Upload className="size-4"/> Upload CSV
            </a>
            <a href="#rewards" className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 px-6 py-4 font-semibold text-emerald-300 hover:bg-emerald-500/10">
              View Rewards <ArrowRight className="size-4"/>
            </a>
          </motion.div>
        </div>
      </section>

      {/* INTELLIGENCE – long band with side‑to‑side parallax */}
      <section id="intel" className="relative py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.h2 {...fade} className="text-4xl font-bold">Intelligence</motion.h2>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Donut breakdown */}
            <Card className="p-6">
              <div className="text-sm text-white/70 mb-4">Spending breakdown</div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} innerRadius={70} outerRadius={110} dataKey="value">
                      {donutData.map((entry, index) => (
                        <Cell key={`c-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {donutData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-white/80">{d.name} — {d.value}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Trend + bullets */}
            <Card className="p-6">
              <div className="text-sm text-white/70 mb-4">Monthly trend</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                    <XAxis dataKey="m" stroke="#9ca3af" tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} width={32} />
                    <Line type="monotone" dataKey="v" stroke="#34d399" strokeWidth={2.4} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-2 text-sm text-white/85">
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300"/> 23% more on Deliveroo on Sundays</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300"/> 2 unused subscriptions detected</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300"/> You're £45 below top savers</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CHALLENGES – interactive tilt cards */}
      <section id="chals" className="py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.h2 {...fade} className="text-4xl font-bold">Challenges</motion.h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {CHALLENGES.map((c) => (
              <motion.div key={c.id} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className={`rounded-3xl border border-white/10 bg-white/5 p-6 ring-1 ${currentTier.ring}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><c.icon className="size-5 text-emerald-300"/><div className="text-lg font-semibold">{c.label}</div></div>
                  <div className="text-xs font-semibold text-emerald-300">+{c.pts} pts</div>
                </div>
                <div className="mt-5 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${Math.round(c.progress*100)}%` }} />
                </div>
                <div className="mt-2 text-xs text-white/60">{Math.round(c.progress*100)}% complete</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* REWARDS – metallic carousel */}
      <section id="rewards" className="py-28 relative">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.h2 {...fade} className="text-4xl font-bold">Rewards</motion.h2>
          <motion.p {...fade} className="mt-2 text-white/60">From discounts to luxury experiences. Level up for better perks.</motion.p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {TIERS.map((t) => (
              <motion.div key={t.key} whileHover={{ scale: 1.01 }} className={`relative rounded-3xl border border-white/10 bg-white/5 p-6 ring-1 ${t.ring} overflow-hidden`}> 
                <div className={`absolute inset-0 opacity-70 bg-gradient-to-br ${t.grad}`} style={{ mixBlendMode: "soft-light" }} />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3"><t.icon className="size-5"/><div className="text-xl font-semibold">{t.name}</div></div>
                  <div className="rounded-full bg-black/60 border border-white/10 px-3 py-1 text-xs">{t.min.toLocaleString()}–{t.max===Infinity?"∞":t.max.toLocaleString()} pts</div>
                </div>
                <div className="relative mt-3 text-sm text-white/85">
                  {t.key === "bronze" && <span>Student discounts • Cashback vouchers</span>}
                  {t.key === "silver" && <span>Restaurant deals • Cinema passes</span>}
                  {t.key === "gold" && <span>Luxury experiences • Weekend getaways</span>}
                  {t.key === "platinum" && <span>Premium gyms • Designer rentals</span>}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Progress */}
          <Card className="p-6 mt-8">
            <div className="mb-2 text-sm text-white/70">Current: {currentTier.name} ({POINTS.toLocaleString()} pts)</div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${Math.min(100, POINTS / (nextTier && nextTier.max!==Infinity ? nextTier.max : POINTS + ptsToNext) * 100)}%` }} />
            </div>
            <div className="mt-3 text-sm text-white/85">{ptsToNext>0? <>You're <span className="text-emerald-400 font-semibold">{ptsToNext} pts</span> from <b>next tier</b>.</> : <>Top tier unlocked.</>}</div>
            <div className="mt-4"><a className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-black"><Gift className="size-4"/> Redeem Rewards</a></div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section id="start" className="relative py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_500px_at_50%_0%,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="mx-auto max-w-[1200px] px-6">
          <Card className="p-10">
            <div className="text-3xl font-bold">Start now.</div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 font-semibold text-black shadow-lg shadow-emerald-500/25"><Upload className="size-4"/> Upload CSV</a>
              <a href="#rewards" className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 px-6 py-4 font-semibold text-emerald-300 hover:bg-emerald-500/10">Explore Rewards <ArrowRight className="size-4"/></a>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-[1200px] px-6 py-8 text-sm text-white/60 flex items-center justify-between">
          <div>© {new Date().getFullYear()} PRISM</div>
          <div className="flex items-center gap-6"><a className="hover:text-white" href="#">Privacy</a><a className="hover:text-white" href="#">Terms</a></div>
        </div>
      </footer>

      {/* CSS keyframes for shine if needed elsewhere */}
      <style>{`
        @keyframes shine { 0%{transform:translateX(-120%);} 50%{transform:translateX(120%);} 100%{transform:translateX(120%);} }
      `}</style>
    </div>
  );
}
