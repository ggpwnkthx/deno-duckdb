// File: main_test.ts

import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import {
  libraryExists,
  downloadLatestRelease,
  defaultDir,
} from "./src/fetch.ts";
import { getFileNames } from "./src/fetch.ts";

// Remove the lib directory before running the tests
try {
  await Deno.remove(defaultDir, { recursive: true });
} catch (error) {
  if (!(error instanceof Deno.errors.NotFound)) {
    throw error;
  }
}

Deno.test("libraryExists returns false for non-existing file", async () => {
  const exists = await libraryExists();
  assertEquals(exists, false);
});

Deno.test({
  name: "downloadLatestRelease downloads and extracts the correct files",
  permissions: { net: true, write: true, read: true },
  async fn() {
    const { archiveName } = getFileNames();
    await downloadLatestRelease(archiveName);
    const libStat = await Deno.stat(defaultDir);
    assert(libStat.isDirectory, "lib directory should exist after download");
  },
});

Deno.test("libraryExists returns true for existing file", async () => {
  const exists = await libraryExists();
  assertEquals(exists, true);
});