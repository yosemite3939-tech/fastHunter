import { ArrowRight, BookOpen, Download, FolderCog, PauseCircle, Search, ShieldQuestion } from "lucide-react";
import { ButtonLink, PageHero, SectionLabel } from "@/components/ui";
import { DOWNLOADS } from "@/data/product";
import { HELP_ARTICLES, HELP_CATEGORIES } from "@/data/help";

export const metadata = { title: "Help Center" };

const icons = [BookOpen, Download, PauseCircle, FolderCog, ShieldQuestion, Search];

export default function HelpPage() {
  return (
    <>
      <PageHero eyebrow="Help center" title="Find the command you need." description="Install cleanly, fetch your first file, connect the extension, and solve common transfer issues.">
        <label className="help-search"><Search size={17} /><input aria-label="Search help articles" placeholder="search help articles..." /></label>
      </PageHero>
      <section className="content-section wrap">
        <div className="section-heading"><SectionLabel index="01">Categories</SectionLabel><div><h2>Start with the surface.</h2></div></div>
        <div className="grid-3">{HELP_CATEGORIES.map((item, index) => { const Icon = icons[index]; return <article className="info-card help-category" key={item}><Icon size={19} /><h3>{item}</h3><p>Open directory <ArrowRight size={14} /></p></article>; })}</div>
      </section>
      <section className="content-section wrap">
        <div className="section-heading"><SectionLabel index="02">Articles</SectionLabel><div><h2>Short answers. Useful steps.</h2></div></div>
        <div className="article-list">{HELP_ARTICLES.map(([title, description, time], index) => <article key={title}><span>00{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div><em>{time}</em><ArrowRight size={16} /></article>)}</div>
      </section>
      <section className="content-section wrap">
        <div className="extension-guide"><Download size={22} /><div><h3>Need the browser extension?</h3><p>Download the official ZIP and follow the Chrome or Edge manual-load instructions.</p><ButtonLink href={DOWNLOADS.extension} variant="secondary" download>Download extension ZIP</ButtonLink></div></div>
      </section>
    </>
  );
}
