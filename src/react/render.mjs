// Bundles entry.tsx against the revet-console source and writes ../mascots.json.
//   ESBUILD=<path to esbuild/lib/main.js> node src/react/render.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const { build } = await import(process.env.ESBUILD ? pathToFileURL(process.env.ESBUILD).href : "esbuild");

const here = path.dirname(fileURLToPath(import.meta.url));
const consoleDir = path.resolve(here, "../../../repos/revet-console");
const outfile = path.join(here, ".bundle.cjs");

await build({
  entryPoints: [path.join(here, "entry.tsx")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  jsx: "automatic",
  outfile,
  alias: { "@": consoleDir },
  nodePaths: [path.join(consoleDir, "node_modules")],
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});

const json = execFileSync(process.execPath, [outfile], { maxBuffer: 16 * 1024 * 1024 });
writeFileSync(path.join(here, "..", "mascots.json"), json);
console.log(`mascots.json: ${(json.length / 1024).toFixed(0)} KB`);
