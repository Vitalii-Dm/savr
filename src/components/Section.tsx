'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import React, { PropsWithChildren, useRef } from 'react';

type Props = PropsWithChildren<{
  id: string;
  headline?: string;
  subhead?: string;
  dark?: boolean;
}>;

export default function Section({ id, headline, subhead, dark, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['-10% 80%', '60% 20%'] });
  const y = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id={id} ref={ref} className="relative">
      {/* seam between sections */}
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <motion.div
        style={{ y, opacity }}
        className={`mx-auto max-w-6xl px-5 py-14 md:py-24 ${dark ? '' : ''}`}
      >
        {headline && (
          <div className="mb-8">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">{headline}</h2>
            {subhead && <p className="text-white/70 mt-3 max-w-2xl">{subhead}</p>}
          </div>
        )}
        {children}
      </motion.div>
    </section>
  );
}
