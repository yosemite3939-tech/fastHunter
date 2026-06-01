"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

export function HomeMotionField() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 88, damping: 26, mass: 0.2 });
  const driftA = useTransform(smoothProgress, [0, 1], [-40, 170]);
  const driftB = useTransform(smoothProgress, [0, 1], [80, -120]);
  const driftC = useTransform(smoothProgress, [0, 1], [-70, 130]);
  const driftD = useTransform(smoothProgress, [0, 1], [55, -90]);

  return (
    <div className="scroll-motion-field" aria-hidden="true">
      <motion.span className="scroll-token scroll-token-a" style={reduceMotion ? undefined : { y: driftA }}>{"// ACTIVE_QUEUE"}</motion.span>
      <motion.span className="scroll-token scroll-token-b" style={reduceMotion ? undefined : { y: driftB }}>[ 08 THREADS ]</motion.span>
      <motion.span className="scroll-token scroll-token-c" style={reduceMotion ? undefined : { y: driftC }}>:: FETCH_COMPLETE</motion.span>
      <motion.span className="scroll-token scroll-token-d" style={reduceMotion ? undefined : { y: driftD }}>ROOT / HUNTER</motion.span>
    </div>
  );
}
