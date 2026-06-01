"use client";

import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";

const modes = [
  {
    id: "range",
    label: "RANGE",
    command: "fetch --threads 08",
    metric: "18.4 MB/S",
    status: "SEGMENT LOCK",
  },
  {
    id: "queue",
    label: "QUEUE",
    command: "inspect --queue live",
    metric: "02 ACTIVE",
    status: "ROUTE CLEAR",
  },
  {
    id: "retry",
    label: "RETRY",
    command: "retry --adaptive",
    metric: "00 FAILED",
    status: "AUTO HEAL",
  },
] as const;

const nodes = [
  { x: 16, y: 34, label: "A1" },
  { x: 29, y: 72, label: "B4" },
  { x: 48, y: 22, label: "C8" },
  { x: 68, y: 63, label: "D2" },
  { x: 83, y: 38, label: "E6" },
] as const;

export function InteractiveSignalLab() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<(typeof modes)[number]>(modes[0]);

  function updateReticle(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    event.currentTarget.style.setProperty("--signal-x", `${x}%`);
    event.currentTarget.style.setProperty("--signal-y", `${y}%`);
  }

  function centerReticle() {
    stageRef.current?.style.setProperty("--signal-x", "50%");
    stageRef.current?.style.setProperty("--signal-y", "50%");
  }

  return (
    <div className="signal-lab">
      <div className="signal-lab-head">
        <span>FH://SIGNAL_LAB</span>
        <i />
        <em>[ interactive telemetry ]</em>
      </div>

      <div
        ref={stageRef}
        className="signal-lab-stage"
        style={{ "--signal-x": "50%", "--signal-y": "50%" } as CSSProperties}
        onPointerMove={updateReticle}
        onPointerLeave={centerReticle}
      >
        <span className="signal-grid" aria-hidden="true" />
        <span className="signal-ring signal-ring-a" aria-hidden="true" />
        <span className="signal-ring signal-ring-b" aria-hidden="true" />
        <span className="signal-ring signal-ring-c" aria-hidden="true" />
        <span className="signal-sweep" aria-hidden="true" />
        <span className="signal-reticle" aria-hidden="true">
          <i />
          <i />
        </span>
        <span className="signal-core" aria-hidden="true" />

        {nodes.map((node) => (
          <span
            className="signal-node"
            key={node.label}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            aria-hidden="true"
          >
            <b />
            {node.label}
          </span>
        ))}

        <div className="signal-readout">
          <small>:: ACTIVE MODE</small>
          <strong>{mode.label}</strong>
          <code>root@fasthunter:~$ {mode.command}</code>
          <p>
            <span>{mode.metric}</span>
            <em>{mode.status}</em>
          </p>
        </div>
      </div>

      <div className="signal-lab-controls" role="group" aria-label="Signal lab mode">
        {modes.map((option) => (
          <button
            key={option.id}
            type="button"
            className={option.id === mode.id ? "active" : ""}
            aria-pressed={option.id === mode.id}
            onClick={() => setMode(option)}
          >
            <span>{option.label}</span>
            <em>:: {option.status}</em>
          </button>
        ))}
      </div>
    </div>
  );
}
