import { Coffee, Cpu, FlaskConical, HeartHandshake, Palette, Server } from "lucide-react";
import { ButtonLink, PageHero, SectionLabel } from "@/components/ui";
import { SUPPORT_LINKS } from "@/data/product";

export const metadata = { title: "Donate" };

const impact = [
  [Cpu, "Development time"],
  [Server, "Hosting"],
  [FlaskConical, "Testing"],
  [Palette, "UI improvements"],
] as const;

const supportModes = [
  ["Coffee", "A small nod to the next focused build."],
  ["Development", "Support the hours behind the desktop app."],
  ["Future features", "Back the roadmap without adding noise."],
  ["Custom amount", "Send the amount that feels right."],
];

export default function DonatePage() {
  return (
    <>
      <PageHero eyebrow="Optional support" title="Support fast\\Hunter." description="Help keep the project clean, free, and independent. No pressure. The official build stays available either way.">
        <ButtonLink href={SUPPORT_LINKS.kofi} external>Support via Ko-fi</ButtonLink>
        <ButtonLink href={SUPPORT_LINKS.trakteer} variant="secondary" external>Support via Trakteer</ButtonLink>
      </PageHero>
      <section className="content-section wrap">
        <div className="section-heading"><SectionLabel index="01">Why support</SectionLabel><div><h2>Fund the work, not the clutter.</h2><p>Support lets an independent tool stay focused on careful engineering, clean interfaces, and useful improvements.</p></div></div>
        <div className="grid-4">{impact.map(([Icon, label]) => <article className="info-card" key={label}><Icon size={19} /><h3>{label}</h3><p>Keep this part of the project moving.</p></article>)}</div>
      </section>
      <section className="content-section wrap">
        <div className="section-heading"><SectionLabel index="02">Support modes</SectionLabel><div><h2>Choose your signal.</h2></div></div>
        <div className="donate-grid">
          {supportModes.map(([title, body], index) => <article key={title}><span>00{index + 1}</span><Coffee size={19} /><h3>{title}</h3><p>{body}</p><a href={index % 2 === 0 ? SUPPORT_LINKS.kofi : SUPPORT_LINKS.trakteer} target="_blank" rel="noreferrer">{index % 2 === 0 ? "open ko-fi" : "open trakteer"} -&gt;</a></article>)}
        </div>
      </section>
      <section className="donate-note wrap"><HeartHandshake size={22} /><p>Donations are optional. Downloading fast\Hunter. does not require an account, subscription, or payment.</p></section>
    </>
  );
}
