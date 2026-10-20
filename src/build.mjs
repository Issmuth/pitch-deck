// Builds the deck: pitch-deck/index.html plus assets/ (styles, scripts, fonts, demo video).
//   node src/build.mjs                (src/mascots.json and src/map.json must exist)
// Product UI is styled by the console's own Tailwind theme, compiled with the console's @tailwindcss/node
// from the classes the slides use (the same pipeline as the demo video, brag-output/src/build.mjs).
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CONSOLE } from "../../brag-output/src/lib.mjs";
import { SLIDES } from "./slides.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "..");
const BRAG = path.resolve(OUT, "../brag-output");
const A = (...p) => path.join(OUT, "assets", ...p);
for (const d of ["fonts", "vendor"]) mkdirSync(A(d), { recursive: true });

const copy = (from, to) => {
  if (!existsSync(from)) return console.warn(`missing: ${from}`);
  if (existsSync(to)) chmodSync(to, 0o644); // installed fonts arrive read-only
  copyFileSync(from, to);
  chmodSync(to, 0o644);
};

// ---------- fonts, scripts, media ----------

for (const f of ["plus-jakarta-sans-latin-wght-normal.woff2", "plus-jakarta-sans-latin-ext-wght-normal.woff2", "jetbrains-mono-latin-wght-normal.woff2", "noto-sans-ethiopic-ethiopic-400-normal.woff2", "noto-sans-ethiopic-ethiopic-700-normal.woff2"])
  copy(path.join(BRAG, "composition/assets/fonts", f), A("fonts", f));
// Montserrat (body) and Nunito (the design system's fallback for Filson Soft), from @fontsource.
const TOOLS = process.env.DECKTOOLS;
if (TOOLS) {
  copy(path.join(TOOLS, "@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2"), A("fonts/montserrat-latin-wght-normal.woff2"));
  copy(path.join(TOOLS, "@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2"), A("fonts/nunito-latin-wght-normal.woff2"));
}
// Filson Soft is licensed: it is taken from this machine's installed fonts for the local copy only.
const USER_FONTS = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Microsoft/Windows/Fonts") : "";
for (const f of ["Filson-Soft-Medium.ttf", "Filson-Soft-Light.ttf"]) if (USER_FONTS && existsSync(path.join(USER_FONTS, f))) copy(path.join(USER_FONTS, f), A("fonts", f));

copy(path.join(BRAG, "composition/assets/vendor/gsap-3.14.2.min.js"), A("vendor/gsap-3.14.2.min.js"));
copy(path.join(BRAG, "brag.mp4"), A("demo.mp4"));
copy(path.join(BRAG, "brag.jpg"), A("poster.jpg"));
copy(path.resolve(OUT, "../assets/favicon.svg"), A("favicon.svg"));
copy(path.join(here, "runtime/deck.js"), A("deck.js"));
copy(path.join(here, "runtime/anim.js"), A("anim.js"));
copy(path.join(here, "runtime/deck.css"), A("deck.css"));

// ---------- page ----------

// "M-PESA" never breaks at its hyphen (in text, not in attributes or SVG).
// SVG is left alone: an HTML span inside SVG text would break the drawing (SVG text doesn't wrap anyway).
const keepWhole = (html) =>
  html
    .split(/(<svg[\s\S]*?<\/svg>)/)
    .map((part) => (part.startsWith("<svg") ? part : part.replace(/>([^<]*)</g, (m, t) => `>${t.replace(/M-PESA/g, '<span class="nw">M-PESA</span>')}<`)))
    .join("");
const slidesHtml = SLIDES.map((s) => `<section class="slide${s.light ? " light" : ""}" id="s-${s.id}" aria-label="${s.title}">${keepWhole(s.html)}\n</section>`).join("\n");
const meta = SLIDES.map(({ id, title, bg, secs, notes }) => ({ id, title, bg, secs, notes }));

const head = `<title>Revet pitch deck</title>
    <link rel="icon" href="assets/favicon.svg" />
    <link rel="stylesheet" href="assets/app.css" />
    <link rel="stylesheet" href="assets/deck.css" />`;
const body = `    <div id="frame">
      <div id="stage">
        <div id="bg"></div>
${slidesHtml}
        <div id="morph"></div>
      </div>
    </div>
    <aside id="presenter">
      <div>
        <div class="pv-row"><span id="p-count"></span><span id="p-target"></span></div>
        <div id="p-title"></div>
        <div class="pv-row" style="margin-top:8px"><span></span><span id="p-next"></span></div>
      </div>
      <div id="p-timer" title="Click to start or reset">
        <div class="pv-row"><span id="p-elapsed">0:00</span><span id="p-slide">0:00</span></div>
        <div id="p-budget" style="margin-top:8px"></div>
      </div>
      <div id="p-notes"></div>
    </aside>
    <div id="p-help">Middle-click or →: next slide · left-click or ←: back · a number + Enter: jump · B: black screen · the audience window follows this one</div>
    <div id="hint" class="show"><b>F</b> full screen · <b>P</b> presenter view · <b>middle-click</b> or <b>→</b> next · <b>left-click</b> or <b>←</b> back</div>
    <script src="assets/vendor/gsap-3.14.2.min.js"></script>
    <script>window.DECK = { slides: ${JSON.stringify(meta).replace(/</g, "\\u003c")} };</script>
    <script src="assets/anim.js"></script>
    <script src="assets/deck.js"></script>
    <script>setTimeout(() => document.getElementById("hint").classList.remove("show"), 5000);</script>`;
const index = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${head}
  </head>
  <body>
${body}
  </body>
</html>
`;
writeFileSync(path.join(OUT, "index.html"), index);
// The shareable copy (an Artifact page): the host adds the document skeleton, so it is head + body only.
mkdirSync(path.join(OUT, "share"), { recursive: true });
writeFileSync(path.join(OUT, "share/index.html"), `${head}
${body}
`);

// ---------- Tailwind: the console theme, only the classes the slides use ----------

const { compile } = await import(pathToFileURL(path.join(CONSOLE, "node_modules/@tailwindcss/node/dist/index.mjs")).href);
const candidates = new Set();
for (const m of index.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) candidates.add(c);
const input = readFileSync(path.join(BRAG, "src/styles.css"), "utf8");
const compiler = await compile(input, { base: CONSOLE, onDependency() {} });
const css = compiler
  .build([...candidates])
  .replace(/var\(--default-font-family,[^;]*\)/, "var(--font-sans)")
  .replace(/var\(--default-mono-font-family,[^;]*\)/, "var(--font-mono)");
writeFileSync(A("app.css"), css);

console.log(`built ${SLIDES.length} slides, ${(index.length / 1024).toFixed(0)} KB html, ${candidates.size} classes`);
