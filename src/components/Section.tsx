'use client';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
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
  const isInView = useInView(ref, { margin: "-20% 0px -20% 0px" });

  return (
    <section id={id} ref={ref} className="relative">
      {/* seam between sections */}
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
      <motion.div
        style={{ y, opacity }}
        animate={{ 
          backgroundColor: isInView ? 'rgba(16, 185, 129, 0.03)' : 'rgba(0, 0, 0, 0)',
        }}
        transition={{ duration: 0.6 }}
        className={`mx-auto max-w-6xl px-5 py-14 md:py-24 rounded-3xl ${dark ? '' : ''}`}
      >
        {headline && (
          <div className="mb-8">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">{headline}</h2>
            {subhead && <p className="text-muted-foreground mt-3 max-w-2xl">{subhead}</p>}
          </div>
        )}
        {children}
      </motion.div>
    </section>
  );
}
