// Per-slide timelines. Each slide plays straight through when it opens; S.step() marks a beat, and the
// next beat starts a short hold after it (positions like "s0+=1.4"), so the speaker can talk over each one.
// Elements with data-morph belong to the transition engine: animate their children, never them.
(() => {
  const A = (window.DECK.anim = {});
  const hooks = (window.DECK.hooks = {});
  const leave = (window.DECK.leave = {});

  /** A number that counts on the timeline (seek-safe: the text follows the tween's value). */
  function count(tl, el, from, to, at, duration, fmt = (v) => Math.round(v).toLocaleString("en-US"), ease = "power2.out", init = true) {
    const o = { v: from };
    if (init) el.textContent = fmt(from);
    tl.to(o, { v: to, duration, ease, onUpdate: () => (el.textContent = fmt(o.v)) }, at);
  }
  /** Idle loops run outside the timeline (so it stays finite) but inside the slide's context. */
  const bob = (el, y = -10, d = 1.8) => el && gsap.to(el, { y, duration: d, ease: "sine.inOut", yoyo: true, repeat: -1 });

  // ---------- the M-PESA thread: drawn like a pen stroke (dash offset), keyline and green together ----------

  /** Hides a thread's paths, ready to be drawn. */
  function prep(paths) {
    for (const p of paths) {
      const L = p.getTotalLength();
      p.__L = L;
      gsap.set(p, { strokeDasharray: `${L} ${L + 60}`, strokeDashoffset: L + 1 });
    }
  }
  /** Draws paths up to a fraction (or a length, per path) of their length. */
  function drawTo(tl, paths, to, at, duration, ease = "power1.inOut") {
    tl.to(paths, { strokeDashoffset: (i, p) => (typeof to === "function" ? p.__L - to(p) : p.__L * (1 - to)), duration, ease }, at);
  }
  /** The length along a path where it first reaches x (a coarse scan, then a fine one). */
  function firstLenAtX(p, x) {
    const L = p.getTotalLength();
    let l = 0;
    while (l < L && p.getPointAtLength(l).x < x) l += 4;
    while (l > 0 && p.getPointAtLength(l - 0.5).x >= x) l -= 0.5;
    return l;
  }
  /** The length along a left-to-right path where it reaches x. */
  function lenAtX(p, x) {
    let lo = 0, hi = p.getTotalLength();
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (p.getPointAtLength(mid).x < x) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  // ---------- 1. title ----------
  A.title = (S) => {
    const { tl, $, $$ } = S;
    const th = $$(".thread path");
    prep(th);
    tl.from($(".t-mark"), { opacity: 0, y: 24, duration: 0.7, ease: "power3.out" }, 0)
      .from($$(".t-l"), { opacity: 0, y: 70, duration: 0.95, ease: "power4.out", stagger: 0.12 }, 0.1)
      .from($(".t-lead"), { opacity: 0, y: 30, duration: 0.8, ease: "power3.out" }, 0.55)
      .from($(".t-foot"), { opacity: 0, duration: 0.8 }, 0.8)
      .from($(".mascot svg"), { y: 60, scale: 0.9, opacity: 0, transformOrigin: "50% 100%", duration: 0.9, ease: "back.out(1.7)" }, 0.35);
    drawTo(tl, th, 1, 0.6, 1.8);
    tl.from($$(".t-toast"), { opacity: 0, y: 40, scale: 0.94, duration: 0.8, ease: "back.out(1.6)", stagger: 0.28 }, 1.3);
    S.step();
    $$(".t-toast").forEach((t, i) => bob(t, i ? -12 : -9, 2.2 + i * 0.4));
  };

  // ---------- 2. hook ----------
  A.hook = (S) => {
    const { tl, $, $$ } = S;
    const mood = (from, to, at, d = 0.25) => tl.to($(`.m-${from}`), { opacity: 0, duration: d }, at).to($(`.m-${to}`), { opacity: 1, duration: d }, at);
    const line2 = $(".h-l2").parentElement;
    const notifs = $$(".h-n");
    const badge = $(".h-badge");
    // One stroke: drawn to where the knot starts, then on through the knot when the payments arrive.
    const th = $$(".thread path");
    prep(th);
    const knotAt = firstLenAtX(th[1], 960);
    gsap.set(line2, { opacity: 0, y: 30 });
    gsap.set(notifs, { opacity: 0, y: -46, scale: 0.96 });
    gsap.set(badge, { scale: 0, opacity: 0 });
    tl.from($(".h-phone"), { opacity: 0, y: 90, duration: 0.9, ease: "power3.out" }, 0.1)
      .from($(".m-cheer svg"), { y: 30, duration: 0.6, ease: "back.out(2)" }, 0.3);
    drawTo(tl, th, () => knotAt, 0.3, 1.1);
    S.step();
    // A breath, then the payments start, and the thread tangles.
    const b1 = tl.labels.s0 + 1.6;
    tl.to(line2, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, b1)
      .to($(".h-dim"), { opacity: 1, duration: 0.5 }, b1)
      .to(badge, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.4)" }, b1 + 0.5);
    mood("cheer", "surprised", b1 + 0.2);
    const t0 = b1 + 0.5;
    notifs.forEach((n, i) => {
      const at = t0 + 0.15 + i * 0.42;
      tl.to(n, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "back.out(1.6)" }, at);
      tl.fromTo($(".h-phone"), { x: 0 }, { x: 6, duration: 0.05, yoyo: true, repeat: 3, ease: "none" }, at + 0.05);
    });
    drawTo(tl, th, 1, t0, notifs.length * 0.42 + 1.0, "power1.inOut");
    count(tl, $(".h-count"), 0, 5, t0 + 0.15, notifs.length * 0.42, (v) => String(Math.max(1, Math.round(v))), "none");
    count(tl, $(".h-count"), 5, 99, t0 + 0.2 + notifs.length * 0.42, 1.1, (v) => (v >= 98.5 ? "99+" : String(Math.round(v))), "power2.in", false);
    mood("surprised", "sad", t0 + notifs.length * 0.42 + 0.3);
    S.step();
    // Another breath: and iPhone users can't pay at all.
    const b2 = tl.labels.s1 + 1.4;
    tl.to(notifs, { opacity: 0, y: 40, duration: 0.35, stagger: 0.04, ease: "power2.in" }, b2)
      .to(badge, { scale: 0, opacity: 0, duration: 0.3 }, b2)
      .to($(".h-phone"), { opacity: 0, y: 70, rotation: -4, duration: 0.55, ease: "power3.in" }, b2 + 0.15)
      .fromTo($(".h-iphone"), { opacity: 0, y: 90 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, b2 + 0.55)
      .from($(".h-alert"), { opacity: 0, scale: 0.86, duration: 0.45, ease: "back.out(2)" }, b2 + 1.25);
    mood("sad", "shrug", b2 + 1.25);
    S.step();
  };

  // ---------- 3. problem ----------
  A.problem = (S) => {
    const { tl, $, $$ } = S;
    tl.from($$(".p-row"), { opacity: 0, x: -36, duration: 0.7, ease: "power3.out", stagger: 0.14 }, 0.35)
      .from($$(".p-row .sticker"), { scale: 0.4, rotation: -30, duration: 0.6, ease: "back.out(2.2)", stagger: 0.14 }, 0.4)
      .from($$(".p-line"), { opacity: 0, duration: 0.18, stagger: 0.055 }, 0.55)
      .from($(".p-total"), { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" }, 1.55);
    count(tl, $(".p-count"), 0, 636, 1.6, 1.0, undefined, "power3.out");
    S.step();
  };

  // ---------- 4. solution ----------
  A.solution = (S) => {
    const { tl, $, $$ } = S;
    const th = $$(".thread path");
    prep(th);
    tl.from($(".so-count"), { opacity: 0, y: 30, duration: 0.6, ease: "power3.out" }, 0.45)
      .from($$(".so-line"), { opacity: 0, x: -24, duration: 0.5, ease: "power3.out", stagger: 0.09 }, 0.75);
    count(tl, $(".so-n"), 636, 6, 0.5, 1.3, undefined, "power3.out");
    drawTo(tl, th, 1, 0.5, 2.0);
    S.step();
  };

  // ---------- 5. how it works ----------
  A.how = (S) => {
    const { tl, $, $$ } = S;
    const th = $$(".hw-thread path");
    const p = th[1];
    const dot = $(".hw-dot");
    prep(th);
    const gapA = [lenAtX(p, 608), lenAtX(p, 720)], gapB = [lenAtX(p, 1200), lenAtX(p, 1312)];
    /** The birr dot travels along the thread between two lengths. */
    const travel = (from, to, at, duration) => {
      const o = { v: 0 };
      const place = () => {
        const pt = p.getPointAtLength(from + (to - from) * o.v);
        dot.setAttribute("cx", pt.x);
        dot.setAttribute("cy", pt.y);
      };
      tl.set(dot, { opacity: 1 }, at)
        .to(o, { v: 1, duration, ease: "power2.inOut", onUpdate: place, onStart: place }, at)
        .set(dot, { opacity: 0 }, at + duration);
    };
    gsap.set([...$$(".hw-j"), $(".hw-pro"), $(".hw-bal"), $(".hw-paid")], { opacity: 0 });
    tl.from($$(".hw-label"), { opacity: 0, y: 24, duration: 0.6, ease: "power3.out", stagger: 0.1 }, 0.2)
      .from($(".hw-a"), { opacity: 0, y: 40, duration: 0.7, ease: "power3.out" }, 0.3)
      .from($(".hw-c"), { opacity: 0, y: 40, duration: 0.7, ease: "power3.out" }, 0.45)
      .from($$(".hw-cap"), { opacity: 0, y: 16, duration: 0.6, stagger: 0.1 }, 0.7)
      .from($$(".hw-api"), { opacity: 0, duration: 0.5 }, 0.8);
    drawTo(tl, th, () => gapA[0], 0.3, 0.8);
    S.step();
    // The customer pays: four PIN digits, SEND, the birr travels, a balanced journal, Pro unlocked.
    const b1 = tl.labels.s0 + 0.6;
    count(tl, $(".hw-pin"), 0, 4, b1, 0.9, (v) => "•".repeat(Math.round(v)), "none");
    tl.to($(".hw-send"), { backgroundColor: "rgba(45,138,62,.16)", duration: 0.12, yoyo: true, repeat: 1 }, b1 + 0.95);
    drawTo(tl, th, () => gapB[0], b1 + 1.1, 0.8);
    travel(gapA[0], gapA[1], b1 + 1.1, 0.7);
    tl.to($(".hw-api0"), { color: "#8be788", duration: 0.3 }, b1 + 1.1)
      .to($$(".hw-j"), { opacity: 1, duration: 0.35, stagger: 0.18 }, b1 + 1.7)
      .fromTo($(".hw-bal"), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, b1 + 2.4)
      .fromTo($(".hw-pro"), { opacity: 0, y: 14, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)" }, b1 + 2.6);
    S.step();
    // Payday: B2C to the developer's M-PESA.
    const b2 = tl.labels.s1 + 0.8;
    drawTo(tl, th, 1, b2, 0.9);
    travel(gapB[0], gapB[1], b2, 0.7);
    tl.to($(".hw-api1"), { color: "#8be788", duration: 0.3 }, b2)
      .fromTo($(".hw-paid"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.8)" }, b2 + 0.6);
    S.step();
  };

  // ---------- demo: the frame opens to full screen and the video plays ----------
  A.demo = (S) => {
    const { tl, $ } = S;
    const v = $(".dm-video");
    if (S.presenter) v.muted = true;
    bob($(".dm-play span"), -8, 1.4);
    tl.to({}, { duration: 0.2 });
    S.step();
    const b = tl.labels.s0 + 0.5;
    tl.to($(".dm-play"), { opacity: 0, duration: 0.3 }, b)
      .to(S.root.querySelector(".chrome-label"), { opacity: 0, duration: 0.3 }, b)
      .to($(".dm-frame"), { left: 0, top: 0, width: 1920, height: 1080, borderRadius: 0, borderWidth: 0, duration: 0.8, ease: "power3.inOut" }, b);
    S.step();
  };
  hooks.demo = (S, { instant }) => {
    const v = S.$(".dm-video");
    S.playCall?.kill();
    if (instant) return v.pause();
    S.playCall = gsap.delayedCall(S.tl.labels.s0 + 0.6, () => v.play().catch(() => {}));
  };
  leave.demo = (S) => {
    S.playCall?.kill();
    S.$(".dm-video").pause();
  };

  // ---------- 6. built for Ethiopia ----------
  A.ethiopia = (S) => {
    const { tl, $$ } = S;
    tl.from($$(".et-ring"), { opacity: 0, scale: 0.86, duration: 0.7, ease: "back.out(1.6)", stagger: 0.1 }, 0.35);
    S.step();
  };

  // ---------- 7. production-ready ----------
  A.ready = (S) => {
    const { tl, $, $$ } = S;
    tl.from($$(".rd-row"), { opacity: 0, x: -34, duration: 0.7, ease: "power3.out", stagger: 0.12 }, 0.3)
      .from($(".rd-panel"), { opacity: 0, y: 40, duration: 0.8, ease: "power3.out" }, 0.4)
      .from($$(".rd-ev"), { opacity: 0, x: -18, duration: 0.4, ease: "power2.out", stagger: 0.22 }, 0.9)
      .fromTo($(".rd-dup"), { backgroundColor: "rgba(211,143,208,0.30)" }, { backgroundColor: "rgba(211,143,208,0.10)", duration: 1.2 }, 1.45);
    S.step();
  };

  // ---------- 8. business model ----------
  A.model = (S) => {
    const { tl, $, $$ } = S;
    const mp = $$(".md-mpesa path");
    prep(mp);
    tl.from($(".md-panel"), { opacity: 0, y: 30, duration: 0.7, ease: "power3.out" }, 0.25)
      .from([$(".md-axes"), $(".md-thr")], { opacity: 0, duration: 0.5 }, 0.55)
      .from($$(".md-l")[0], { opacity: 0, duration: 0.4 }, 0.6)
      .from($$(".md-l")[5], { opacity: 0, y: 12, duration: 0.5 }, 0.8);
    // The M-PESA line: free along the floor, a step up at the threshold, then on at the lower fee.
    drawTo(tl, mp, 1, 0.8, 1.6);
    tl.from($$(".md-l")[1], { opacity: 0, duration: 0.4 }, 1.2)
      .from($(".md-other"), { opacity: 0, duration: 0.5 }, 1.7)
      .from($$(".md-l")[2], { opacity: 0, y: 10, duration: 0.5 }, 1.8)
      .from($(".md-band"), { opacity: 0, duration: 0.6 }, 2.0)
      .from([$$(".md-l")[3], $$(".md-l")[4]], { opacity: 0, y: 10, duration: 0.5, stagger: 0.15 }, 2.1)
      .from($$(".md-l")[6], { opacity: 0, duration: 0.4 }, 2.2)
      .from($(".md-why"), { opacity: 0, duration: 0.5 }, 0.6)
      .from($$(".md-item"), { opacity: 0, x: -30, duration: 0.6, ease: "power3.out", stagger: 0.15 }, 0.7)
      .from($$(".md-item .sticker"), { scale: 0.4, rotation: -30, duration: 0.6, ease: "back.out(2.2)", stagger: 0.15 }, 0.75);
    S.step();
  };

  // ---------- 9. go-to-market ----------
  A.gtm = (S) => {
    const { tl, $, $$ } = S;
    const th = $$(".gt-thread path");
    prep(th);
    drawTo(tl, th, 1, 0.2, 1.8);
    tl.from($$(".gt-card"), { opacity: 0, scale: 0.8, duration: 0.7, ease: "back.out(1.7)", stagger: 0.3 }, 0.35)
      .from($(".gt-ch"), { opacity: 0, duration: 0.5 }, 1.2)
      .from($$(".gt-chip"), { opacity: 0, y: 16, duration: 0.5, ease: "power3.out", stagger: 0.08 }, 1.3);
    S.step();
  };

  // ---------- 10. beyond Ethiopia ----------
  A.world = (S) => {
    const { tl, $, $$ } = S;
    const arcs = $$(".wd-arc");
    arcs.forEach((g) => prep([...g.querySelectorAll("path")]));
    tl.from($(".wd-map"), { opacity: 0, duration: 0.8 }, 0.2)
      .from($(".wd-et"), { opacity: 0, duration: 0.6 }, 0.6)
      .from($$('.wd-pin[data-n="Ethiopia"]'), { opacity: 0, duration: 0.4 }, 0.8)
      .to($$(".wd-m"), { fill: "#2f4a2d", duration: 0.4, stagger: 0.16 }, 1.1)
      .from($$('.wd-pin:not([data-n="Ethiopia"])'), { opacity: 0, y: -12, duration: 0.45, ease: "back.out(2)", stagger: 0.16 }, 1.5)
      .from($$(".wd-stat"), { opacity: 0, x: -30, duration: 0.6, ease: "power3.out", stagger: 0.14 }, 0.5)
      .from($(".wd-carry"), { opacity: 0, y: 16, duration: 0.6 }, 1.2)
      .from($(".wd-mascot"), { opacity: 0, y: 40, duration: 0.7, ease: "back.out(1.8)" }, 1.9);
    arcs.forEach((g, i) => drawTo(tl, [...g.querySelectorAll("path")], 1, 1.0 + i * 0.16, 0.6, "power2.out"));
    S.step();
    gsap.fromTo($(".wd-pulse"), { attr: { r: 13 }, opacity: 1 }, { attr: { r: 44 }, opacity: 0, duration: 1.8, ease: "power1.out", repeat: -1 });
  };

  // ---------- 11. team: three people on one thread ----------
  A.team = (S) => {
    const { tl, $$ } = S;
    const th = $$(".tm-thread path");
    prep(th);
    drawTo(tl, th, 1, 0.2, 1.8);
    tl.from($$(".tm-face"), { scale: 0.6, opacity: 0, duration: 0.7, ease: "back.out(1.8)", stagger: 0.22 }, 0.35)
      .from($$(".tm-badge"), { scale: 0.3, rotation: -40, opacity: 0, duration: 0.6, ease: "back.out(2.4)", stagger: 0.22 }, 0.75)
      .from($$(".tm-person > div:not(:first-child)"), { opacity: 0, y: 20, duration: 0.6, ease: "power3.out", stagger: 0.11 }, 0.6);
    S.step();
  };

  // ---------- 12. the ask ----------
  A.ask = (S) => {
    const { tl, $, $$ } = S;
    const th = $$(".thread path");
    prep(th);
    tl.from($(".ak-head"), { opacity: 0, y: 20, duration: 0.6, ease: "power3.out" }, 0.6)
      .from($$(".ak-line"), { opacity: 0, x: -24, duration: 0.6, ease: "power3.out", stagger: 0.18 }, 0.9)
      .from($(".ak-mascot"), { opacity: 0, y: 60, scale: 0.92, transformOrigin: "50% 100%", duration: 0.9, ease: "back.out(1.8)" }, 0.9)
      .from($(".ak-mark"), { opacity: 0, duration: 0.6 }, 0.6);
    drawTo(tl, th, 1, 1.1, 1.8);
    S.step();
  };
})();
