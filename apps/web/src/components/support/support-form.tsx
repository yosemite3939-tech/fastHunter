"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { FileArchive, FileImage, Upload, X } from "lucide-react";

const tabs = ["Report Bug", "Request Feature", "Ask for Help", "Send Feedback"];

export function SupportForm() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [sent, setSent] = useState(false);

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles((current) => [...current, ...Array.from(event.target.files ?? [])]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <div className="support-shell">
      <div className="support-tabs" role="tablist" aria-label="Support request type">
        {tabs.map((tab) => (
          <button key={tab} className={tab === activeTab ? "active" : ""} onClick={() => setActiveTab(tab)} type="button" role="tab" aria-selected={tab === activeTab}>{tab}</button>
        ))}
      </div>
      <form className="support-form" onSubmit={submit}>
        <div className="form-grid">
          <label><span>Name</span><input required placeholder="your name" /></label>
          <label><span>Email</span><input required type="email" placeholder="you@example.com" /></label>
          <label><span>Report type</span><select defaultValue={activeTab}><option>{activeTab}</option><option>Installation</option><option>Download engine</option><option>Browser extension</option></select></label>
          <label><span>Software version</span><input defaultValue="v1.0.0" /></label>
          <label><span>Operating system</span><input placeholder="Windows 11 x64" /></label>
          <label><span>Priority</span><select defaultValue="normal"><option>low</option><option>normal</option><option>high</option></select></label>
        </div>
        <label><span>Title</span><input required placeholder="short, specific summary" /></label>
        <label><span>Description</span><textarea required rows={5} placeholder="what happened?" /></label>
        <div className="form-grid">
          <label><span>Steps to reproduce</span><textarea rows={5} placeholder={"001 open app\n002 paste URL\n003 run fetch"} /></label>
          <div className="stacked-textarea">
            <label><span>Expected result</span><textarea rows={2} /></label>
            <label><span>Actual result</span><textarea rows={2} /></label>
          </div>
        </div>
        <label className="file-panel">
          <Upload size={20} />
          <b>Drop evidence here or click to browse</b>
          <span>screenshots, images, logs, or zip files // local preview only</span>
          <input multiple type="file" accept=".png,.jpg,.jpeg,.webp,.txt,.log,.zip" onChange={onFiles} />
        </label>
        {files.length ? <div className="selected-files">{files.map((file, index) => <p key={`${file.name}-${file.size}`}><span>{file.type.startsWith("image") ? <FileImage size={14} /> : <FileArchive size={14} />}{file.name}</span><button type="button" onClick={() => setFiles(files.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${file.name}`}><X size={14} /></button></p>)}</div> : null}
        <button className="form-submit" type="submit">Transmit report</button>
        {sent ? <p className="form-success">:: placeholder accepted. Backend transmission will be connected in a future build.</p> : null}
      </form>
    </div>
  );
}
