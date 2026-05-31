import Image from "next/image";

export function ScreenshotFrame({ src, title, caption, priority = false }: { src: string; title: string; caption: string; priority?: boolean }) {
  return (
    <figure className="screenshot-frame">
      <div className="screenshot-bar">
        <span><i /><i /><i /></span>
        <b>{title}</b>
        <em>[view]</em>
      </div>
      <Image src={src} alt={`${title} screenshot of the fast Hunter desktop application`} width={1280} height={800} priority={priority} />
      <figcaption><span>{title}</span>{caption}</figcaption>
    </figure>
  );
}
