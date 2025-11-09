import React, { useEffect, useMemo, useState } from "react";
import { Reward, useRewardsEngine } from "@/lib/rewardsEngine";
import SwipeToClaim from "./SwipeToClaim";

type Props = {
  open: boolean;
  onClose: () => void;
  reward: Reward | null;
};

export default function RedeemModal({ open, onClose, reward }: Props) {
  const { user, redeem, tickets, markUsed, expireSweep } = useRewardsEngine();
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const ticket = useMemo(
    () => tickets.find(t => t.id === ticketId) || null,
    [tickets, ticketId]
  );

  useEffect(() => {
    const id = setInterval(expireSweep, 1000);
    return () => clearInterval(id);
  }, [expireSweep]);

  if (!open || !reward) return null;

  const canAfford = user.points >= reward.pointsCost;

  const onSwipeComplete = async () => {
    if (!canAfford) return;
    try {
      setLoading(true);
      const t = await redeem(reward.id);
      setTicketId(t.id);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const secondsLeft = ticket ? Math.max(0, Math.floor((ticket.expiresAt - Date.now()) / 1000)) : 0;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-900/80 ring-1 ring-white/15 shadow-2xl p-6 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center"
          aria-label="Close"
        >
          ✕
        </button>

        {!ticket && (
          <>
            <div className="mb-4">
              <div className="text-sm text-neutral-400">Redeem</div>
              <div className="text-xl font-semibold text-white">{reward.title}</div>
              <div className="text-neutral-400 text-sm">{reward.partner}</div>
            </div>
            <div className="mb-6 flex items-center justify-between">
              <div className="text-neutral-300 text-sm">
                Cost: <span className="text-white font-semibold">{reward.pointsCost} pts</span>
              </div>
              <div className="text-neutral-300 text-sm">
                Balance: <span className="text-white font-semibold">{user.points} pts</span>
              </div>
            </div>

            <SwipeToClaim
              onComplete={onSwipeComplete}
              label={canAfford ? "Swipe to claim →" : "Not enough points"}
            />
            {loading && <div className="mt-3 text-sm text-neutral-300">Issuing ticket…</div>}

            <p className="mt-6 text-xs text-neutral-400">
              You'll receive a time-limited QR code. Present it at the partner to collect your perk.
            </p>
          </>
        )}

        {ticket && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="text-sm text-neutral-400">Your ticket</div>
              <div className="text-xl font-semibold text-white">{ticket.title}</div>
              <div className="text-neutral-400 text-sm">{ticket.partner}</div>
              <div className="mt-3 text-emerald-400 text-sm">
                Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => markUsed(ticket.id)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  Mark as used
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                >
                  Close
                </button>
              </div>
              <p className="mt-3 text-xs text-neutral-400">
                Staff: scan QR and verify ticket id <span className="text-neutral-300 font-mono">{ticket.id}</span>.
              </p>
            </div>
            <div className="grid place-items-center">
              <img
                src={ticket.qrDataUrl}
                alt="QR code"
                className="w-64 h-64 rounded-xl bg-white p-3 shadow-xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
