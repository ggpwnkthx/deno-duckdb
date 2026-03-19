import type { Plugin } from "@opencode-ai/plugin";
import { spawn } from "node:child_process";
import path from "node:path";

const DENO_EXTENSIONS = new Set([".ts", ".tsx"]);
const EDIT_TOOLS = new Set(["write", "edit", "patch", "multiedit"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function getNestedString(obj: unknown, ...keys: string[]): string | undefined {
  let cur: unknown = obj;
  for (const key of keys) {
    if (!isRecord(cur)) return undefined;
    cur = cur[key];
  }
  return asString(cur);
}

function getFilePath(input: unknown, output: unknown): string | undefined {
  return (
    getNestedString(output, "args", "filePath") ??
    getNestedString(output, "args", "path") ??
    getNestedString(output, "args", "newPath") ??
    getNestedString(input, "args", "filePath") ??
    getNestedString(input, "args", "path") ??
    getNestedString(input, "args", "newPath") ??
    getNestedString(input, "filePath") ??
    getNestedString(input, "path")
  );
}

function isDenoFile(filePath: string | undefined): filePath is string {
  return !!filePath && DENO_EXTENSIONS.has(path.extname(filePath));
}

async function runCommand(
  args: string[],
  cwd: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(args[0], args.slice(1), {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

function formatFailure(params: {
  cmd: string[];
  exitCode: number;
  toolName?: string;
  filePath?: string;
  stdout: string;
  stderr: string;
}): string {
  const header = [
    `❌ ${params.cmd.join(" ")} failed (exit code ${params.exitCode})`,
    params.toolName ? `Tool: ${params.toolName}` : undefined,
    params.filePath ? `File: ${params.filePath}` : undefined,
  ].filter(Boolean).join("\n");

  const stdoutBlock = params.stdout.trim()
    ? `\n\n--- stdout ---\n${params.stdout.trimEnd()}`
    : "";

  const stderrBlock = params.stderr.trim()
    ? `\n\n--- stderr ---\n${params.stderr.trimEnd()}`
    : "";

  return `${header}${stdoutBlock}${stderrBlock}`.trimEnd();
}

async function runOrBlock(
  cmd: string[],
  cwd: string,
  toolName?: string,
  filePath?: string,
) {
  const res = await runCommand(cmd, cwd);

  if (res.code !== 0) {
    throw new Error(
      formatFailure({
        cmd,
        exitCode: res.code,
        toolName,
        filePath,
        stdout: res.stdout,
        stderr: res.stderr,
      }),
    );
  }
}

export const DenoGuards: Plugin = async ({ directory }: { directory: string }) => {
  return {
    "tool.execute.after": async (input: any, _output: any) => {
      const toolName = asString(input?.tool);
      if (!toolName || !EDIT_TOOLS.has(toolName)) return;

      const filePath = getFilePath(input, _output);
      if (!isDenoFile(filePath)) return;

      await runOrBlock(
        ["deno", "lint", "--fix", filePath],
        directory,
        toolName,
        filePath,
      );

      await runOrBlock(
        ["deno", "check", filePath],
        directory,
        toolName,
        filePath,
      );
    },
  };
};

export default DenoGuards;