// Brings the private `@bombappetit/cloud` package into `.cloud/` before dev and build.
//
//   BOMBAPPETIT_CLOUD_PATH   local checkout of the private repo (development)
//   BOMBAPPETIT_CLOUD_TOKEN  GitHub token with read access to it (Vercel)
//
// With neither set, `.cloud/` holds a one-line shim that re-exports lib/cloud-stub.tsx,
// so `@bombappetit/cloud` always resolves to `.cloud/src/index.ts`.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(appDir, ".cloud");
const publicTarget = path.join(appDir, "public", "cloud");
const CLOUD_REPO = "github.com/masaok/bomb-appetit-cloud.git";

function fromEnvFile(name) {
  const file = path.join(appDir, ".env.local");
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") || undefined;
}

const setting = (name) => process.env[name] || fromEnvFile(name);

function clear() {
  rmSync(target, { recursive: true, force: true });
  rmSync(publicTarget, { recursive: true, force: true });
  mkdirSync(path.join(target, "src"), { recursive: true });
}

// next.config.ts reads this to refuse a production build on the stub.
const mark = (source) => writeFileSync(path.join(target, "source.json"), JSON.stringify({ source }) + "\n");

function install(sourceDir, source) {
  if (!existsSync(path.join(sourceDir, "src", "index.ts"))) {
    throw new Error(`${sourceDir} does not look like the cloud package (no src/index.ts)`);
  }
  clear();
  cpSync(path.join(sourceDir, "src"), path.join(target, "src"), {
    recursive: true,
    filter: (file) => !/\.test\.tsx?$/.test(file),
  });
  if (existsSync(path.join(sourceDir, "assets"))) {
    cpSync(path.join(sourceDir, "assets"), publicTarget, { recursive: true });
  }
  mark(source);
}

const localPath = setting("BOMBAPPETIT_CLOUD_PATH");
const token = setting("BOMBAPPETIT_CLOUD_TOKEN");

if (localPath) {
  install(path.resolve(appDir, localPath), "path");
  console.log(`cloud: synced from ${localPath}`);
} else if (token) {
  const checkout = mkdtempSync(path.join(tmpdir(), "bombappetit-cloud-"));
  try {
    execFileSync(
      "git",
      ["clone", "--depth", "1", `https://x-access-token:${token}@${CLOUD_REPO}`, checkout],
      { stdio: "ignore" },
    );
    install(checkout, "token");
    console.log("cloud: synced from the private repository");
  } catch {
    // The underlying error would echo the clone URL, and the URL holds the token.
    throw new Error("cloud: could not fetch the private repository with BOMBAPPETIT_CLOUD_TOKEN");
  } finally {
    rmSync(checkout, { recursive: true, force: true });
  }
} else {
  clear();
  writeFileSync(path.join(target, "src", "index.ts"), 'export { default } from "../../lib/cloud-stub";\n');
  mark("stub");
  console.log("cloud: no private package configured, using the public stub");
}
