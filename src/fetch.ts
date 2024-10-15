// File: src/fetch.ts

import { configure, ZipReader } from "https://deno.land/x/zipjs@v2.7.52/index.js";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

configure({
  terminateWorkerTimeout: 0,
});

export function getFileNames(): { archiveName: string; libraryName: string } {
  const { os, arch } = Deno.build;
  let archiveName = "";
  let libraryName = "";

  if (os === "linux") {
    if (arch === "x86_64") {
      archiveName = "libduckdb-linux-amd64.zip";
    } else if (arch === "aarch64") {
      archiveName = "libduckdb-linux-aarch64.zip";
    } else {
      throw new Error(`Unsupported architecture: ${arch} on Linux`);
    }
    libraryName = "libduckdb.so";
  } else if (os === "windows") {
    if (arch === "x86_64") {
      archiveName = "libduckdb-windows-amd64.zip";
    } else if (arch === "aarch64") {
      archiveName = "libduckdb-windows-arm64.zip";
    } else {
      throw new Error(`Unsupported architecture: ${arch} on Windows`);
    }
    libraryName = "libduckdb.dll";
  } else if (os === "darwin") {
    archiveName = "libduckdb-osx-universal.zip";
    libraryName = "libduckdb.dylib";
  } else {
    throw new Error(`Unsupported operating system: ${os}`);
  }

  return { archiveName, libraryName };
}

export const defaultDir = join(
  import.meta.dirname ?? "",
  "..",
  "lib",
  Deno.build.os,
  Deno.build.arch
)
export const defaultPath = join(defaultDir, getFileNames().libraryName)

export async function libraryExists(path?: string): Promise<boolean> {
  try {
    await Deno.stat(path ?? defaultPath);
    return true;
  } catch {
    return false;
  }
}

export async function downloadLatestRelease(fileName: string): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/duckdb/duckdb/releases/latest`,
    {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Deno DuckDB Downloader",
      },
    },
  );

  const data = await response.json();
  const asset = data.assets.find((asset: any) => asset.name === fileName);

  if (!asset) {
    throw new Error(`Asset ${fileName} not found in the latest release.`);
  }

  const downloadUrl = asset.browser_download_url;
  const res = await fetch(downloadUrl);
  await Deno.mkdir(defaultDir, { recursive: true })

  const zip = new ZipReader((await res.blob()).stream());
  for (const entry of await zip.getEntries()) {
    const outputFilePath = join(defaultDir, entry.filename);
    if (!entry.directory && entry.getData) {
      await entry.getData(
        await Deno.open(outputFilePath, { write: true, create: true }),
      );
    } else {
      await Deno.mkdir(outputFilePath, { recursive: true });
    }
  }
}

export async function getDuckDBLibraryPath(): Promise<string> {
  const { archiveName } = getFileNames();
  if (!(await libraryExists(defaultPath))) {
    console.debug(`${defaultPath} not found. Downloading ${archiveName}...`);
    await downloadLatestRelease(archiveName);
  }
  return defaultPath;
}
