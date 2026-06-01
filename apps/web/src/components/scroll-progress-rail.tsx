"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

export function ScrollProgressRail() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.18 });

  if (reduceMotion) return null;

  return (
    <div className="scroll-progress-rail" aria-hidden="true">
      <span>SCROLL</span>
      <i><motion.b style={{ scaleY }} /></i>
    </div>
  );
}
