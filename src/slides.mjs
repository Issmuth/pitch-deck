// The deck's slides: markup, speaker notes and timing. Animations live in runtime/anim.js, keyed by id.
// Product UI is the same recreation the demo video uses (brag-output/src: console tokens, SDK screens,
// the console's demo data); the mascot is the console's own component (src/mascots.json).
//
// Look: one forest-green ground, a small centred label and footer on every slide, hairline outline
// circles instead of filled cards, die-cut stickers, and one signature element: the M-PESA thread, a thick
// outlined green line the frog holds, which tangles in the problem, loops the "6" and carries the money.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { icon, wordmark, esc, vm, etb, maskPhone } from "../../brag-output/src/lib.mjs";
import { androidFrame, iphoneFrame, bookScreen, paywallScreen, statusBar, K, S as Str, J, Pn, T as AppT } from "../../brag-output/src/app.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const MASCOT = JSON.parse(readFileSync(path.join(here, "mascots.json"), "utf8"));
const MAP = JSON.parse(readFileSync(path.join(here, "map.json"), "utf8"));

// ---------- pieces ----------

/** The small centred section label at the top of a slide. */
const label = (t) => `<p class="chrome-label in">${t}</p>`;
const FOOT = `<p class="chrome-foot" data-morph="foot" data-morph-kind="same">Revet · Team Blitz</p>`;
const mascot = (name, { cls = "", style = "", attrs = "" } = {}) => `<div class="mascot ${cls}" style="${style}" ${attrs}>${MASCOT[name]}</div>`;
/** Several moods stacked in one spot, for the timeline to crossfade between. */
const moods = (names, { style = "", attrs = "" } = {}) =>
  `<div class="mascot" style="${style}" ${attrs}>${names.map((n, i) => `<div class="m-${n}" style="${i ? "position:absolute;inset:0;opacity:0" : ""}">${MASCOT[n]}</div>`).join("")}</div>`;
const ic = (name, size = 32, sw = 2) => icon(name, "", { sw, style: `width:${size}px;height:${size}px` });
/** A die-cut sticker: a coloured tile with a white border and a dark keyline, a little rotated. */
const sticker = (name, { bg = "#8be788", fg = "#162215", rot = -6, size = 92, cls = "" } = {}) =>
  `<span class="sticker ${cls}" style="width:${size}px;height:${size}px;background:${bg};color:${fg};rotate:${rot}deg">${ic(name, Math.round(size * 0.44), 2.4)}</span>`;
/** The M-PESA thread: each segment is drawn twice, a dark keyline under the green, so it reads like a cut-out. */
const thread = (segments, cls = "") =>
  `<svg class="thread ${cls}" viewBox="0 0 1920 1080" aria-hidden="true">${Object.entries(segments)
    .map(([k, d]) => `<g class="th-${k}"><path class="th-o" d="${d}"/><path class="th-g" d="${d}"/></g>`)
    .join("")}</svg>`;

// Where the mascot's right hand is (mascot.tsx ARMS, local units), so the thread can end in it.
const HANDS = { raise: [25, -58], cheer: [26, -53] };
const handAt = (pose, left, top, width) => {
  const s = width / 92;
  const [hx, hy] = HANDS[pose];
  return [Math.round(left + (hx + 46) * s), Math.round(top + (hy + 84) * s)];
};

const notes = (...ps) => ps.map((p) => (p.startsWith("Q&A") ? `<p class="qa">${p}</p>` : `<p>${p.replace(/\[(auto[^\]]*)\]/g, '<span class="cue">[$1]</span>')}</p>`)).join("");

// ---------- 1. title ----------

const T1 = { left: 1236, top: 250, width: 600 };
const [t1x, t1y] = handAt("raise", T1.left, T1.top, T1.width);
const title = {
  id: "title",
  title: "Revet",
  bg: "#162215",
  secs: 6,
  notes: notes("Hi, we're Team Blitz, and this is Revet."),
  html: `
    <div class="glow" style="left:1060px;top:100px;width:860px;height:860px;background:radial-gradient(closest-side,rgba(139,231,136,.14),rgba(139,231,136,0))"></div>
    ${thread({ a: `M -40 992 C 380 1036 800 952 1160 980 C 1480 1004 1852 996 1858 772 C 1864 572 1784 ${t1y + 14} ${t1x + 6} ${t1y + 4}` })}
    <div class="abs t-mark" style="left:128px;top:112px">${wordmark(92, "t1")}</div>
    <h1 class="display abs" style="left:128px;top:300px"><span class="ln t-l">Ship the app.</span><span class="ln t-l green">We'll handle</span><span class="ln t-l green">the revenue.</span></h1>
    <p class="lead abs t-lead" style="left:128px;top:728px;width:900px;font-size:32px">The billing platform for Ethiopian apps. Subscriptions and in-app purchases, paid with M-PESA.</p>
    <div class="abs t-foot" style="left:128px;top:904px;display:flex;align-items:center;gap:28px;font:600 28px/1 var(--f-body)"><span class="green">M-PESA Hackathon 2026</span><span style="width:56px;height:1.5px;background:var(--line-strong)"></span><span style="font-weight:500">Team Blitz</span></div>
    ${mascot("raise", { style: `left:${T1.left}px;top:${T1.top}px;width:${T1.width}px`, attrs: 'data-morph="mascot"' })}
    <div class="toast t-toast" style="left:1040px;top:744px"><span class="tick">${ic("check", 30, 3)}</span><div><b>Payment received</b><span>Pro Monthly · 99 ETB by M-PESA</span></div></div>
    <div class="toast t-toast" style="left:1270px;top:150px"><span class="tick soft">${ic("send", 28)}</span><div><b>Weekly payout sent</b><span>B2C to the developer's M-PESA</span></div></div>`,
};

// ---------- 2. hook ----------

const NOTIFS = [
  ["Hana", "Sent 99 birr. Here's the screenshot.", true],
  ["Dawit", "I sent the transfer screenshot yesterday. Can you unlock my account?"],
  ["Meron", "Paid again for next month. Please check."],
  ["Yonas", "Still locked?"],
  ["Selam", "Is there a way to pay on iPhone?"],
];
const notif = ([who, msg, shot]) => `<div class="h-n" style="display:flex;gap:12px;padding:14px 14px 14px 12px;border-radius:22px;background:rgba(255,255,255,.96);box-shadow:0 10px 30px -12px rgba(0,0,0,.45);font-family:var(--font-sans)">
    <span style="display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#8b3788;color:#fff;flex-shrink:0">${ic("message-circle", 20, 2.4)}</span>
    <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;font-size:12px;color:#6b6f76"><span>Chats · ${who}</span><span>now</span></div>
      <div style="margin-top:3px;font-size:15px;line-height:20px;color:#15161a">${esc(msg)}</div>
      ${shot ? `<div style="margin-top:8px;width:120px;height:74px;border-radius:10px;background:linear-gradient(160deg,#e9f6e8,#cfe8cd);border:1px solid #c3dcc1;display:flex;flex-direction:column;justify-content:center;padding:0 10px;gap:5px"><span style="height:6px;width:46px;border-radius:3px;background:#2d8a3e"></span><span style="height:5px;width:86px;border-radius:3px;background:#9fbf9d"></span><span style="height:5px;width:64px;border-radius:3px;background:#9fbf9d"></span></div>` : ""}
    </div></div>`;

const iosNoPay = () => `<div style="position:absolute;inset:0;background:${AppT.paper};font-family:var(--font-sans)">
    ${statusBar({ color: AppT.ink, ios: true })}
    <div style="position:absolute;inset:0;transform:translateY(14px);clip-path:inset(40px 0 0 0);opacity:.55">${bookScreen("h-ios-book")}</div>
    <div style="position:absolute;inset:0;background:rgba(0,0,0,.28)"></div>
    <div class="h-alert" style="position:absolute;left:50%;top:50%;width:290px;margin:-110px 0 0 -145px;border-radius:18px;background:rgba(250,250,250,.97);text-align:center;overflow:hidden">
      <div style="padding:22px 18px 18px"><div style="font-size:17px;font-weight:700;color:#111">Can't pay here</div><div style="margin-top:6px;font-size:14px;line-height:19px;color:#222">Apple in-app purchase isn't available in Ethiopia.</div></div>
      <div style="border-top:1px solid #d9d9de;padding:12px 0;font-size:17px;font-weight:600;color:#0a7aff">OK</div>
    </div>
  </div>`;

const hook = {
  id: "hook",
  title: "The hook: getting paid",
  bg: "#0f190e",
  secs: 22,
  notes: notes(
    "Meet our frog. He just shipped his app, and people love it.",
    "[auto, after a breath] Then the payments start. \"Sent 99 birr, here's the screenshot.\" \"I paid yesterday, can you unlock my account?\" Every payment checked by hand, every renewal chased in a chat.",
    "[auto] And his iPhone users can't pay at all.",
  ),
  html: `
    ${label("A developer in Addis")}
    <div class="glow" style="left:980px;top:60px;width:900px;height:900px;background:radial-gradient(closest-side,rgba(139,231,136,.08),rgba(139,231,136,0))"></div>
    ${thread({
      a: "M -40 1000 C 300 1030 700 992 960 948 C 1120 918 1240 820 1180 720 C 1120 610 950 646 992 762 C 1032 878 1222 858 1212 738 C 1202 598 1012 566 964 684 C 924 784 1064 862 1144 802 C 1232 734 1152 584 1062 624 C 984 662 1034 806 1250 902 C 1330 940 1460 1004 1980 994",
    })}
    <div class="abs" style="left:128px;top:150px">
      <h1 class="h1" style="font-size:92px"><span class="ln h-l1" data-morph="h1a" data-morph-kind="text">Building the app is easy.</span></h1>
      <h1 class="h1" style="font-size:92px;margin-top:6px"><span class="ln h-l2 pink" data-morph="h1b" data-morph-kind="text">Getting paid is not.</span></h1>
    </div>
    ${moods(["cheer", "surprised", "sad", "shrug"], { style: "left:270px;top:430px;width:540px;height:540px", attrs: 'data-morph="mascot"' })}
    <div class="h-badge abs" style="left:1712px;top:112px;z-index:5;display:grid;place-items:center;min-width:64px;height:64px;padding:0 14px;border-radius:32px;background:#e74e78;color:#162215;font:800 30px/1 var(--f-body);border:5px solid #fff;box-shadow:0 0 0 2px #0c150b,0 10px 30px -8px rgba(231,78,120,.6)"><span class="h-count">0</span></div>
    <div class="abs h-phone" style="left:1300px;top:96px;width:444px;height:910px">
      ${androidFrame("h-and", `${bookScreen("h-book")}<div class="h-dim" style="position:absolute;inset:0;background:rgba(10,14,10,.55);opacity:0;z-index:30"></div><div class="h-stack" style="position:absolute;left:12px;right:12px;top:48px;display:flex;flex-direction:column;gap:8px;z-index:41">${NOTIFS.map(notif).join("")}</div>`, { style: "left:0;top:0" })}
    </div>
    <div class="abs h-iphone" style="left:1300px;top:96px;width:448px;height:914px;opacity:0">${iphoneFrame("h-ip", iosNoPay(), { style: "left:0;top:0", bg: AppT.paper })}</div>
    ${FOOT}`,
};

// ---------- 3. problem ----------

const DIY = [
  ["h", "In the app: 267 lines"],
  ["r", "diy/app/api.ts", 26], ["r", "diy/app/checkout.ts", 33], ["r", "diy/app/index.ts", 2], ["r", "diy/app/Paywall.tsx", 106], ["r", "diy/app/plans.ts", 6], ["r", "diy/app/ProGate.tsx", 22], ["r", "diy/app/ProProvider.tsx", 63], ["r", "diy/app/user.ts", 9],
  ["h", "On your server (plus hosting, a database and a cron): 369 lines"],
  ["r", "diy/server/chapa.ts", 44], ["r", "diy/server/checkout.ts", 46], ["r", "diy/server/config.ts", 16], ["r", "diy/server/db.ts", 40], ["r", "diy/server/entitlements.ts", 19], ["r", "diy/server/fulfilment.ts", 36], ["r", "diy/server/http.ts", 55], ["r", "diy/server/index.ts", 19], ["r", "diy/server/renewals.ts", 24], ["r", "diy/server/sms.ts", 10], ["r", "diy/server/subscriptions.ts", 27], ["r", "diy/server/webhook.ts", 33],
];
const PAINS = [
  ["camera", "Payments by screenshot", "Checked and unlocked by hand", { bg: "#e74e78", rot: -7 }],
  ["files", "Billing rebuilt by every team", "636 lines in 20 files, for one app", { bg: "#ebe420", rot: 5 }],
  ["lock", "iPhone users can't pay", "Apple in-app purchase isn't available in Ethiopia", { bg: "#8b3788", fg: "#ffffff", rot: -4 }],
];
const termHead = (file) => `<div style="display:flex;align-items:center;gap:9px;height:62px;padding:0 24px;border-bottom:1px solid #25272d"><span style="width:13px;height:13px;border-radius:7px;background:#3a3d46"></span><span style="width:13px;height:13px;border-radius:7px;background:#3a3d46"></span><span style="width:13px;height:13px;border-radius:7px;background:#3a3d46"></span><span class="mono" style="margin-left:14px;font-size:17px;color:#8e929c">${file}</span></div>`;
const problem = {
  id: "problem",
  title: "The problem",
  bg: "#162215",
  secs: 22,
  notes: notes(
    "This is how most Ethiopian apps get paid today.",
    "Payments arrive as screenshots. Every team rebuilds billing from scratch: in our example app, AddisEReader, that was 636 lines in 20 files, plus a server and a cron job. And Apple's in-app purchase isn't available in Ethiopia, so iPhone users are the hardest to charge.",
  ),
  html: `
    ${label("Problem")}
    <div class="abs" style="left:128px;top:150px">
      <h1 class="h1" style="font-size:72px"><span class="ln" data-morph="h1a" data-morph-kind="text">Building the app is easy.</span></h1>
      <h1 class="h1" style="font-size:72px;margin-top:4px"><span class="ln pink" data-morph="h1b" data-morph-kind="text">Getting paid is not.</span></h1>
    </div>
    ${PAINS.map(
      ([ico, t, s, st], i) => `<div class="abs p-row" style="left:128px;top:${452 + i * 170}px;display:flex;gap:36px;align-items:center;width:820px">
        ${sticker(ico, { ...st, size: 96 })}
        <div><div style="font:500 42px/1.1 var(--f-head)">${t}</div><div class="body" style="margin-top:10px">${s}</div></div></div>`,
    ).join("")}
    <div class="abs p-term" data-morph="code" data-morph-kind="box" style="left:1010px;top:150px;width:782px;height:820px;box-sizing:border-box;border-radius:24px;background:#0f1012;border:1.5px solid #2c2e35;overflow:hidden;box-shadow:0 40px 90px -40px rgba(0,0,0,.8)">
      ${termHead("addis-ereader $ npm run count:diy")}
      <div class="mono" style="padding:16px 26px 0;font-size:17px;line-height:26.5px;color:#9ca3af">${DIY.map(([k, a, n]) =>
        k === "h"
          ? `<div class="p-line" style="color:#c4c7ce;margin-top:6px;white-space:nowrap">${esc(a)}</div>`
          : `<div class="p-line" style="display:flex;justify-content:space-between;padding-left:18px"><span style="color:#f3f4f6">${a}</span><span style="color:#fff">${n}</span></div>`,
      ).join("")}</div>
      <div class="p-total" style="position:absolute;left:0;right:0;bottom:0;display:flex;align-items:baseline;justify-content:space-between;padding:22px 26px;border-top:1px solid #25272d;background:#141518"><span class="mono" style="font-size:20px;color:#c4c7ce">Total</span><span style="font:500 46px/1 var(--f-head);color:#fff"><span class="p-count">0</span> lines <span style="color:#9ca3af;font-size:30px">in 20 files</span></span></div>
    </div>
    ${FOOT}`,
};

// ---------- 4. solution ----------

const CODE6 = [
  `${K("import")} ${Pn("{")} Revet, RevetGate, RevetProvider, useEntitlement ${Pn("}")} ${K("from")} ${Str('"@revet-et/react-native"')};`,
  `${K("import type")} ${Pn("{")} ReactNode ${Pn("}")} ${K("from")} ${Str('"react"')};`,
  `${K("export const")} ProProvider = (${Pn("{")} children ${Pn("}")}) =&gt; ${J("<RevetProvider apiKey=")}${Str('"pk_test_8f92…"')}${J(">")}…`,
  `${K("export const")} ProGate = (${Pn("{")} feature, children ${Pn("}")}) =&gt; ${J('<RevetGate entitlement=')}${Str('"pro"')}${J(">")}…`,
  `${K("export const")} useIsPro = () =&gt; useEntitlement(${Str('"pro"')}).isActive;`,
  `${K("export const")} useProAccount = () =&gt; (${Pn("{")} manage: Revet.openCustomerCenter, verify: Revet.verifyPhone ${Pn("}")});`,
];
const solution = {
  id: "solution",
  title: "The solution",
  bg: "#162215",
  secs: 18,
  notes: notes(
    "Revet fixes that. We help Ethiopian developers charge for their apps with M-PESA, without building billing.",
    "Those 636 lines become six. One SDK, one backend, and the customer pays with an M-PESA PIN.",
  ),
  html: `
    ${label("Solution")}
    ${thread({ a: "M -40 992 C 420 1010 800 996 940 904 C 1048 844 1028 640 1022 470 C 1016 300 1064 140 1180 136 C 1310 132 1330 392 1170 400 C 1040 406 1012 260 1090 186 C 1170 112 1500 116 1980 132" })}
    <h1 class="h1 abs in" style="left:128px;top:160px;font-size:96px"><span class="ln">One SDK.</span><span class="ln">One backend.</span><span class="ln green">Paid with M-PESA.</span></h1>
    <p class="lead abs in" style="left:128px;top:548px;width:800px">We help Ethiopian developers charge for their apps with M-PESA, without building billing.</p>
    <div class="abs in" style="left:128px;top:748px;display:flex;gap:18px"><span class="chip fill">Subscriptions</span><span class="chip">In-app purchases</span><span class="chip">Weekly payouts</span></div>
    <div class="abs so-count" style="left:0;top:0;width:1920px;height:440px;pointer-events:none">
      <span class="so-n abs" style="left:1072px;top:204px;width:200px;text-align:center;font:500 150px/0.9 var(--f-head);color:#fff;white-space:nowrap">6</span>
      <span class="abs" style="left:1360px;top:262px;font:500 44px/1.1 var(--f-head);white-space:nowrap">lines with Revet<span style="display:block;margin-top:6px;font:400 26px/1.2 var(--f-body);color:var(--ink-muted)">down from 636 in AddisEReader</span></span>
    </div>
    <div class="abs" data-morph="code" data-morph-kind="box" style="left:1060px;top:452px;width:732px;height:430px;box-sizing:border-box;border-radius:24px;background:#0f1012;border:1.5px solid #2c2e35;overflow:hidden;box-shadow:0 40px 90px -40px rgba(0,0,0,.8)">
      ${termHead("src/pro.tsx")}
      <div class="mono" style="padding:22px 0 0 24px;font-size:21px;line-height:54px;color:#f3f4f6">${CODE6.map((l, i) => `<div class="so-line" style="display:flex;gap:22px;white-space:pre;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,#000 80%,transparent);mask-image:linear-gradient(90deg,#000 80%,transparent)"><span style="width:20px;flex-shrink:0;text-align:right;color:#7b7e87">${i + 1}</span><span>${l}</span></div>`).join("")}</div>
    </div>
    ${FOOT}`,
};

// ---------- 5. how it works ----------

const pay = vm.earnings.payouts.find((p) => p.status === "paid") ?? vm.earnings.payouts[0];
const how = {
  id: "how",
  title: "How the money moves",
  bg: "#0f190e",
  secs: 22,
  notes: notes(
    "Here's how the money moves.",
    "[auto] The customer taps a locked feature and gets an M-PESA prompt with the app's name on it: STK Push. One PIN, and Pro unlocks in place. Revet records every birr in a double-entry ledger.",
    "[auto] Every week, Revet pays the developer to their M-PESA through B2C. No merchant onboarding, and no Daraja integration of their own.",
  ),
  html: `
    ${label("How it works")}
    <h1 class="h1 abs in" style="left:128px;top:160px">One PIN in. One payout out.</h1>
    ${thread({ a: "M -40 560 C 40 560 70 652 170 652 L 1750 652 C 1850 652 1880 560 1980 560" }, "hw-thread")}
    <svg class="abs" viewBox="0 0 1920 1080" style="left:0;top:0;width:1920px;height:1080px;overflow:visible;pointer-events:none;z-index:3" aria-hidden="true"><circle class="hw-dot" cx="0" cy="0" r="17" fill="#ebe420" stroke="#0c150b" stroke-width="5" opacity="0"/></svg>
    ${[["Customer", "smartphone", 128], ["Revet", "layers", 720], ["Developer", "building-2", 1312]]
      .map(([t, ico, x]) => `<div class="abs hw-label" style="left:${x}px;top:350px;display:flex;align-items:center;gap:16px"><span class="ring-icon" style="width:56px;height:56px">${ic(ico, 26)}</span><span style="font:500 40px/1 var(--f-head)">${t}</span></div>`)
      .join("")}
    <div class="abs hw-a" style="left:128px;top:460px;width:480px;box-sizing:border-box;border-radius:20px;background:#fff;padding:30px 32px;color:#1c1c1e;font-family:var(--font-sans);box-shadow:0 40px 80px -40px rgba(0,0,0,.8)">
      <div style="font-size:19px;font-weight:700;letter-spacing:.04em;color:#2d8a3e">M-PESA</div>
      <div style="margin-top:10px;font-size:25px;line-height:1.38">Pay REVET 99 ETB for ADDISEREADER. Enter M-PESA PIN to confirm.</div>
      <div style="margin-top:18px;border-bottom:2.5px solid #2d8a3e;padding-bottom:6px;text-align:center;height:44px;font:400 30px var(--font-mono);letter-spacing:.6em"><span class="hw-pin"></span></div>
      <div style="margin-top:22px;display:flex;justify-content:flex-end;gap:8px"><span style="padding:8px 16px;font-size:19px;font-weight:700;letter-spacing:.04em;color:#2d8a3e">CANCEL</span><span class="hw-send" style="padding:8px 16px;font-size:19px;font-weight:700;letter-spacing:.04em;color:#2d8a3e;border-radius:8px">SEND</span></div>
    </div>
    <p class="body abs hw-cap" style="left:128px;top:872px;width:480px">One PIN, and Pro unlocks in place.</p>
    <div class="abs" data-morph="code" data-morph-kind="box" style="left:720px;top:460px;width:480px;height:384px;box-sizing:border-box;border-radius:20px;background:#0f1012;border:1.5px solid #2c2e35;font-family:var(--font-sans);overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:22px 26px;border-bottom:1px solid #25272d"><span style="font-size:22px;font-weight:700;color:#fff">Ledger</span><span class="hw-bal" style="display:inline-flex;align-items:center;gap:8px;border-radius:99px;background:#1f3a21;padding:6px 14px;font-size:16px;font-weight:600;color:#8be788">${ic("circle-check", 18)}Balanced</span></div>
      <div style="padding:18px 26px 0"><div style="font-size:15px;color:#9ca3af">Journal · M-PESA payment</div>
        <div class="hw-j" style="display:flex;justify-content:space-between;margin-top:14px;font-size:19px"><span style="color:#f3f4f6">M-PESA collection account</span><span class="mono" style="color:#fff">+99.00</span></div>
        <div class="hw-j" style="display:flex;justify-content:space-between;margin-top:12px;font-size:19px"><span style="color:#f3f4f6">Owed to the developer</span><span class="mono" style="color:#fff">−99.00</span></div>
        <div class="hw-j" style="display:flex;justify-content:space-between;margin-top:16px;padding-top:14px;border-top:1px solid #25272d;font-size:19px"><span style="color:#9ca3af">Sum of postings</span><span class="mono" style="color:#8be788">0.00</span></div>
      </div>
      <div class="hw-pro" style="position:absolute;left:26px;bottom:24px;display:inline-flex;align-items:center;gap:10px;border-radius:12px;background:#8be788;padding:10px 18px;font-size:19px;font-weight:700;color:#0e170f">${ic("check", 20, 3)}Pro unlocked</div>
    </div>
    <p class="body abs hw-cap" style="left:720px;top:872px;width:480px">Every birr in a balanced journal.</p>
    <div class="abs hw-c" style="left:1312px;top:460px;width:480px;height:384px;box-sizing:border-box;border-radius:20px;background:#1c1d21;border:1.5px solid #2c2e35;padding:26px;font-family:var(--font-sans)">
      <div style="font-size:22px;font-weight:700;color:#fff">Payout to M-PESA</div>
      <div style="margin-top:8px;font-size:16px;color:#9ca3af">${maskPhone(vm.earnings.payoutDestination)} · weekly on Mondays</div>
      <div style="margin-top:26px;font:700 52px/1 var(--font-mono);color:#fff"><span class="hw-amt">${etb(vm.earnings.balance.available)}</span><span style="margin-left:10px;font:600 20px var(--font-sans);color:#8e929c">ETB</span></div>
      <div class="hw-paid" style="position:absolute;left:26px;right:26px;bottom:24px;display:flex;align-items:center;justify-content:space-between;border-radius:12px;background:#141518;border:1px solid #2c2e35;padding:14px 16px;font-size:17px"><span style="display:flex;align-items:center;gap:10px;color:#fff">${ic("circle-check", 20)}<span>Paid · B2C</span></span><span class="mono" style="color:#c4c7ce">${pay?.receipt ?? ""}</span></div>
    </div>
    <p class="body abs hw-cap" style="left:1312px;top:872px;width:480px">Paid to M-PESA every week.</p>
    ${[[664, "STK Push"], [1256, "B2C"]]
      .map(([x, t], i) => `<span class="abs hw-api hw-api${i}" style="left:${x}px;top:596px;transform:translateX(-50%);white-space:nowrap;font:600 20px/1 var(--f-body);color:var(--ink-muted)">${t}</span>`)
      .join("")}
    ${FOOT}`,
};

// ---------- demo ----------

const demo = {
  id: "demo",
  title: "Demo video",
  bg: "#0b120a",
  secs: 0,
  notes: notes("[auto] The demo plays by itself (1:28, narrated). Middle-click moves on; left-click goes back and stops it.", "If the video can't play, open brag-output/brag.mp4 directly."),
  html: `
    ${label("Demo")}
    ${FOOT}
    <div class="abs dm-frame" data-morph="screen" data-morph-kind="box" style="left:240px;top:150px;width:1440px;height:810px;border-radius:28px;overflow:hidden;background:#000;border:1.5px solid #2f4a2d;box-shadow:0 60px 140px -50px rgba(0,0,0,.9)">
      <video class="dm-video" src="assets/demo.mp4" poster="assets/poster.jpg" preload="auto" playsinline style="display:block;width:100%;height:100%;object-fit:cover"></video>
      <div class="dm-play" style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(5,9,5,.28)">
        <span style="display:grid;place-items:center;width:150px;height:150px;border-radius:75px;background:#8be788;border:8px solid #fff;box-shadow:0 0 0 3px #0c150b,0 20px 60px -10px rgba(139,231,136,.55)"><svg width="54" height="60" viewBox="0 0 18 20"><path d="M2 1.6v16.8a1 1 0 0 0 1.5.86l14-8.4a1 1 0 0 0 0-1.72l-14-8.4A1 1 0 0 0 2 1.6z" fill="#162215"/></svg></span>
      </div>
    </div>`,
};





// ---------- 8. business model ----------

// The chart: fee rate against monthly revenue. Free up to a threshold, then a fee that is lower on M-PESA.
// No threshold or rate is printed: both are placeholders until the pilot sets them.
const CH = { x0: 990, x1: 1716, t: 1290, y0: 840, top: 340, other: 520, mpesa: 640 };
const model = {
  id: "model",
  title: "Business model",
  bg: "#162215",
  secs: 18,
  notes: notes(
    "Developers pay, and only once they earn. Revet is free up to a monthly revenue threshold; above it we take a share of each payment, and that share is lower on M-PESA than on other payment methods.",
    "So developers put M-PESA first: only M-PESA renews with a single PIN, and every payout lands in an M-PESA wallet. The fee comes off each payment, and the rest is paid out weekly.",
    "Q&A, what are the numbers? We'll set the free threshold and the rates with our pilot developers. The prototype currently charges 2.5% on M-PESA revenue as a working value.",
    "Q&A, how does that compare? App stores take 15 to 30%. RevenueCat charges 1% on top of the stores and doesn't collect the money. Chapa launched at 3.5% for payment processing alone (2022). Revet collects, runs the subscription and pays out.",
  ),
  html: `
    ${label("Business model")}
    <h1 class="h1 abs in" style="left:128px;top:160px"><span class="ln">Free to start,</span><span class="ln">cheaper through</span><span class="ln green">M-PESA.</span></h1>
    <p class="abs md-why" style="left:128px;top:642px;margin:0;font:600 26px/1 var(--f-body);color:var(--ink-muted)">Why developers put M-PESA first</p>
    ${["Only M-PESA renews with a single PIN", "Every payout lands in an M-PESA wallet"]
      .map((t, i) => `<div class="abs md-item" style="left:128px;top:${700 + i * 112}px;display:flex;align-items:center;gap:26px;width:770px">${sticker("check", { size: 64, rot: i ? 4 : -5 })}<span style="font:500 31px/1.2 var(--f-body)">${t}</span></div>`)
      .join("")}
    <div class="abs md-panel" style="left:900px;top:250px;width:892px;height:700px;box-sizing:border-box;border-radius:48px;background:#0f190e;border:1.5px solid var(--line)"></div>
    <svg class="abs md-chart" viewBox="0 0 1920 1080" style="left:0;top:0;width:1920px;height:1080px;overflow:visible;pointer-events:none" aria-hidden="true">
      <g class="md-axes" stroke="#34483a" stroke-width="2" fill="none"><path d="M ${CH.x0} ${CH.top} V ${CH.y0} H ${CH.x1}"/></g>
      <path class="md-thr" d="M ${CH.t} ${CH.top + 6} V ${CH.y0}" stroke="#7b9179" stroke-width="2" stroke-dasharray="7 9" fill="none"/>
      <rect class="md-band" x="${CH.t}" y="${CH.other}" width="${CH.x1 - CH.t}" height="${CH.mpesa - CH.other}" fill="rgba(139,231,136,0.12)"/>
      <path class="md-other" d="M ${CH.t} ${CH.mpesa} V ${CH.other} H ${CH.x1}" stroke="#7b9179" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" fill="none"/>
      <g class="md-labels" style="font-family:var(--f-body)">
        <text class="md-l" x="${CH.x0 + 18}" y="${CH.top + 22}" fill="#b9c9b7" font-size="24">Fee rate</text>
        <text class="md-l" x="${CH.t + 18}" y="${CH.top + 22}" fill="#b9c9b7" font-size="24">Free threshold</text>
        <text class="md-l" x="${(CH.t + CH.x1) / 2}" y="${CH.other - 24}" fill="#b9c9b7" font-size="27" font-weight="600" text-anchor="middle">Other methods</text>
        <text class="md-l" x="${CH.t + 30}" y="${(CH.other + CH.mpesa) / 2 + 9}" fill="#b9c9b7" font-size="25">M-PESA saving</text>
        <text class="md-l" x="${(CH.t + CH.x1) / 2}" y="${CH.mpesa + 62}" fill="#8be788" font-size="29" font-weight="700" text-anchor="middle">Lower fee on M-PESA</text>
        <text class="md-l" x="${(CH.x0 + CH.t) / 2}" y="${CH.y0 - 40}" fill="#ffffff" font-size="36" font-weight="700" text-anchor="middle">Free</text>
        <text class="md-l" x="${CH.x1}" y="${CH.y0 + 52}" fill="#b9c9b7" font-size="24" text-anchor="end">Monthly revenue</text>
      </g>
    </svg>
    ${thread({ m: `M ${CH.x0} ${CH.y0} H ${CH.t} V ${CH.mpesa} H ${CH.x1}` }, "md-mpesa thin")}
    ${FOOT}`,
};

// ---------- 9. go-to-market ----------

const GR = 186; // bead radius
const GX = [128 + GR, 960, 1792 - GR], GY = 600;
const gtm = {
  id: "gtm",
  title: "Go-to-market",
  bg: "#162215",
  secs: 12,
  notes: notes(
    "We start where subscriptions already make sense: ed-tech first, then media and streaming, then games.",
    "We reach developers through hackathon teams, Safaricom's developer channels, developer communities and software agencies, and we onboard the first 20 by hand.",
  ),
  html: `
    ${label("Go-to-market")}
    <h1 class="h1 abs in" style="left:128px;top:160px"><span class="ln">Start where subscriptions</span><span class="ln">already make sense.</span></h1>
    ${thread({ a: `M -40 760 C 60 760 140 ${GY} ${GX[0]} ${GY} C ${GX[0] + 240} ${GY} ${GX[1] - 300} ${GY + 120} ${GX[1]} ${GY} C ${GX[1] + 300} ${GY - 120} ${GX[2] - 240} ${GY} ${GX[2]} ${GY} C ${GX[2] + 120} ${GY} 1860 440 1980 440` }, "gt-thread")}
    ${[
      ["graduation-cap", "Ed-tech", "Parents pay for children, by term"],
      ["book-open", "Media and streaming", "Books, music, video and news"],
      ["gamepad-2", "Games and utilities", "In-app purchases"],
    ]
      .map(([ico, t, s], i) => `<div class="abs ring bead gt-card" style="left:${GX[i] - GR}px;top:${GY - GR}px;width:${2 * GR}px;height:${2 * GR}px;justify-content:flex-start;padding-top:64px">
        <span style="font:500 26px/1 var(--f-body);color:var(--ink-muted)">${i + 1}</span>
        <span class="green" style="margin-top:12px">${ic(ico, 36)}</span>
        <div style="margin-top:14px;font:500 34px/1.1 var(--f-head);max-width:290px;text-wrap:balance">${t}</div>
        <div class="body" style="margin-top:10px;font-size:21px;max-width:270px;text-wrap:balance">${s}</div></div>`)
      .join("")}
    <div class="abs gt-ch" style="left:0;right:0;top:830px;text-align:center;font:600 24px/1 var(--f-body);color:var(--ink-muted)">How we reach developers</div>
    <div class="abs" style="left:128px;top:876px;width:1664px;display:flex;justify-content:center;flex-wrap:wrap;gap:14px">${["Hackathon teams", "Safaricom developer channels", "Developer communities", "Software agencies"].map((c) => `<span class="chip gt-chip" style="border-radius:999px;font-size:24px;padding:14px 24px">${c}</span>`).join("")}<span class="chip fill gt-chip" style="border-radius:999px;font-size:24px;padding:14px 24px">First 20 onboarded by hand</span></div>
    ${FOOT}`,
};

// ---------- 10. beyond Ethiopia ----------

const MS = 0.94, MX = 980, MY = 70; // map placement
const mpt = (m) => [Math.round(MX + m.x * MS), Math.round(MY + m.y * MS)];
const et = MAP.markets.find((m) => m.name === "Ethiopia");
const MARKET_IDS = new Set(MAP.markets.map((m) => m.id));
const LABEL = { Ethiopia: [24, -6, "start"], Kenya: [26, 30, "start"], Tanzania: [24, 22, "start"], "DR Congo": [-26, 6, "end"], Mozambique: [26, 26, "start"], Lesotho: [-26, 8, "end"] };
const world = {
  id: "world",
  title: "Beyond Ethiopia",
  bg: "#0f190e",
  secs: 18,
  notes: notes(
    "And Ethiopia is the start. M-PESA already has 5.2 million customers here, 40 million monthly active customers in Kenya and 14 million in Tanzania.",
    "Our SDK, ledger and console carry over; each new market needs its own licence and rail settings. Our goal: every developer on M-PESA gets paid for their work.",
    "Q&A sources: Safaricom Ethiopia FY26 results (May 2026, 5.2 M M-PESA customers); Safaricom, March 2026 (40 M monthly active in Kenya); Vodacom Tanzania FY26 results (14.1 M).",
  ),
  html: `
    ${label("Beyond Ethiopia")}
    <h1 class="h1 abs in" style="left:128px;top:160px"><span class="ln">Ethiopia first.</span><span class="ln">Then every</span><span class="ln green">M-PESA market.</span></h1>
    ${[
      ["5.2 M", "M-PESA customers in Ethiopia"],
      ["40 M", "monthly active in Kenya"],
      ["14.1 M", "M-PESA customers in Tanzania"],
    ]
      .map(([n, t], i) => `<div class="abs wd-stat" style="left:128px;top:${512 + i * 112}px;display:flex;align-items:baseline;gap:24px;white-space:nowrap"><span style="width:230px;font:500 70px/1 var(--f-head);color:var(--brand)">${n}</span><span class="body" style="font-size:26px">${t}</span></div>`)
      .join("")}
    <p class="abs wd-carry" style="left:128px;top:872px;width:760px;margin:0;font:500 26px/1.4 var(--f-body);color:#fff">Same SDK, ledger and console. Each market adds its own licence and rail settings.</p>
    <p class="abs" style="left:128px;top:980px;margin:0;font:400 16px/1 var(--f-body);color:#7b9179">Safaricom Ethiopia FY26 results, May 2026 · Safaricom, March 2026 · Vodacom Tanzania FY26 results</p>
    <svg class="abs wd-map" style="left:${MX}px;top:${MY}px;overflow:visible" width="${Math.round(MAP.w * MS)}" height="${Math.round(MAP.h * MS)}" viewBox="0 0 ${MAP.w} ${MAP.h}">
      <g>${MAP.countries.map((c) => `<path d="${c.d}" fill="#1a2a19" stroke="#34483a" stroke-width="1.2" ${MARKET_IDS.has(c.id) ? `class="wd-m"` : ""}/>`).join("")}</g>
      ${MAP.countries.filter((c) => c.id === 231).map((c) => `<path class="wd-et" d="${c.d}" fill="#8be788" stroke="#0c150b" stroke-width="3"/>`).join("")}
      <g fill="none" stroke-linecap="round">${MAP.markets
        .filter((m) => m.name !== "Ethiopia")
        .map((m) => {
          const mx = (et.x + m.x) / 2 + (m.y - et.y) * 0.18, my = (et.y + m.y) / 2 - (m.x - et.x) * 0.18;
          const d = `M${et.x} ${et.y}Q${mx.toFixed(0)} ${my.toFixed(0)} ${m.x} ${m.y}`;
          return `<g class="wd-arc"><path d="${d}" stroke="#0c150b" stroke-width="11"/><path d="${d}" stroke="#8be788" stroke-width="5"/></g>`;
        })
        .join("")}</g>
      ${MAP.markets.map((m) => `<g class="wd-pin" data-n="${m.name}"><circle cx="${m.x}" cy="${m.y}" r="${m.name === "Ethiopia" ? 13 : 11}" fill="${m.name === "Ethiopia" ? "#162215" : "#ebe420"}" stroke="${m.name === "Ethiopia" ? "#ffffff" : "#0c150b"}" stroke-width="4"/>${m.name === "Ethiopia" ? `<circle class="wd-pulse" cx="${m.x}" cy="${m.y}" r="13" fill="none" stroke="#8be788" stroke-width="3"/>` : ""}<text x="${m.x + LABEL[m.name][0]}" y="${m.y + LABEL[m.name][1]}" text-anchor="${LABEL[m.name][2]}" fill="#fff" style="font:600 26px var(--f-body);paint-order:stroke;stroke:#0f190e;stroke-width:6px;stroke-linejoin:round">${m.name}</text></g>`).join("")}
    </svg>
    ${mascot("pointLeft", { cls: "wd-mascot", style: `left:${mpt(et)[0] + 96}px;top:${mpt(et)[1] - 232}px;width:200px` })}
    ${FOOT}`,
};

// ---------- 11. team ----------

const TEAM = [
  ["Ismael Muzemil", "SDK and mobile", "IM", "#8be788", "#162215", "smartphone"],
  ["Chapa Eresso", "Payments and backend", "CE", "#d38fd0", "#2a0f29", "wallet"],
  ["Firaol Dugassa", "Security and compliance", "FD", "#ebe420", "#162215", "shield-check"],
];
const TX = [400, 960, 1520], TY = 560, TR = 150;
const team = {
  id: "team",
  title: "Team",
  bg: "#162215",
  secs: 12,
  notes: notes("We're Team Blitz: Ismael on the SDK and mobile, Chapa on payments and the backend, and Firaol on security and compliance."),
  html: `
    ${label("Team")}
    <h1 class="h1 abs in" style="left:128px;top:160px">The team behind Revet.</h1>
    ${thread({ a: `M -40 ${TY + 90} C 140 ${TY + 90} 220 ${TY} ${TX[0]} ${TY} C ${TX[0] + 200} ${TY} ${TX[1] - 260} ${TY + 90} ${TX[1]} ${TY} C ${TX[1] + 260} ${TY - 90} ${TX[2] - 200} ${TY} ${TX[2]} ${TY} C ${TX[2] + 180} ${TY} 1800 ${TY - 90} 1980 ${TY - 90}` }, "tm-thread")}
    ${TEAM.map(
      ([n, r, ini, bg, fg, ico], i) => `<div class="abs tm-person" style="left:${TX[i] - 300}px;top:${TY - TR}px;width:600px;display:flex;flex-direction:column;align-items:center">
        <div style="position:relative;width:${2 * TR}px;height:${2 * TR}px">
          <span class="tm-face" style="display:grid;place-items:center;width:100%;height:100%;box-sizing:border-box;border-radius:50%;background:${bg};color:${fg};font:500 108px/1 var(--f-head);border:9px solid #fff;box-shadow:0 0 0 3px #0c150b,0 30px 60px -24px rgba(0,0,0,.8)">${ini}</span>
          <span class="tm-badge" style="position:absolute;right:-4px;bottom:6px">${sticker(ico, { bg: "#162215", fg: "#8be788", size: 84, rot: i % 2 ? 6 : -6 })}</span>
        </div>
        <div style="margin-top:34px;font:500 46px/1.1 var(--f-head);white-space:nowrap">${n}</div>
        <div class="body" style="margin-top:10px;font-size:27px">${r}</div>
      </div>`,
    ).join("")}
    ${FOOT}`,
};

// ---------- 12. the ask ----------

const T12 = { left: 1400, top: 600, width: 360 };
const [t12x, t12y] = handAt("cheer", T12.left, T12.top, T12.width);
const ask = {
  id: "ask",
  title: "Our ask",
  bg: "#162215",
  secs: 18,
  notes: notes(
    "Our ask is a partnership with Safaricom, so that billing for an app is as easy as shipping it, across Africa.",
    "It starts with Daraja production access and a supervised pilot here in Ethiopia, then every M-PESA market. Every birr in, every birr out, through M-PESA. Thank you.",
    "Q&A, compliance: balances are fixed-schedule settlement obligations, not stored value. Every business is verified, with Fayda for its owners (in the prototype's verification flow). Personal data is handled under Ethiopia's Personal Data Protection Proclamation. AML rules such as self-dealing detection are in the system design, not built yet. Our preferred launch path is a supervised pilot under Safaricom's framework.",
  ),
  html: `
    ${label("Our ask")}
    <div class="glow" style="left:1100px;top:360px;width:860px;height:860px;background:radial-gradient(closest-side,rgba(139,231,136,.13),rgba(139,231,136,0))"></div>
    ${thread({ a: `M -40 990 C 500 1014 1000 976 1290 982 C 1610 990 1872 988 1868 840 C 1864 ${t12y + 30} 1780 ${t12y - 4} ${t12x + 4} ${t12y + 2}` })}
    <h1 class="h1 abs in" style="left:128px;top:160px"><span class="ln">Let's make billing as easy as</span><span class="ln green">shipping apps, across Africa.</span></h1>
    <div class="abs" data-morph="green" data-morph-kind="box" style="left:128px;top:420px;width:1150px;height:456px;box-sizing:border-box;border-radius:44px;background:#8be788;color:#162215;padding:48px 56px">
      <div style="font:600 28px/1 var(--f-body)">Our ask</div>
      <div class="ak-head" style="margin-top:18px;font:500 66px/1.05 var(--f-head)">A partnership with Safaricom</div>
      <div style="margin-top:42px;display:flex;flex-direction:column;gap:20px">
      ${["Daraja production access", "A supervised pilot in Ethiopia", "Then every M-PESA market"]
        .map((t, i) => `<div class="ak-line" style="display:flex;align-items:center;gap:22px"><span style="display:grid;place-items:center;width:54px;height:54px;border-radius:50%;background:#162215;color:#8be788;font:600 26px/1 var(--f-body);flex-shrink:0">${i + 1}</span><span style="font:500 40px/1.1 var(--f-head)">${t}</span></div>`)
        .join("")}
      </div>
    </div>
    ${mascot("cheer", { cls: "ak-mascot", style: `left:${T12.left}px;top:${T12.top}px;width:${T12.width}px` })}
    <div class="abs ak-mark" style="left:1480px;top:440px">${wordmark(64, "t12")}</div>
    ${FOOT}`,
};

export const SLIDES = [title, hook, problem, solution, how, demo, model, gtm, world, team, ask];
