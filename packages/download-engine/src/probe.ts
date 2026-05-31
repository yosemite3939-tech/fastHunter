import { detectFileName, readTotalBytes, supportsByteRanges } from "./utils.js";

export interface RemoteMetadata {
  fileName: string;
  totalBytes: number;
  mimeType: string;
  supportsRanges: boolean;
}

export async function probeRemote(url: string, signal?: AbortSignal): Promise<RemoteMetadata> {
  let response = await fetch(url, { method: "HEAD", headers: { "Accept-Encoding": "identity" }, redirect: "follow", signal });
  if (!response.ok || (!response.headers.get("content-length") && response.status !== 206)) {
    response = await fetch(url, {
      headers: { Range: "bytes=0-0", "Accept-Encoding": "identity" },
      redirect: "follow",
      signal,
    });
  }
  if (!response.ok) throw new Error(`Server returned HTTP ${response.status} while checking the download.`);

  const metadata = {
    fileName: detectFileName(response.url || url, response.headers.get("content-disposition")),
    totalBytes: readTotalBytes(response.headers),
    mimeType: response.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream",
    supportsRanges: supportsByteRanges(response.headers, response.status),
  };
  await response.body?.cancel();
  return metadata;
}
