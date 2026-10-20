// Projects Africa from Natural Earth (world-atlas countries-50m) to SVG paths for the expansion slide.
//   NODE_PATH-free: pass the folder holding d3-geo, topojson-client and world-atlas as DECKTOOLS.
//   DECKTOOLS=<dir>/node_modules node src/map.mjs   → src/map.json
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const NM = process.env.DECKTOOLS;
const imp = (p) => import(pathToFileURL(path.join(NM, p)).href);
const { geoMercator, geoPath, geoCentroid } = await imp("d3-geo/src/index.js");
const { feature } = await imp("topojson-client/src/index.js");

const topo = JSON.parse(readFileSync(path.join(NM, "world-atlas/countries-50m.json"), "utf8"));
const all = feature(topo, topo.objects.countries).features;

// ISO 3166-1 numeric codes of the African mainland and Madagascar.
const AFRICA = new Set([12, 24, 72, 108, 120, 140, 148, 174, 178, 180, 204, 226, 231, 232, 262, 266, 270, 288, 324, 384, 404, 426, 430, 434, 450, 454, 466, 478, 504, 508, 516, 562, 566, 624, 646, 686, 694, 706, 710, 716, 728, 729, 732, 748, 768, 788, 800, 818, 834, 854, 894]);
// M-PESA markets (Safaricom: Ethiopia, Kenya; Vodacom: Tanzania, DRC, Mozambique, Lesotho).
const MPESA = { 231: "Ethiopia", 404: "Kenya", 834: "Tanzania", 180: "DR Congo", 508: "Mozambique", 426: "Lesotho" };

const africa = all.filter((f) => AFRICA.has(Number(f.id)));
const W = 900, H = 960;
const proj = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], { type: "FeatureCollection", features: africa });
const gp = geoPath(proj);
const round = (d) => d.replace(/(\d+\.\d)\d+/g, "$1");

const out = {
  w: W,
  h: H,
  countries: africa.map((f) => ({ id: Number(f.id), d: round(gp(f)) })),
  markets: Object.entries(MPESA).map(([id, name]) => {
    const f = africa.find((x) => Number(x.id) === Number(id));
    const [x, y] = proj(geoCentroid(f));
    return { id: Number(id), name, x: Math.round(x), y: Math.round(y) };
  }),
};
writeFileSync(path.join(here, "map.json"), JSON.stringify(out));
console.log(`map.json: ${out.countries.length} countries, markets ${out.markets.map((m) => `${m.name}@${m.x},${m.y}`).join(" ")}`);
