import { Aperture, Eye, Gauge, GitBranch, Shield, Sparkles } from "lucide-react";
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

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About the project" title="Fast, clean, under your control." description="fast\\Hunter. is an independent Windows download manager made for users who want their tools to stay useful, readable, and honest." />
      <section className="content-section wrap">
        <div className="section-heading"><SectionLabel index="01">Manifesto</SectionLabel><div><h2>Software should know when to get out of the way.</h2><p>A download manager has one job: move files with clarity. fast\Hunter. exposes the state you need, keeps actions close, and refuses the usual clutter.</p></div></div>
        <div className="manifesto-terminal"><TerminalLine command="status" text=":: independent build" /><TerminalLine command="inspect" text=":: standards-based segmented HTTP transfers" /><TerminalLine command="privacy" text=":: no cookies read // no DRM bypass // no user tracking" /></div>
      </section>
      <section className="content-section wrap">
        <div className="section-heading"><SectionLabel index="02">Values</SectionLabel><div><h2>Six rules for the hunt.</h2></div></div>
        <div className="grid-3">{values.map(([Icon, title, body]) => <article className="info-card" key={title}><Icon size={19} /><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>
      <section className="content-section wrap">
        <div className="section-heading"><SectionLabel index="03">Roadmap</SectionLabel><div><h2>Build forward. Stay focused.</h2></div></div>
        <div className="roadmap">{["Browser extension registration flow", "Adaptive segment sizing", "Better retry visibility", "Speed graph refinement", "Download scheduler", "More platforms"].map((item, index) => <p key={item}><span>0{index + 1}</span><b>{item}</b><em>{index < 2 ? ":: active" : ":: queued"}</em></p>)}</div>
      </section>
    </>
  );
}
