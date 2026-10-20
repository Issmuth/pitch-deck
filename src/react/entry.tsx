// Renders the console's own mascot (components/brand/mascot.tsx) in the poses and moods the deck uses.
// Bundled with esbuild against revet-console (alias "@" → revet-console) by render.mjs.
import { renderToStaticMarkup } from "react-dom/server";
import { MascotFigure, type MascotMood, type MascotPose } from "@/components/brand/mascot";
import { RevetMark } from "@/components/brand/logo";

type Variant = { pose: MascotPose; mood?: MascotMood; look?: number; flip?: boolean };

const VARIANTS: Record<string, Variant> = {
  wave: { pose: "wave" },
  cheer: { pose: "cheer", mood: "joy" },
  point: { pose: "point", look: 1 },
  pointLeft: { pose: "point", look: 1, flip: true },
  raise: { pose: "raise", look: 1 },
  rest: { pose: "rest" },
  surprised: { pose: "rest", mood: "surprised", look: 1 },
  sad: { pose: "rest", mood: "sad" },
  shrug: { pose: "shrug", mood: "confused" },
  joy: { pose: "rest", mood: "joy" },
};

const out: Record<string, string> = {};
for (const [name, v] of Object.entries(VARIANTS)) {
  out[name] = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -84 92 92">
      <ellipse cx="0" cy="1" rx="28" ry="3.2" fill="#000" opacity="0.35" />
      <MascotFigure pose={v.pose} mood={v.mood} look={v.look ?? 0} flip={v.flip} blink />
    </svg>,
  );
}
out.mark = renderToStaticMarkup(<RevetMark height={64} />);

process.stdout.write(JSON.stringify(out));
