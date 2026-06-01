import { Check, FileCheck2, Puzzle } from "lucide-react";
import { DownloadCard } from "@/components/product/download-card";
import { ChecksumCopy } from "@/components/product/checksum-copy";
import { ButtonLink, PageHero, SectionLabel, StatusBadge, TerminalLine } from "@/components/ui";
import { DOWNLOADS, PRODUCT } from "@/data/product";

export const metadata = { title: "Download" };

export default function DownloadPage() {
  return (
    <>
      <PageHero eyebrow="Official download" title="Download fast\\Hunter." description="Get the latest official Windows build. No ads. No bundled installer. No detours.">
        <ButtonLink href={DOWNLOADS.installer} download>Download .EXE</ButtonLink>
        <ButtonLink href={DOWNLOADS.extension} variant="secondary" download>Get Chrome Extension</ButtonLink>
      </PageHero>
      <section className="content-section wrap download-grid">
        <DownloadCard />
        <aside className="safety-card">
          <SectionLabel>Build integrity</SectionLabel>
          <h2>Clean means clean.</h2>
          {["Official download", "No bundled installer", "No ads", "No user tracking", "Standards-based HTTP transfers"].map((item) => <p key={item}><Check size={14} />{item}</p>)}
        </aside>
      </section>
      <section className="content-section wrap">
        <div className="section-heading">
          <SectionLabel index="01">Verification</SectionLabel>
          <div><h2>Check the build.</h2><p>Verify the official installer before running it. Transparency should be a default, not a bonus feature.</p></div>
        </div>
        <div className="checksum">
          <div><FileCheck2 size={18} /><span>SHA256 // FastHunter-Downloader-1.0.0.exe</span></div>
          <code>{PRODUCT.sha256}</code>
          <ChecksumCopy value={PRODUCT.sha256} />
        </div>
      </section>
      <section className="content-section wrap">
        <div className="section-heading">
          <SectionLabel index="02">Install flow</SectionLabel>
          <div><h2>From zero to fetch.</h2><p>The Windows installer gets the desktop app in place. Extension capture remains opt-in and manual.</p></div>
        </div>
        <div className="install-steps">
          {["Download installer", "Run setup", "Launch fast\\Hunter.", "Paste URL and fetch"].map((item, index) => <p key={item}><span>00{index + 1}</span><b>{item}</b></p>)}
        </div>
        <div className="extension-guide">
          <Puzzle size={22} />
          <div>
            <h3>Chrome / Edge extension</h3>
            <p>Download the ZIP, unpack it, open <code>chrome://extensions</code>, enable Developer mode, and choose Load unpacked. The desktop installer and browser extension use a consent-first connection.</p>
            <ButtonLink href={DOWNLOADS.extension} variant="secondary" download>Download extension ZIP</ButtonLink>
          </div>
        </div>
      </section>
      <section className="content-section wrap">
        <div className="grid-2">
          <div className="plain-panel"><SectionLabel>System requirements</SectionLabel><TerminalLine text="Windows 10 or later" /><TerminalLine text="x64 architecture" /><TerminalLine text="Direct internet connection" /><TerminalLine text="120 MB free disk space" /></div>
          <div className="plain-panel"><SectionLabel>Previous versions</SectionLabel><div className="version-row"><span>v0.9.0</span><StatusBadge>beta archive</StatusBadge><em>not publicly distributed</em></div></div>
        </div>
      </section>
    </>
  );
}
