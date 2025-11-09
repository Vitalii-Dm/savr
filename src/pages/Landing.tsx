import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload, ArrowRight, Trophy, Coffee, Footprints, Utensils,
  CheckCircle2, Crown, Star, Sparkles, Gift, TrendingUp
} from "lucide-react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { SavingsPot3D } from "@/components/SavingsPot3D";
import { RewardsModal } from "@/components/RewardsModal";
import Section from "@/components/Section";
import TierProgress from "@/components/TierProgress";
import SmoothScroll from "@/components/SmoothScroll";

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

const COLORS = ["#34d399", "#10b981", "#a7f3d0", "#6ee7b7", "#064e3b"];

function Card({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

export default function PrismLanding() {
  const [openRewards, setOpenRewards] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      console.log('CSV file selected:', file.name);
      // TODO: Process CSV file here
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const donutData = useMemo(() => spendBreakdown.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] })), []);

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#0b1210] text-white selection:bg-emerald-500/30">
        {/* NAV */}
        <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
          <div className="mx-auto max-w-[1200px] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/20 grid place-content-center"><span className="block size-2.5 rounded-sm bg-emerald-400" /></div>
              <span className="font-semibold tracking-wide">PRISM</span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
              <a href="#hero" className="hover:text-white">Home</a>
              <a href="#insights" className="hover:text-white">Insights</a>
              <a href="#challenges" className="hover:text-white">Challenges</a>
              <a href="#rewards" className="hover:text-white">Rewards</a>
            </nav>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        </header>

        {/* HERO */}
        <Section id="hero">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(16,185,129,0.16),transparent_60%)]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-extrabold leading-[0.95] tracking-tight">
                Your Money.
                <span className="block text-emerald-400">Decoded & Rewarded.</span>
              </h1>
              <p className="text-white/70 text-lg max-w-lg">AI that helps you spend better, save faster, and earn real rewards.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Current Balance</div>
                  <div className="mt-2 text-4xl font-bold tabular-nums">£{BALANCE.toLocaleString()}</div>
                  <div className="mt-2 flex items-center gap-2 text-emerald-400/80 text-sm"><TrendingUp className="size-4"/>+2.3% this month</div>
                </Card>
                <Card className="p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Reward Points</div>
                  <div className="mt-2 text-4xl font-bold tabular-nums">{POINTS.toLocaleString()}</div>
                </Card>
              </div>

              <TierProgress points={POINTS} />

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button onClick={handleUploadClick} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 font-semibold text-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-shadow">
                  <Upload className="size-4"/> Upload CSV
                </button>
                <button onClick={() => setOpenRewards(true)} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 px-6 py-4 font-semibold text-emerald-300 hover:bg-emerald-500/10">
                  View Rewards <ArrowRight className="size-4"/>
                </button>
              </div>
            </div>

            {/* Right: 3D Pot */}
            <SavingsPot3D balance={BALANCE} goal={5000} points={POINTS} />
          </div>
        </Section>

        {/* INSIGHTS */}
        <Section id="insights" headline="Intelligence" subhead="Spending breakdown, trends, and personalized savings tips.">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        </Section>

        {/* CHALLENGES */}
        <Section id="challenges" headline="Smart Challenges" subhead="Micro-habits that compound into savings.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CHALLENGES.map((c) => (
              <motion.div key={c.id} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="rounded-3xl border border-white/10 bg-white/5 p-6 ring-1 ring-emerald-400/20">
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
        </Section>

        {/* REWARDS */}
        <Section id="rewards" headline="Rewards" subhead="From discounts to luxury experiences. Level up for better perks.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: "bronze", name: "Bronze", min: 100, max: 499, grad: "from-amber-700 via-amber-600 to-amber-500", ring: "ring-amber-400/40", icon: Trophy, desc: "Student discounts • Cashback vouchers" },
              { key: "silver", name: "Silver", min: 500, max: 1499, grad: "from-zinc-300 via-zinc-200 to-zinc-100", ring: "ring-zinc-300/40", icon: Star, desc: "Restaurant deals • Cinema passes" },
              { key: "gold", name: "Gold", min: 1500, max: 4999, grad: "from-yellow-400 via-amber-300 to-yellow-200", ring: "ring-yellow-300/40", icon: Crown, desc: "Luxury experiences • Weekend getaways" },
              { key: "platinum", name: "Platinum", min: 5000, max: Infinity, grad: "from-indigo-200 via-sky-200 to-fuchsia-200", ring: "ring-sky-200/40", icon: Sparkles, desc: "Premium gyms • Designer rentals" },
            ].map((t) => (
              <motion.div key={t.key} whileHover={{ scale: 1.01 }} className={`relative rounded-3xl border border-white/10 bg-white/5 p-6 ring-1 ${t.ring} overflow-hidden`}> 
                <div className={`absolute inset-0 opacity-70 bg-gradient-to-br ${t.grad}`} style={{ mixBlendMode: "soft-light" }} />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3"><t.icon className="size-5"/><div className="text-xl font-semibold">{t.name}</div></div>
                  <div className="rounded-full bg-black/60 border border-white/10 px-3 py-1 text-xs">{t.min.toLocaleString()}–{t.max===Infinity?"∞":t.max.toLocaleString()} pts</div>
                </div>
                <div className="relative mt-3 text-sm text-white/85">{t.desc}</div>
              </motion.div>
            ))}
          </div>

          <Card className="p-6 mt-8">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">You have <b>{POINTS.toLocaleString()}</b> pts</div>
              <button onClick={() => setOpenRewards(true)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-black">
                <Gift className="size-4"/> Redeem Rewards
              </button>
            </div>
          </Card>
        </Section>

        <footer className="border-t border-white/10">
          <div className="mx-auto max-w-[1200px] px-6 py-8 text-sm text-white/60 flex items-center justify-between">
            <div>© {new Date().getFullYear()} PRISM</div>
            <div className="flex items-center gap-6"><a className="hover:text-white" href="#">Privacy</a><a className="hover:text-white" href="#">Terms</a></div>
          </div>
        </footer>

        <RewardsModal
          open={openRewards}
          onClose={() => setOpenRewards(false)}
          points={POINTS}
          onRedeem={(r) => {
            console.log('Redeem', r.id);
            setOpenRewards(false);
          }}
        />
      </div>
    </SmoothScroll>
  );
}
