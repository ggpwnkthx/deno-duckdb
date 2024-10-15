// File: src/fetch.ts
import { ZipReader } from "https://deno.land/x/zipjs@v2.7.52/index.js";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

function getOSAndArch(): { os: string; arch: string } {
  const os = Deno.build.os;
  const arch = Deno.build.arch;
  return { os, arch };
}

function getFileNames(): { archiveName: string; libraryName: string } {
  const { os, arch } = getOSAndArch();
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
    } else if (arch === "arm64") {
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

export async function libraryExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
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
  const outputDirectoryPath = join(
    import.meta.dirname ?? Deno.cwd(),
    "lib",
  )
  await Deno.mkdir(outputDirectoryPath, { recursive: true })

  const zip = new ZipReader((await res.blob()).stream());
  for (const entry of await zip.getEntries()) {
    const outputFilePath = join(
      outputDirectoryPath,
      entry.filename,
    );
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
  const { archiveName, libraryName } = getFileNames();
  const libPath = join(import.meta.dirname ?? Deno.cwd(), "lib", libraryName);

  if (!(await libraryExists(libPath))) {
    console.debug(`${libPath} not found. Downloading ${archiveName}...`);
    await downloadLatestRelease(archiveName);
  }

  return libPath;
}
