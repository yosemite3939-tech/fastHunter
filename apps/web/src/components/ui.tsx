import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cn("brand-mark", compact && "brand-mark-compact")} aria-label="fast Hunter">
      <span className="brand-fast">fast</span>
      <span className="brand-slash">\</span>
      <span className="brand-hunter">HUNTER</span>
      <span className="brand-dot">.</span>
    </span>
  );
}

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  download?: boolean;
  external?: boolean;
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", download, external, className }: ButtonLinkProps) {
  const props = {
    className: cn("button-link", `button-${variant}`, className),
    href,
    download: download || undefined,
    ...(external ? { target: "_blank", rel: "noreferrer" } : {}),
  };

  return external || download ? (
    <a {...props}>
      {children}
      {download ? <ArrowDownToLine size={14} /> : <ArrowUpRight size={14} />}
    </a>
  ) : (
    <Link {...props}>{children}</Link>
  );
}

export function SectionLabel({ children, index }: { children: ReactNode; index?: string }) {
  return (
    <div className="section-label">
      <span className="status-dot" />
      {index ? <span>{index}</span> : null}
      <span>{children}</span>
    </div>
  );
}

export function TerminalLine({ command, text, dim = false }: { command?: string; text: string; dim?: boolean }) {
  return (
    <p className={cn("terminal-line", dim && "terminal-dim")}>
      <span className="terminal-user">root@fasthunter:~$</span>
      {command ? <span className="terminal-command">{command}</span> : null}
      <span>{text}</span>
    </p>
  );
}

export function StatusBadge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "accent" }) {
  return <span className={cn("status-badge", tone === "accent" && "status-badge-accent")}>{children}</span>;
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="page-hero wrap">
      <SectionLabel index="00">{eyebrow}</SectionLabel>
      <h1>{title}</h1>
      <p>{description}</p>
      {children ? <div className="hero-actions">{children}</div> : null}
    </section>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <span>[_]</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
