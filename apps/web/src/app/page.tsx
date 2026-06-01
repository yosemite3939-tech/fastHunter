import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CirclePause,
  Gauge,
  Link2,
  ListChecks,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { MotionReveal } from "@/components/motion-reveal";
import { PixelBat } from "@/components/pixel-bat";
import { ProductPreview } from "@/components/product/product-preview";
import { HeroSignalField } from "@/components/product/hero-signal-field";
import { HomeMotionField } from "@/components/product/home-motion-field";
import { ScreenshotFrame } from "@/components/product/screenshot-frame";
import { VideoFrame } from "@/components/product/video-frame";
import { BrandMark, ButtonLink, SectionLabel, TerminalLine } from "@/components/ui";
import { DOWNLOADS, FEATURES, PRODUCT, SCREENSHOTS } from "@/data/product";

const icons = [Rocket, CirclePause, ListChecks, Activity, RefreshCcw, SlidersHorizontal, Gauge, Link2, Sparkles, ShieldCheck];

export default function HomePage() {
  return (
    <div className="home-motion-shell">
      <HomeMotionField />
      <section className="home-hero wrap">
        <PixelBat />
        <HeroSignalField />
        <div className="home-hero-copy">
          <SectionLabel index="00">Download Manager</SectionLabel>
          <h1><BrandMark /></h1>
          <p className="hero-headline">Download faster.<br /><span>Stay in control.</span></p>
          <p className="hero-description">
            A minimalist Windows download manager for direct control, reliable transfers, and a sharp interface.
          </p>
          <div className="hero-actions">
            <ButtonLink href={DOWNLOADS.installer} download>Download for Windows</ButtonLink>
            <ButtonLink href="#screenshots" variant="secondary">View Screenshots</ButtonLink>
          </div>
          <div className="hero-meta">
            {[PRODUCT.version, "Windows x64", "Free", "Stable", "Updated May 31"].map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
        <div className="home-preview hero-preview-boot">
          <ProductPreview />
        </div>
      </section>

      <section className="ticker">
        <div>
          <span>PASTE</span><i>+</i><span>FETCH</span><i>+</i><span>RUN</span><i>+</i>
          <span>PAUSE</span><i>+</i><span>RESUME</span><i>+</i><span>COMPLETE</span><i>+</i>
        </div>
      </section>

      <section id="screenshots" className="content-section wrap">
        <MotionReveal className="section-heading">
          <SectionLabel index="01">Product interface</SectionLabel>
          <div>
            <h2>Built around clarity.</h2>
            <p>Every status is visible. Every action stays close. Nothing gets between the file and the finish line.</p>
          </div>
        </MotionReveal>
        <div className="screenshots-stack">
          {SCREENSHOTS.map((screenshot, index) => (
            <MotionReveal key={screenshot.src} delay={index * 0.08}>
              {screenshot.isVideo ? (
                <VideoFrame src={screenshot.src} title={screenshot.title} caption={screenshot.caption} />
              ) : (
                <ScreenshotFrame {...screenshot} priority={index === 0} />
              )}
            </MotionReveal>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="wrap">
          <MotionReveal className="section-heading">
            <SectionLabel index="02">Capability list</SectionLabel>
            <div><h2>Only what earns its place.</h2><p>No crowded controls. No buried state. Just a focused transfer tool.</p></div>
          </MotionReveal>
          <div className="grid-4">
            {FEATURES.map(([title, body], index) => {
              const Icon = icons[index];
              return <MotionReveal key={title} delay={(index % 4) * 0.04}><article className="info-card"><Icon size={19} /><h3>{title}</h3><p>{body}</p></article></MotionReveal>;
            })}
          </div>
        </div>
      </section>

      <section className="content-section wrap workflow-section">
        <MotionReveal className="section-heading">
          <SectionLabel index="03">Workflow</SectionLabel>
          <div><h2>Three steps.<br />No circus.</h2><p>Paste the source. Fetch the file. Stay in control until the transfer completes.</p></div>
        </MotionReveal>
        <MotionReveal className="workflow-grid">
          {[["001", "Paste URL", "Point fast\\Hunter. at a direct HTTP or HTTPS file."], ["002", "Fetch download", "Start a clean transfer with visible speed and status."], ["003", "Pause. Resume. Complete.", "Control the queue without fighting the interface."]].map(([number, title, body]) => (
            <article key={number}>
              <span>{number}</span><h3>{title}</h3><p>{body}</p>
            </article>
          ))}
        </MotionReveal>
        <MotionReveal className="workflow-terminal" delay={0.1}>
          <TerminalLine command="fetch" text="https://releases.example.com/archive-x64.zip" />
          <TerminalLine command="run" text=":: segmented transfer active [08 threads]" />
          <TerminalLine text=":: archive-x64.zip completed in 00:42" dim />
        </MotionReveal>
      </section>

      <section className="philosophy">
        <MotionReveal className="wrap philosophy-grid" distance={42}>
          <SectionLabel index="04">Manifesto</SectionLabel>
          <div>
            <h2>Software should not fight the user.</h2>
            <p>Most download managers feel old, bloated, or visually messy. fast\Hunter. is built to feel fast, readable, and under your control.</p>
            <Link href="/about">Read the manifesto <ArrowRight size={16} /></Link>
          </div>
        </MotionReveal>
      </section>

      <MotionReveal className="final-cta wrap" distance={44}>
        <SectionLabel index="05">Get the build</SectionLabel>
        <h2>Ready to<br />download?</h2>
        <div className="hero-actions">
          <ButtonLink href={DOWNLOADS.installer} download>Download for Windows</ButtonLink>
          <ButtonLink href="/changelog" variant="secondary">Read Changelog</ButtonLink>
        </div>
      </MotionReveal>
    </div>
  );
}
