import Link from "next/link";
import { ArrowRight, MessageSquarePlus, Search } from "lucide-react";
import { ButtonLink, PageHero, StatusBadge } from "@/components/ui";
import { FORUM_TOPICS } from "@/data/forum";

export const metadata = { title: "Community Forum" };

export default function ForumPage() {
  return (
    <>
      <PageHero eyebrow="Community" title="Forum." description="A minimal discussion space for setup notes, transfer questions, feedback, and the next useful feature.">
        <ButtonLink href="/forum/register">Create account</ButtonLink>
        <ButtonLink href="/forum/login" variant="secondary">Login</ButtonLink>
      </PageHero>
      <section className="content-section wrap">
        <div className="forum-toolbar">
          <label><Search size={16} /><input aria-label="Search forum discussions" placeholder="search discussions..." /></label>
          <select aria-label="Filter forum category"><option>all categories</option><option>getting-started</option><option>feature-request</option><option>release</option></select>
          <button type="button"><MessageSquarePlus size={15} /> New Topic</button>
        </div>
        <div className="topic-list">
          <div className="topic-head"><span>Topic</span><span>Category</span><span>Replies</span><span>Activity</span></div>
          {FORUM_TOPICS.map(([title, category, author, replies, activity]) => <article key={String(title)}><div><h2>{title}</h2><p>started by @{author}</p></div><StatusBadge>{category}</StatusBadge><b>{replies}</b><em>{activity}</em><ArrowRight size={15} /></article>)}
        </div>
        <p className="placeholder-note">:: forum interface preview // real topics and account backend will be connected later</p>
        <Link className="forum-login-link" href="/forum/login">Already registered? Log in to your session →</Link>
      </section>
    </>
  );
}
