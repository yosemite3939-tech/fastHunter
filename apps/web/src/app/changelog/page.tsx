import { Download } from "lucide-react";
import { ButtonLink, PageHero, SectionLabel, StatusBadge } from "@/components/ui";
import { DOWNLOADS } from "@/data/product";
import { CHANGELOG } from "@/data/changelog";

export const metadata = { title: "Changelog" };

export default function ChangelogPage() {
  return (
    <>
      <PageHero eyebrow="Release archive" title="Track every build." description="Readable changes, known issues, and official release links. Progress should leave a trail.">
        <ButtonLink href={DOWNLOADS.installer} download>Get latest build</ButtonLink>
      </PageHero>
      <section className="content-section wrap">
        <div className="changelog-toolbar">
          <SectionLabel index="01">Version timeline</SectionLabel>
          <div>{["All", "Stable", "Beta", "Hotfix"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item} type="button">{item}</button>)}</div>
        </div>
        <div className="changelog-list">
          {CHANGELOG.map((entry, index) => (
            <article className="change-item" key={entry.version}>
              <div className="change-aside"><span>00{index + 1}</span><h2>{entry.version}</h2><p>{entry.date}</p><StatusBadge tone={index === 0 ? "accent" : "default"}>{entry.status}</StatusBadge></div>
              <div className="change-body">
                <ChangeGroup title="Added" items={entry.added} />
                <ChangeGroup title="Improved" items={entry.improved} />
                <ChangeGroup title="Fixed" items={entry.fixed} />
                <ChangeGroup title="Known issues" items={entry.known} />
                {index === 0 ? <a href={DOWNLOADS.installer} download><Download size={14} />download official build</a> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ChangeGroup({ title, items }: { title: string; items: string[] }) {
  return <div className="change-group"><h3>{title}</h3>{items.map((item) => <p key={item}>+ {item}</p>)}</div>;
}
