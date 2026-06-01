"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/ui";

const INTRO_SEEN_KEY = "fasthunter-entry-intro-seen";

export function SiteEntryIntro() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const alreadySeen = window.sessionStorage.getItem(INTRO_SEEN_KEY);
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "true");
    const timer = window.setTimeout(() => setVisible(false), reduceMotion || alreadySeen ? 0 : 2450);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="site-entry-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(18px)" }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <motion.div
            className="entry-intro-mark"
            initial={{ opacity: 0, scale: 0.82, filter: "blur(22px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <BrandMark />
          </motion.div>
          <motion.p
            className="entry-intro-command"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.5 }}
          >
            root@fasthunter:~$ boot --surface web
          </motion.p>
          <motion.div
            className="entry-intro-progress"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.72, duration: 1.34, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.span
            className="entry-intro-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.38, duration: 0.38 }}
          >
            [ SYSTEM ONLINE ]
          </motion.span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
