import Link from "next/link";
import { BrandMark } from "@/components/ui";
import { NAV_LINKS, PRODUCT } from "@/data/product";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-intro">
          <BrandMark />
          <p>A minimalist download manager built for speed, clarity, and control.</p>
          <span className="footer-version">{PRODUCT.version} {"// stable // windows_x64"}</span>
        </div>
        <div>
          <p className="footer-title">Navigate</p>
          <div className="footer-links">
            {NAV_LINKS.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          </div>
        </div>
        <div>
          <p className="footer-title">Elsewhere</p>
          <div className="footer-links">
            <a href="https://github.com/Yosemite39/fastHunter" target="_blank" rel="noreferrer">GitHub</a>
            <Link href="/support">Support</Link>
          </div>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 fast\Hunter.</span>
        <span>NO ADS. NO BUNDLED NONSENSE.</span>
      </div>
    </footer>
  );
}
