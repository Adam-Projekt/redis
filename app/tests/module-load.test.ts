import { describe, expect, test } from "bun:test";

const rootDir = new URL("../../", import.meta.url).pathname;

function runImport(modulePath: string) {
  return Bun.spawnSync({
    cmd: ["bun", "-e", `import "${modulePath}"; console.log("ok");`],
    cwd: rootDir,
    stderr: "pipe",
    stdout: "pipe",
  });
}

async function exitsCleanlyWithin(cmd: string[], timeoutMs: number) {
  const proc = Bun.spawn({
    cmd,
    cwd: rootDir,
    stderr: "pipe",
    stdout: "pipe",
  });

  const timeout = new Promise<"timeout">((resolve) =>
    setTimeout(() => resolve("timeout"), timeoutMs),
  );
  const outcome = await Promise.race([proc.exited, timeout]);

  if (outcome === "timeout") {
    proc.kill();
    return { exited: false, exitCode: null as number | null };
  }

  return { exited: true, exitCode: outcome as number };
}

describe("module loading", () => {
  test("main module loads without circular import failures", () => {
    const result = runImport("./app/main.ts");

    expect(result.exitCode).toBe(0);
  });

  test("command handler module loads without circular import failures", () => {
    const result = runImport("./app/command-handler.ts");

    expect(result.exitCode).toBe(0);
  });

  test("command modules can be imported directly in isolation", () => {
    const result = runImport("./app/commands/basic/set.ts");

    expect(result.exitCode).toBe(0);
  });

  test("server process stays alive after startup", async () => {
    const result = await exitsCleanlyWithin(
      ["bun", "run", "app/main.ts", "--port", "6391"],
      100,
    );

    expect(result.exited).toBe(false);
    expect(result.exitCode).toBeNull();
  });
});
