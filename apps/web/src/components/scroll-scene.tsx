"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import type { ReactNode } from "react";

type ScrollSceneProps = {
  children: ReactNode;
  className?: string;
  distance?: number;
  axis?: "x" | "y";
};

export function ScrollScene({ children, className = "", distance = 48, axis = "y" }: ScrollSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 92, damping: 24, mass: 0.22 });
  const shift = useTransform(smoothProgress, [0, 0.3, 0.72, 1], [distance, 0, 0, -distance * 0.18]);
  const opacity = useTransform(smoothProgress, [0, 0.14, 0.88, 1], [0.08, 1, 1, 0.9]);
  const style = reduceMotion ? undefined : axis === "x" ? { x: shift, opacity } : { y: shift, opacity };

  return (
    <motion.div ref={ref} className={`scroll-scene ${className}`} style={style}>
      {children}
    </motion.div>
  );
}
