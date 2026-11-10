#!/usr/bin/env node
/**
 * Room Pay one-shot setup (works on Windows, macOS and Linux).
 *
 *   npm run setup                 interactive
 *   npm run setup -- --yes        no questions: local MongoDB defaults
 *   npm run setup -- --uri="mongodb+srv://..."   use an Atlas URI
 *   npm run setup -- --test       also run the test-suites afterwards
 *   npm run setup -- --force      overwrite existing .env files
 *
 * It: checks Node, installs all dependencies, and creates backend/.env and
 * frontend/.env from the .env.example templates.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};

const isTTY = process.stdin.isTTY && !flag("yes");
const c = (code, text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const step = (msg) => console.log(`\n${c(36, "▶")} ${c(1, msg)}`);
const ok = (msg) => console.log(`  ${c(32, "✓")} ${msg}`);
const warn = (msg) => console.log(`  ${c(33, "!")} ${msg}`);
const fail = (msg) => {
  console.error(`\n${c(31, "✗")} ${msg}`);
  process.exit(1);
};

// 1. Node version ------------------------------------------------------------
step("Checking Node.js");
const major = Number(process.versions.node.split(".")[0]);
if (major < 20) fail(`Node 20 or newer is required (you have ${process.versions.node}). Get it from https://nodejs.org`);
ok(`Node ${process.versions.node}`);

// 2. Install dependencies -------------------------------------------------------
function npmInstall(dir, label) {
  step(`Installing ${label} dependencies`);
  const result = spawnSync("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: join(ROOT, dir),
    stdio: "inherit",
    shell: process.platform === "win32", // npm is npm.cmd on Windows
  });
  if (result.status !== 0) fail(`npm install failed in ${dir || "."}`);
  ok(`${label} ready`);
}
npmInstall("", "root (dev tooling)");
npmInstall("backend", "backend");
npmInstall("frontend", "frontend");

// 3. Environment files ------------------------------------------------------
step("Creating environment files");

function ensureEnv(dir) {
  const target = join(ROOT, dir, ".env");
  const example = join(ROOT, dir, ".env.example");
  if (existsSync(target) && !flag("force")) {
    warn(`${dir}/.env already exists - left untouched (use --force to overwrite)`);
    return false;
  }
  copyFileSync(example, target);
  ok(`${dir}/.env created`);
  return true;
}

const backendCreated = ensureEnv("backend");
ensureEnv("frontend");

if (backendCreated) {
  let uri = option("uri");
  if (!uri && isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    console.log("\n  Which MongoDB do you want to use?");
    console.log("   - Press Enter for a local MongoDB (run `npm run db:up` if you have Docker)");
    console.log("   - Or paste a MongoDB Atlas connection string (mongodb+srv://...)");
    uri = (await rl.question("  MONGODB_URI: ")).trim();
    rl.close();
  }
  if (uri) {
    const envPath = join(ROOT, "backend", ".env");
    const next = readFileSync(envPath, "utf8").replace(/^MONGODB_URI=.*$/m, () => `MONGODB_URI=${uri}`);
    writeFileSync(envPath, next);
    ok("backend/.env updated with your MongoDB URI");
  } else {
    ok("Using local MongoDB: mongodb://127.0.0.1:27017/roompay");
  }
}

// 4. Optional tests ---------------------------------------------------------
if (flag("test")) {
  step("Running unit tests (no database needed)");
  const result = spawnSync("npm", ["run", "test:unit"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) fail("Unit tests failed");
  ok("Unit tests passed");
}

// 5. Next steps -------------------------------------------------------------
console.log(`
${c(32, "Setup complete!")}

  Start everything:      ${c(1, "npm run dev")}
     API:                http://localhost:5000/api/health
     App:                http://localhost:5173

  No MongoDB yet?        ${c(1, "npm run db:up")}   (Docker)  - or use a free Atlas cluster
  Run all tests:         ${c(1, "npm test")}        (downloads an in-memory MongoDB on first run)
  Quick tests only:      ${c(1, "npm run test:unit")}
  Production build:      ${c(1, "npm run build")}

  Deploying? See README.md -> "Deploy".
`);
