import { Aperture, Eye, Gauge, GitBranch, Shield, Sparkles } from "lucide-react";
import { InteractiveSignalLab } from "@/components/about/interactive-signal-lab";
import { MotionReveal } from "@/components/motion-reveal";
import { ScrollProgressRail } from "@/components/scroll-progress-rail";
import { ScrollScene } from "@/components/scroll-scene";
import { PageHero, SectionLabel, TerminalLine } from "@/components/ui";

export const metadata = { title: "About" };

const values = [
  [Gauge, "Speed", "Use the connection intelligently without pretending limits do not exist."],
  [Aperture, "Simplicity", "Make the useful path visible and keep the noise outside."],
  [GitBranch, "Freedom", "Direct downloads. Local state. Clear behavior."],
  [Shield, "Control", "Pause, resume, retry, and understand what is happening."],
  [Sparkles, "Design", "A tool can be technical without becoming visually exhausting."],
  [Eye, "Transparency", "No ads, no bundled offers, no hidden transfer tricks."],
] as const;

const roadmap = [
  "Browser extension registration flow",
  "Adaptive segment sizing",
  "Better retry visibility",
  "Speed graph refinement",
  "Download scheduler",
  "More platforms",
] as const;

export default function AboutPage() {
  return (
    <div className="about-motion-shell">
      <ScrollProgressRail />

      <PageHero
        eyebrow="About the project"
        title="Fast, clean, under your control."
        description="fast\\Hunter. is an independent Windows download manager made for users who want their tools to stay useful, readable, and honest."
      />

      <div className="about-command-rail" aria-hidden="true">
        <span>01 HUNT</span>
        <i />
        <span>02 CONTROL</span>
        <i />
        <span>03 RESUME</span>
        <i />
        <span>04 COMPLETE</span>
      </div>

      <ScrollScene distance={52}>
        <section className="content-section wrap">
          <div className="section-heading">
            <SectionLabel index="01">Manifesto</SectionLabel>
            <div>
              <h2>Software should know when to get out of the way.</h2>
              <p>
                A download manager has one job: move files with clarity. fast\Hunter. exposes the
                state you need, keeps actions close, and refuses the usual clutter.
              </p>
            </div>
          </div>
          <div className="about-manifesto-grid">
            <div className="manifesto-terminal">
              <TerminalLine command="status" text=":: independent build" />
              <TerminalLine command="inspect" text=":: standards-based segmented HTTP transfers" />
              <TerminalLine command="privacy" text=":: no cookies read // no DRM bypass // no user tracking" />
            </div>
            <div className="about-statement" aria-hidden="true">
              <span>DIRECT</span>
              <span>VISIBLE</span>
              <span>LOCAL.</span>
            </div>
          </div>
        </section>
      </ScrollScene>

      <ScrollScene distance={72}>
        <section id="signal-lab" className="content-section wrap about-lab-section">
          <div className="section-heading">
            <SectionLabel index="02">Signal lab</SectionLabel>
            <div>
              <h2>Point. Inspect. Tune the hunt.</h2>
              <p>
                Move across the telemetry field and switch modes. The interface is built around
                readable state: every transfer should tell you what it is doing.
              </p>
            </div>
          </div>
          <InteractiveSignalLab />
        </section>
      </ScrollScene>

      <ScrollScene distance={58}>
        <section className="content-section wrap">
          <div className="section-heading">
            <SectionLabel index="03">Values</SectionLabel>
            <div>
              <h2>Six rules for the hunt.</h2>
            </div>
          </div>
          <div className="grid-3 about-values-grid">
            {values.map(([Icon, title, body], index) => (
              <MotionReveal delay={index * 0.06} key={title}>
                <article className="info-card">
                  <Icon size={19} />
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              </MotionReveal>
            ))}
          </div>
        </section>
      </ScrollScene>

      <ScrollScene distance={48}>
        <section className="content-section wrap">
          <div className="section-heading">
            <SectionLabel index="04">Roadmap</SectionLabel>
            <div>
              <h2>Build forward. Stay focused.</h2>
            </div>
          </div>
          <div className="roadmap">
            {roadmap.map((item, index) => (
              <p key={item}>
                <span>0{index + 1}</span>
                <b>{item}</b>
                <em>{index < 2 ? ":: active" : ":: queued"}</em>
              </p>
            ))}
          </div>
        </section>
      </ScrollScene>
    </div>
  );
}
