import { BrandMark } from "@/components/ui";

const sidebar = ["./status", "./active", "./queue", "./done"];

export function ProductPreview() {
  return (
    <div className="product-preview">
      <div className="preview-topbar">
        <span className="preview-controls"><i /><i /><i /></span>
        <span>root@fasthunter:~/dashboard$</span>
        <span>[online]</span>
      </div>
      <div className="preview-grid">
        <aside className="preview-sidebar">
          <span># commands</span>
          {sidebar.map((item, index) => <b className={index === 0 ? "selected" : ""} key={item}>{item}</b>)}
        </aside>
        <div className="preview-main">
          <div className="preview-summary">
            <BrandMark />
            <div className="preview-metrics">
              <span>speed <b>18.4 MB/s</b></span>
              <span>active <b>2</b></span>
              <span>queued <b>1</b></span>
              <span>done <b>24</b></span>
            </div>
          </div>
          <div className="preview-throughput">
            <span># net.throughput --live</span>
            <div className="preview-bars">
              {[30, 38, 45, 41, 58, 67, 64, 72, 88, 81, 93, 78, 91, 86, 96, 84].map((height, index) => (
                <i key={`${height}-${index}`} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <div className="preview-queue">
            <span>$ ls ~/active // 2</span>
            <QueueLine label="archive-x64.zip" percent="74%" width="74%" />
            <QueueLine label="studio-assets.iso" percent="46%" width="46%" />
          </div>
        </div>
      </div>
      <div className="preview-command"><b>root@fasthunter:~$</b><span>fetch</span><i /></div>
    </div>
  );
}

function QueueLine({ label, percent, width }: { label: string; percent: string; width: string }) {
  return (
    <div className="queue-line">
      <b>{label}</b>
      <span className="queue-track"><i style={{ width }} /></span>
      <small>{percent}</small>
      <em>::downloading</em>
    </div>
  );
}
