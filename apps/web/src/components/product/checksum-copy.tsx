"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clipboard } from "lucide-react";

export function ChecksumCopy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    };
  }, []);

  async function copyChecksum() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={copyChecksum} aria-live="polite">
      {copied ? <Check size={15} /> : <Clipboard size={15} />}
      {copied ? "copied" : "copy"}
    </button>
  );
}
