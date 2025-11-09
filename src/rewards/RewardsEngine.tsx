import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { create } from "zustand";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

// --- Types
type Tier = "bronze" | "silver" | "gold" | "platinum";
export type Reward = {
  id: string; title: string; vendor: string; points: number; tier: Tier;
  description?: string; colorFrom: string; colorTo: string;
};
type RedemptionTicket = {
  ticketId: string; rewardId: string; title: string; vendor: string; points: number;
  issuedAt: string; expiresAt: string; status: "active" | "consumed" | "expired";
  qrPayload: string;
};

// --- Demo catalog
export const DEFAULT_CATALOG: Reward[] = [
  { id:"coffee-10", title:"£10 Coffee Voucher", vendor:"Campus Coffee", points:250, tier:"bronze", colorFrom:"#7a4b2b", colorTo:"#bf8a5a", description:"Treat yourself or a friend." },
  { id:"spotify-1m", title:"1 mo Spotify Premium", vendor:"Spotify", points:750, tier:"silver", colorFrom:"#585c68", colorTo:"#b9c4cf", description:"Music on us for a month." },
  { id:"gym-day",   title:"Premium Gym Day Pass", vendor:"Anytime Fitness", points:1600, tier:"gold", colorFrom:"#9a7a2f", colorTo:"#f0d27a", description:"Train, swim, sauna — full package." },
  { id:"getaway",   title:"Weekend Getaway Lite", vendor:"Student Breaks", points:4800, tier:"platinum", colorFrom:"#5b6a78", colorTo:"#c0d8ee", description:"Two days escape." },
];

// --- LocalStorage
const LS_POINTS = "savr_points";
const LS_TIX    = "savr_redemptions";

const load = <T,>(k:string, fb:T):T => { try { const s = localStorage.getItem(k); return s? JSON.parse(s):fb; } catch { return fb; } };
const save = (k:string, v:unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// --- Store
type RewardsState = {
  points: number;
  catalog: Reward[];
  redemptions: RedemptionTicket[];
  setPoints: (p:number)=>void;
  addPoints: (d:number)=>void;
  redeem: (r:Reward)=>RedemptionTicket|null;
  consumeTicket:(id:string)=>void;
  expireTickets:()=>void;
  uiOpen: boolean;
  uiSelected: Reward|null;
  openRedeem: (r?:Reward|null)=>void;
  closeRedeem: ()=>void;
};

export const useRewardsStore = create<RewardsState>((set,get)=>({
  points: load<number>(LS_POINTS, 1250),
  catalog: DEFAULT_CATALOG,
  redemptions: load<RedemptionTicket[]>(LS_TIX, []),

  setPoints: (p)=>{ set({points:p}); save(LS_POINTS,p); },
  addPoints: (d)=>{ const n=Math.max(0,get().points+d); set({points:n}); save(LS_POINTS,n); },

  redeem: (reward)=>{
    const current=get().points; if(current<reward.points) return null;
    const next=current-reward.points;
    const issued=dayjs(); const exp=issued.add(30,"minute");
    const ticketId=nanoid(10);
    const payload={v:1,tid:ticketId,rid:reward.id,pts:reward.points,ts:issued.toISOString(),exp:exp.toISOString()};
    const qrPayload=btoa(JSON.stringify(payload)); // demo only

    const t:RedemptionTicket={
      ticketId, rewardId: reward.id, title: reward.title, vendor: reward.vendor,
      points: reward.points, issuedAt: issued.toISOString(), expiresAt: exp.toISOString(),
      status:"active", qrPayload
    };
    const updated=[...get().redemptions,t];
    set({points:next, redemptions:updated}); save(LS_POINTS,next); save(LS_TIX,updated);
    return t;
  },

  consumeTicket:(id)=>{
    const upd=get().redemptions.map(t=>t.ticketId===id?{...t,status:"consumed" as const}:t);
    set({redemptions:upd}); save(LS_TIX,upd);
  },

  expireTickets:()=>{
    const now=dayjs(); const upd=get().redemptions.map(t=> t.status==="active"&&now.isAfter(dayjs(t.expiresAt))?{...t,status:"expired" as const}:t);
    set({redemptions:upd}); save(LS_TIX,upd);
  },

  // UI wiring
  uiOpen:false, uiSelected:null,
  openRedeem:(r=null)=>set({uiOpen:true, uiSelected:r??null}),
  closeRedeem:()=>set({uiOpen:false, uiSelected:null}),
}));

// --- Swipe control
const SwipeToClaim: React.FC<{ onConfirm:()=>void; disabled?:boolean }> = ({onConfirm,disabled})=>{
  const [progress,setProgress]=useState(0);
  const ctrl=useAnimation();
  return (
    <div className="relative w-full h-14 rounded-xl overflow-hidden bg-black/30 border border-white/10">
      <motion.div
        drag="x" dragConstraints={{left:0,right:280}} dragElastic={0.04}
        onDrag={(e,info)=> setProgress(Math.min(1,Math.max(0,info.point.x/280)))}
        onDragEnd={()=>{ if(progress>0.85 && !disabled){ onConfirm(); } ctrl.start({x:0}); setProgress(0); }}
        animate={ctrl}
        className="h-14 w-36 rounded-xl grid place-items-center text-sm font-medium text-white shadow-lg"
        style={{ background:"linear-gradient(135deg, rgba(40,255,190,0.8), rgba(0,200,120,0.8))" }}
      >
        Swipe to claim →
      </motion.div>
      <div className="absolute left-0 top-0 h-full bg-emerald-500/10" style={{width:`${progress*100}%`}}/>
    </div>
  );
};

// --- Modal
export const RedeemModal: React.FC = () => {
  const { uiOpen, uiSelected, closeRedeem, points, redeem } = useRewardsStore();
  const [ticket,setTicket]=useState<RedemptionTicket|null>(null);
  useEffect(()=>{ if(!uiOpen) setTicket(null); },[uiOpen]);

  const canRedeem = uiSelected ? points >= uiSelected.points : false;

  return (
    <AnimatePresence>
      {uiOpen && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-black/60"
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <motion.div
            initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} exit={{y:20,opacity:0}}
            className="w-[min(800px,92vw)] backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            {!ticket ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700" />
                  <div>
                    <h3 className="text-white text-lg font-semibold">{uiSelected ? uiSelected.title : "Redeem Rewards"}</h3>
                    <p className="text-white/60 text-sm">{uiSelected?.vendor ?? "Choose any available perk"}</p>
                  </div>
                  <div className="ml-auto text-emerald-400 font-semibold">{uiSelected ? `${uiSelected.points} pts` : ""}</div>
                </div>

                <div className="my-6 text-sm text-white/70">
                  Confirm redemption. You'll receive a time-limited QR code to present at the vendor.
                </div>

                <SwipeToClaim
                  disabled={!canRedeem}
                  onConfirm={()=>{
                    if(!uiSelected) return;
                    const t=redeem(uiSelected);
                    if(t) setTicket(t);
                  }}
                />

                <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                  <span>Balance: {points.toLocaleString()} pts</span>
                  {!canRedeem && uiSelected && <span className="text-rose-400">Not enough points</span>}
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={closeRedeem} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white">Close</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-white text-lg font-semibold mb-2">Show this QR to redeem</h3>
                <div className="grid place-items-center py-6">
                  <div className="rounded-2xl p-4 bg-black/40 border border-white/10">
                    <QRCodeCanvas value={ticket.qrPayload} size={220} level="M" includeMargin />
                  </div>
                  <p className="mt-3 text-white/60 text-xs">
                    Ticket: {ticket.ticketId} — {ticket.points} pts — Expires in 30 min
                  </p>
                </div>
                <div className="flex justify-end">
                  <button onClick={closeRedeem} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white">Done</button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Simple helper hook you can call from any button
export const useRedeemUI = () => {
  const openRedeem = useRewardsStore(s=>s.openRedeem);
  return { openRedeem };
};
