import { spawn } from "node:child_process";

function send(message: unknown): void {
  const body = Buffer.from(JSON.stringify(message));
  const header = Buffer.alloc(4);
  header.writeUInt32LE(body.length, 0);
  process.stdout.write(Buffer.concat([header, body]));
}

export function runNativeMessagingHost(): void {
  let buffered = Buffer.alloc(0);
  process.stdin.on("data", (chunk: Buffer) => {
    buffered = Buffer.concat([buffered, chunk]);
    while (buffered.length >= 4) {
      const size = buffered.readUInt32LE(0);
      if (buffered.length < size + 4) return;
      const raw = buffered.subarray(4, size + 4).toString("utf8");
      buffered = buffered.subarray(size + 4);
      let payload: { type?: string; url?: string };
      try {
        payload = JSON.parse(raw);
      } catch {
        send({ ok: false, error: "Malformed native messaging payload." });
        continue;
      }
      if (payload.type === "ping") {
        send({ ok: true, type: "pong", app: "FastHunter Downloader" });
      } else if (payload.type === "enqueue" && payload.url) {
        spawn(process.execPath, [`--add-url=${encodeURIComponent(payload.url)}`], {
          detached: true,
          stdio: "ignore",
        }).unref();
        send({ ok: true, type: "queued", url: payload.url });
      } else {
        send({ ok: false, error: "Unsupported native messaging request." });
      }
    }
  });
}
