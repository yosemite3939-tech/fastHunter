import Link from "next/link";
import { Download, Menu } from "lucide-react";
import { DOWNLOADS, NAV_LINKS } from "@/data/product";
import { BrandMark } from "@/components/ui";

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner wrap">
        <Link href="/" className="header-brand" aria-label="fast Hunter home">
          <BrandMark compact />
          <span className="header-product">{"// downloader // by Yosemite39 [ Fianxcandra ]"}</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div className="header-end">
          <span className="system-status"><span className="status-dot" />SYSTEM ONLINE</span>
          <a className="header-download" href={DOWNLOADS.installer} download>
            <Download size={14} />
            <span>Download</span>
          </a>
          <details className="mobile-menu">
            <summary aria-label="Open menu"><Menu size={18} /></summary>
            <nav aria-label="Mobile navigation">
              {NAV_LINKS.map((item) => (
                <Link key={item.href} href={item.href}>{item.label}</Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
