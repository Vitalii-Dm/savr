import React, { useRef, useState } from "react";

type Props = {
  onComplete: () => void;
  label?: string;
};

export default function SwipeToClaim({ onComplete, label = "Swipe to claim →" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0);
  const [dragging, setDragging] = useState(false);

  const start = (clientX: number) => {
    setDragging(true);
    (trackRef.current as any)._startX = clientX;
    (trackRef.current as any)._startPos = pos;
  };
  const move = (clientX: number) => {
    if (!dragging || !trackRef.current) return;
    const dx = clientX - (trackRef.current as any)._startX;
    const next = Math.max(0, Math.min(100, (trackRef.current as any)._startPos + (dx / trackRef.current.clientWidth) * 100));
    setPos(next);
  };
  const end = () => {
    setDragging(false);
    if (pos > 85) {
      setPos(100);
      onComplete();
    } else {
      setPos(0);
    }
  };

  return (
    <div
      ref={trackRef}
      className="relative h-12 w-full rounded-xl bg-neutral-800/70 backdrop-blur ring-1 ring-white/10 overflow-hidden select-none"
      onMouseDown={(e) => start(e.clientX)}
      onMouseMove={(e) => move(e.clientX)}
      onMouseUp={end}
      onMouseLeave={() => dragging && end()}
      onTouchStart={(e) => start(e.touches[0].clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
      onTouchEnd={end}
      aria-label="Swipe to claim"
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
    >
      <div className="absolute inset-0 grid place-items-center text-sm text-neutral-300">
        {label}
      </div>
      <div
        className="absolute top-1 bottom-1 left-1 will-change-transform rounded-xl bg-emerald-500/90 shadow-lg"
        style={{ width: `calc(${pos}% + 2.5rem)` }}
      />
      <div
        className="absolute top-1 bottom-1 left-1 w-10 rounded-xl bg-emerald-400 shadow shadow-emerald-900"
        style={{ transform: `translateX(${pos}%)` }}
      />
    </div>
  );
}
