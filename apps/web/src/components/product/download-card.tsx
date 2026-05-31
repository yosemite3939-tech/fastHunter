import { ArrowDownToLine, PackageCheck, Puzzle } from "lucide-react";
import { DOWNLOADS, PRODUCT } from "@/data/product";
import { StatusBadge } from "@/components/ui";

export function DownloadCard() {
  const rows = [
    ["version", PRODUCT.version],
    ["platform", PRODUCT.platform],
    ["architecture", PRODUCT.architecture],
    ["file_type", ".exe"],
    ["file_size", PRODUCT.installerSize],
    ["license", PRODUCT.license],
  ];

  return (
    <article className="main-download-card">
      <div className="download-card-head">
        <div>
          <p>{"// official_release"}</p>
          <h2>fast\Hunter Download Manager</h2>
        </div>
        <StatusBadge tone="accent">LATEST</StatusBadge>
      </div>
      <div className="download-details">
        {rows.map(([label, value]) => <p key={label}><span>{label}</span><b>{value}</b></p>)}
      </div>
      <div className="download-actions">
        <a className="download-action-primary" href={DOWNLOADS.installer} download>
          <ArrowDownToLine size={18} />
          <span><b>Download .EXE</b><small>Windows installer // official build</small></span>
        </a>
        <a className="download-action-secondary" href={DOWNLOADS.extension} download>
          <Puzzle size={18} />
          <span><b>Chrome Extension</b><small>ZIP // manual load</small></span>
        </a>
        <span className="download-action-disabled">
          <PackageCheck size={18} />
          <span><b>Portable ZIP</b><small>planned for next build</small></span>
        </span>
      </div>
    </article>
  );
}
