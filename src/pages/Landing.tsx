import React from "react";
import { motion } from "framer-motion";
import { Upload, ArrowRight, Trophy, Coffee, Footprints, Utensils, CheckCircle2, Crown, Star, Sparkles } from "lucide-react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";

/**
 * PRISM – Student Finances. Smarter. Rewarded.
 * Single‑file premium landing built with Tailwind + Framer Motion + Recharts.
 * Goal: Revolut/CashApp aesthetic, minimal sections, no boilerplate. 
 * Keep only core story: Balance/Points → CSV Intelligence → Smart Challenges → Rewards Tiers → CTA.
 */

// ---------- Demo data (replace with live state) ----------
const demoBalance = 2847;
const demoPoints = 1250; // Silver

const monthlyTrend = [
  { m: "Apr", v: 812 },
  { m: "May", v: 793 },
  { m: "Jun", v: 768 },
  { m: "Jul", v: 845 },
  { m: "Aug", v: 807 },
  { m: "Sep", v: 829 },
];

const challenges = [
  { id: 1, icon: Coffee, label: "Skip 2 coffees this week", pts: 50, progress: 0.3 },
  { id: 2, icon: Utensils, label: "Cook 3 meals at home", pts: 75, progress: 0.66 },
  { id: 3, icon: Footprints, label: "Walk instead of Uber once", pts: 100, progress: 0.0 },
];

// ---------- Rewards logic ----------
const TIERS = [
  { key: "bronze", name: "Bronze", min: 100, max: 499, gradient: "from-amber-700 via-amber-600 to-amber-500", ring: "ring-amber-400/40", icon: Trophy },
  { key: "silver", name: "Silver", min: 500, max: 1499, gradient: "from-zinc-300 via-zinc-200 to-zinc-100", ring: "ring-zinc-300/40", icon: Star },
  { key: "gold", name: "Gold", min: 1500, max: 4999, gradient: "from-yellow-400 via-amber-300 to-yellow-200", ring: "ring-yellow-300/40", icon: Crown },
  { key: "platinum", name: "Platinum", min: 5000, max: Infinity, gradient: "from-indigo-200 via-sky-200 to-fuchsia-200", ring: "ring-sky-200/40", icon: Sparkles },
];

function currentTier(points: number) {
  return TIERS.reduce((acc, t) => (points >= t.min && points <= t.max ? t : acc), TIERS[0]);
}

function pointsToNext(points: number) {
  const tierIndex = TIERS.findIndex(t => points >= t.min && points <= t.max);
  if (tierIndex === -1) return 0;
  const next = TIERS[Math.min(tierIndex + 1, TIERS.length - 1)];
  if (!next || next.min === TIERS[tierIndex].min) return 0;
  return Math.max(0, next.min - points);
}

const tier = currentTier(demoPoints);
const toNext = pointsToNext(demoPoints);

// ---------- Small helpers ----------
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] as any },
  viewport: { once: true, amount: 0.3 },
};

const shine = "before:absolute before:inset-0 before:bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.25),transparent)] before:-translate-x-full before:animate-[shine_3s_ease_infinite] overflow-hidden";

// ---------- Component ----------
export default function PrismLanding() {
  return (
    <div className="min-h-screen bg-[#0c1412] text-white selection:bg-emerald-500/30">
      {/* Top nav minimal */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-emerald-500/20 grid place-content-center">
              <span className="block size-2.5 rounded-sm bg-emerald-400" />
            </div>
            <span className="font-semibold tracking-wide">PRISM</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a className="hover:text-white transition" href="#insights">Insights</a>
            <a className="hover:text-white transition" href="#challenges">Challenges</a>
            <a className="hover:text-white transition" href="#rewards">Rewards</a>
            <a className="hover:text-white transition" href="#start">Start</a>
          </nav>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      </header>

      {/* Hero */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(16,185,129,0.16),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-10">
          <motion.h1 {...fadeUp} className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Your Student Finances.<br />
            <span className="text-emerald-400">Smarter. Rewarded.</span>
          </motion.h1>
          <motion.p {...fadeUp} className="mt-4 max-w-2xl text-white/70">
            AI that helps you spend better, save faster, and earn real rewards.
          </motion.p>

          {/* KPI cards */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div {...fadeUp} className={`relative ${shine} rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-lg`}> 
              <div className="text-xs uppercase tracking-widest text-white/50">Current Balance</div>
              <div className="mt-2 text-4xl font-bold tabular-nums">£{demoBalance.toLocaleString()}</div>
              <div className="mt-2 text-emerald-400/80 text-sm">+2.3% this month</div>
            </motion.div>
            <motion.div {...fadeUp} className={`relative ${shine} rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-lg`}>
              <div className="text-xs uppercase tracking-widest text-white/50">Reward Points</div>
              <div className="mt-2 text-4xl font-bold tabular-nums">{demoPoints.toLocaleString()}</div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${tier.gradient} px-2.5 py-1 text-black/80 font-semibold`}>{tier.name}</span>
                {toNext > 0 && <span className="text-white/70">{toNext} pts to next</span>}
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div {...fadeUp} className="mt-10 flex flex-wrap items-center gap-3">
            <a href="#start" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 font-semibold text-black shadow-lg shadow-emerald-500/20 transition active:scale-[.99]">
              <Upload className="size-4" /> Upload CSV
            </a>
            <a href="#rewards" className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 px-5 py-3 font-semibold text-emerald-300/90 hover:bg-emerald-500/10">
              View Rewards <ArrowRight className="size-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* CSV Intelligence */}
      <section id="insights" className="mx-auto max-w-6xl px-4 py-16">
        <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold">Your Spending, Decoded.</motion.h2>
        <motion.p {...fadeUp} className="mt-2 text-white/70 max-w-2xl">Upload once. Understand everything. Categories, patterns, forgotten subscriptions, and how you compare.</motion.p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {["Upload Bank Statement (CSV) — auto‑categorised", "Find hidden patterns — e.g. 23% more on Sundays", "Spot forgotten subscriptions — cancel fast", "Compare to students like you"].map((t, i) => (
            <motion.div key={i} {...fadeUp} className="rounded-2xl border border-white/10 bg-white/[.04] p-5 backdrop-blur">
              <div className="flex items-center gap-3 text-emerald-300/90">
                <CheckCircle2 className="size-5" />
                <span className="font-medium">{t}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Minimal trend */}
        <motion.div {...fadeUp} className="mt-8 rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <div className="mb-3 text-sm text-white/60">Monthly spend trend</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="m" stroke="#9ca3af" tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} width={32} />
                <Line type="monotone" dataKey="v" stroke="#34d399" strokeWidth={2.4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      {/* Smart Challenges */}
      <section id="challenges" className="mx-auto max-w-6xl px-4 py-16">
        <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold">Turn Small Changes into Big Wins.</motion.h2>
        <motion.p {...fadeUp} className="mt-2 text-white/70 max-w-2xl">AI generates personalised nudges from your patterns. Complete, earn points, build streaks.</motion.p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {challenges.map((c) => (
            <motion.div key={c.id} {...fadeUp} className={`rounded-2xl border border-white/10 bg-white/[.04] p-5 ring-1 ${tier.ring}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <c.icon className="size-5 text-emerald-300/90" />
                  <div className="font-medium">{c.label}</div>
                </div>
                <div className="text-xs text-emerald-300/90 font-semibold">+{c.pts} pts</div>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${Math.round(c.progress * 100)}%` }} />
              </div>
              <div className="mt-2 text-sm text-white/60">Progress: {Math.round(c.progress * 100)}%</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Rewards */}
      <section id="rewards" className="mx-auto max-w-6xl px-4 py-16">
        <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold">Earn Rewards That Matter.</motion.h2>
        <motion.p {...fadeUp} className="mt-2 text-white/70 max-w-2xl">From student discounts to luxury experiences. Tiers unlock better perks as you level up.</motion.p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {TIERS.map((t) => (
            <motion.div key={t.key} {...fadeUp} className={`relative rounded-2xl border border-white/10 bg-white/[.04] p-5 ring-1 ${t.ring}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <t.icon className="size-5 text-white/80" />
                  <div className="text-lg font-semibold">{t.name}</div>
                </div>
                <div className={`rounded-full px-2.5 py-1 text-xs font-semibold text-black bg-gradient-to-r ${t.gradient}`}>{t.min.toLocaleString()}–{t.max === Infinity ? "∞" : t.max.toLocaleString()} pts</div>
              </div>
              <div className="mt-3 text-sm text-white/70">
                {t.key === "bronze" && <span>Student discounts • Cashback vouchers</span>}
                {t.key === "silver" && <span>Restaurant deals • Cinema passes</span>}
                {t.key === "gold" && <span>Luxury experiences • Weekend getaways</span>}
                {t.key === "platinum" && <span>Premium gyms • Designer rentals</span>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tier progress */}
        <motion.div {...fadeUp} className="mt-8 rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <div className="mb-2 text-sm text-white/70">Current: {tier.name} ({demoPoints.toLocaleString()} pts)</div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${Math.min(100, (demoPoints / (tier.max === Infinity ? demoPoints + toNext : tier.max)) * 100)}%` }} />
          </div>
          {toNext > 0 ? (
            <div className="mt-3 text-sm text-white/80">
              You're <span className="text-emerald-400 font-semibold">{toNext} points</span> away from <span className="font-semibold">next tier</span> — where perks get serious ✨
            </div>
          ) : (
            <div className="mt-3 text-sm text-emerald-300">You've unlocked the top tier. Enjoy the perks.</div>
          )}
          <div className="mt-4">
            <a href="#start" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 font-semibold text-black shadow-lg shadow-emerald-500/20">
              Redeem Rewards <ArrowRight className="size-4" />
            </a>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section id="start" className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_0%,rgba(16,185,129,0.13),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-4 py-16">
          <motion.div {...fadeUp} className="rounded-3xl border border-white/10 bg-white/[.04] p-8 backdrop-blur">
            <h3 className="text-2xl md:text-3xl font-bold">Start saving smarter today.</h3>
            <p className="mt-2 text-white/70 max-w-2xl">Upload a bank CSV, let AI do the heavy lifting, complete a challenge, and redeem a real perk. That's it.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 font-semibold text-black shadow-lg shadow-emerald-500/20">
                <Upload className="size-4" /> Upload CSV
              </a>
              <a href="#rewards" className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 px-5 py-3 font-semibold text-emerald-300/90 hover:bg-emerald-500/10">
                Explore Rewards <ArrowRight className="size-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-white/60 flex items-center justify-between">
          <div>© {new Date().getFullYear()} PRISM</div>
          <div className="flex items-center gap-6"><a className="hover:text-white" href="#">Privacy</a><a className="hover:text-white" href="#">Terms</a></div>
        </div>
      </footer>

      {/* Keyframes */}
      <style>{`
        @keyframes shine { 
          0% { transform: translateX(-120%); }
          50% { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </div>
  );
}
