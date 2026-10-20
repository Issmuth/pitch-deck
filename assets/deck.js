// Revet pitch deck runtime: a 1920×1080 stage scaled to the window, one GSAP timeline per slide that
// plays through on its own, and "morph" transitions between slides (elements that share a data-morph
// key fly from where they were on the old slide to where they sit on the new one).
//
// Mouse: middle button = next slide · left button = previous slide · every other button does nothing.
// Keys:  → Space PageDown Enter = next · ← PageUp Backspace = back · Home / End · a number + Enter
//        F full screen · P presenter window · B black screen
(() => {
  const W = 1920, H = 1080;
  const D = 0.95; // morph duration
  const EASE = "power3.inOut";
  const PRESENTER = new URLSearchParams(location.search).has("presenter");
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches; // cut instead of animating
  const defs = window.DECK.slides;
  const anims = window.DECK.anim;
  const els = defs.map((d) => document.getElementById(`s-${d.id}`));
  const stage = document.getElementById("stage");
  const frame = document.getElementById("frame");
  const morphLayer = document.getElementById("morph");
  const bgLayer = document.getElementById("bg");
  const chan = "BroadcastChannel" in window ? new BroadcastChannel("revet-deck") : null;

  let scale = 1;
  let cur = -1;
  let live = null; // { ctx, tl, labels, player }
  let trans = null; // the running transition timeline
  let starter = null; // the timer that starts the incoming slide

  // ---------- layout ----------

  function fit() {
    const r = frame.getBoundingClientRect();
    scale = Math.min(r.width / W, r.height / H);
    stage.style.transform = `translate(${(r.width - W * scale) / 2}px, ${(r.height - H * scale) / 2}px) scale(${scale})`;
  }
  addEventListener("resize", fit);

  /** An element's box in stage pixels (transforms included). */
  function rect(el) {
    const r = el.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    return { x: (r.left - s.left) / scale, y: (r.top - s.top) / scale, w: r.width / scale, h: r.height / scale };
  }

  // ---------- slides ----------

  const $ = (root) => (sel) => root.querySelector(sel);
  const $$ = (root) => (sel) => [...root.querySelectorAll(sel)];

  /** Builds a slide's timeline inside a GSAP context, so leaving the slide can revert every style it set. */
  function build(i) {
    const root = els[i];
    const S = { root, $: $(root), $$: $$(root), labels: [], presenter: PRESENTER };
    S.ctx = gsap.context(() => {
      S.tl = gsap.timeline({ paused: true });
      // Beats inside a slide; the slide plays through all of them by itself.
      S.step = () => {
        const name = `s${S.labels.length}`;
        S.tl.addLabel(name);
        S.labels.push(name);
      };
      // Headings, labels and other `.in` blocks rise in with every slide.
      const ins = root.querySelectorAll(".in");
      if (ins.length) S.tl.from(ins, { opacity: 0, y: 34, duration: 0.75, ease: "power3.out", stagger: 0.08 }, 0);
      (anims[defs[i].id] ?? (() => {}))(S);
      if (!S.labels.length) S.step();
    }, root);
    return S;
  }

  /**
   * Plays the slide to its end, or jumps there, recording the player in the slide's own context.
   * Never call this from a transition callback: GSAP would file the slide's context under the transition's,
   * and the transition's revert at the end of the morph would undo the whole slide.
   */
  function play(S, { instant = false } = {}) {
    S.ctx.add(() => {
      S.player?.kill();
      const end = S.labels.at(-1);
      if (instant) {
        S.tl.seek(end, false); // run onUpdate so counters show their value
        S.tl.pause();
      } else {
        S.player = S.tl.tweenTo(end, { ease: "none" });
      }
      window.DECK.hooks?.[defs[cur].id]?.(S, { instant });
    });
  }

  /** Everything inside `root` except the kept elements (and the ancestors that hold them). */
  function fadeable(root, keep) {
    const out = [];
    const walk = (node) => {
      for (const c of node.children) {
        if (keep.has(c)) continue;
        let holds = false;
        for (const k of keep) if (c.contains(k)) { holds = true; break; }
        if (holds) walk(c);
        else out.push(c);
      }
    };
    walk(root);
    return out;
  }

  function morphPairs(a, b) {
    const pairs = [];
    const fromA = new Map(a ? [...a.querySelectorAll("[data-morph]")].map((e) => [e.dataset.morph, e]) : []);
    const lone = [];
    for (const e of b.querySelectorAll("[data-morph]")) {
      const m = fromA.get(e.dataset.morph);
      if (m) pairs.push([m, e, e.dataset.morphKind || m.dataset.morphKind || "flip"]);
      else lone.push(e);
    }
    return { pairs, lone };
  }

  function morph(T, a, b, kind, ghosts) {
    if (kind === "same") {
      // Identical on both slides (the footer): the old one stays until the new slide has faded in.
      T.set(a, { opacity: 0 }, 0.42);
      return;
    }
    const ra = rect(a), rb = rect(b);
    if (!rb.w || !rb.h || !ra.w || !ra.h) return;
    if (kind === "box") {
      // A container: a ghost box takes over the old one's shape and colours and grows into the new one.
      const ca = getComputedStyle(a), cb = getComputedStyle(b);
      const g = document.createElement("div");
      g.className = "ghost";
      Object.assign(g.style, {
        left: `${ra.x}px`, top: `${ra.y}px`, width: `${ra.w}px`, height: `${ra.h}px`,
        background: ca.backgroundColor === "rgba(0, 0, 0, 0)" ? "transparent" : ca.backgroundColor,
        borderRadius: ca.borderTopLeftRadius, border: `${ca.borderTopWidth} solid ${ca.borderTopColor}`, boxShadow: ca.boxShadow,
      });
      morphLayer.appendChild(g);
      ghosts.push(g);
      T.to(a, { opacity: 0, duration: 0.22, ease: "none" }, 0);
      T.set(b, { opacity: 0 }, 0);
      T.to(g, {
        left: rb.x, top: rb.y, width: rb.w, height: rb.h,
        backgroundColor: cb.backgroundColor, borderRadius: cb.borderTopLeftRadius, borderColor: cb.borderTopColor,
        borderWidth: cb.borderTopWidth, boxShadow: cb.boxShadow === "none" ? "0 0 0 0 rgba(0,0,0,0)" : cb.boxShadow,
        duration: D, ease: EASE,
      }, 0);
      T.to(b, { opacity: 1, duration: 0.3, ease: "none" }, D - 0.22);
      T.to(g, { opacity: 0, duration: 0.2, ease: "none" }, D - 0.02);
      return;
    }
    // Text keeps its proportions (scaled by line height, anchored top-left); anything else maps box to box.
    const text = kind === "text";
    const bsx = text ? ra.h / rb.h : ra.w / rb.w, bsy = ra.h / rb.h;
    const asx = text ? rb.h / ra.h : rb.w / ra.w, asy = rb.h / ra.h;
    T.fromTo(b, { x: ra.x - rb.x, y: ra.y - rb.y, scaleX: bsx, scaleY: bsy, transformOrigin: "0 0" }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: D, ease: EASE }, 0);
    T.fromTo(b, { opacity: 0 }, { opacity: 1, duration: D * 0.4, ease: "none" }, 0);
    T.to(a, { x: `+=${rb.x - ra.x}`, y: `+=${rb.y - ra.y}`, scaleX: asx, scaleY: asy, transformOrigin: "0 0", duration: D, ease: EASE }, 0);
    T.to(a, { opacity: 0, duration: D * 0.25, ease: "none" }, D * 0.35);
  }

  /** Shows slide i. Forward: morph in and play. Back (or a jump): land on the finished slide. */
  function go(i, { dir = i > cur ? 1 : -1, instant = false, broadcast = true } = {}) {
    if (i < 0 || i >= defs.length) return;
    if (trans) trans.progress(1);
    starter?.kill();
    instant = instant || REDUCED;
    const A = live, ai = cur, a = ai >= 0 ? els[ai] : null;
    const b = els[i];
    if (A) window.DECK.leave?.[defs[ai].id]?.(A);
    if (A && a === b) {
      A.player?.kill();
      A.ctx.revert();
    }

    const B = build(i);
    const finished = dir < 0;
    if (finished) B.tl.seek(B.labels.at(-1), false);
    cur = i;
    live = B;

    b.classList.add("on");
    b.style.zIndex = 2;
    if (a) a.style.zIndex = 1;
    document.documentElement.style.setProperty("--slide-bg", defs[i].bg);

    const ghosts = [];
    let tctx;
    const finish = () => {
      // Newest first: the transition's styles, then the old slide's own timeline.
      tctx?.revert();
      gsap.set(bgLayer, { backgroundColor: defs[i].bg });
      if (a && a !== b) {
        a.classList.remove("on");
        a.style.zIndex = "";
        A.player?.kill();
        A.ctx.revert();
      }
      for (const g of ghosts) g.remove();
      trans = null;
    };

    if (!a || instant || a === b) {
      gsap.set(bgLayer, { backgroundColor: defs[i].bg });
      if (a && a !== b) finish();
      play(B, { instant: instant || finished });
    } else {
      const { pairs, lone } = morphPairs(a, b);
      // The new slide starts from a timer outside the transition's context (see play()).
      if (finished) play(B, { instant: true });
      else starter = gsap.delayedCall(pairs.length ? 0.3 : 0.18, () => play(B));
      tctx = gsap.context(() => {
        const T = (trans = gsap.timeline({ onComplete: finish }));
        T.to(bgLayer, { backgroundColor: defs[i].bg, duration: D, ease: "power2.inOut" }, 0);
        const keepA = new Set(pairs.map((p) => p[0]));
        T.to(fadeable(a, keepA), { opacity: 0, duration: 0.32, ease: "power1.in" }, 0);
        for (const [x, y, kind] of pairs) morph(T, x, y, kind, ghosts);
        T.fromTo(b, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, 0.08);
        for (const e of lone) T.fromTo(e, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 0.28);
      });
    }
    if (broadcast) post();
    paint();
  }

  const next = () => go(cur + 1, { dir: 1 });
  const prev = () => go(cur - 1, { dir: -1 });

  // ---------- sync, hash, presenter ----------

  function post() {
    history.replaceState(null, "", `#${cur + 1}`);
    chan?.postMessage({ type: "at", i: cur });
  }
  chan?.addEventListener("message", (e) => {
    const m = e.data;
    if (m.type === "at" && m.i !== cur) go(m.i, { broadcast: false });
    if (m.type === "hello") chan.postMessage({ type: "at", i: cur });
    if (m.type === "black") document.body.classList.toggle("black", m.on);
  });

  const notes = document.getElementById("p-notes");
  let started = null;
  let slideAt = performance.now();
  function paint() {
    if (!PRESENTER) return;
    slideAt = performance.now();
    const d = defs[cur];
    document.getElementById("p-count").textContent = `${cur + 1} / ${defs.length}`;
    document.getElementById("p-title").textContent = d.title;
    document.getElementById("p-next").textContent = defs[cur + 1] ? `Next: ${defs[cur + 1].title}` : "Last slide";
    document.getElementById("p-target").textContent = d.secs ? `about ${d.secs} s` : "";
    notes.innerHTML = d.notes;
  }
  const mmss = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  if (PRESENTER) {
    document.body.classList.add("presenter");
    const total = defs.reduce((s, d) => s + (d.secs || 0), 0);
    document.getElementById("p-budget").textContent = `Target ${mmss(total * 1000)} without the demo`;
    document.getElementById("p-timer").addEventListener("click", () => (started = started ? null : performance.now()));
    setInterval(() => {
      document.getElementById("p-elapsed").textContent = started ? mmss(performance.now() - started) : "0:00";
      document.getElementById("p-slide").textContent = mmss(performance.now() - slideAt);
    }, 250);
  }
  const startTimer = () => {
    if (PRESENTER && !started) started = performance.now();
  };

  // ---------- input ----------

  let typed = "";
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9]$/.test(k)) {
      typed += k;
      return;
    }
    if (k === "Enter" && typed) {
      go(Math.min(defs.length, Math.max(1, Number(typed))) - 1);
      typed = "";
      e.preventDefault();
      return;
    }
    typed = "";
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter", "n"].includes(k)) {
      e.preventDefault();
      startTimer();
      next();
    } else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) {
      e.preventDefault();
      prev();
    } else if (k === "Home") go(0);
    else if (k === "End") go(defs.length - 1);
    else if (k === "f" || k === "F") {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.()?.catch?.(() => {});
    } else if (k === "p" || k === "P") {
      if (!PRESENTER) open(`${location.pathname}?presenter${location.hash}`, "revet-presenter", "width=1280,height=760");
    } else if (k === "b" || k === "B" || k === ".") {
      const on = !document.body.classList.contains("black");
      document.body.classList.toggle("black", on);
      chan?.postMessage({ type: "black", on });
    }
  });

  // Middle button: next. Left button: back. Everything else (right button, wheel, side buttons) does nothing.
  frame.addEventListener("mousedown", (e) => {
    if (e.button === 1) {
      e.preventDefault(); // no autoscroll
      startTimer();
      next();
    } else if (e.button === 0) {
      prev();
    } else {
      e.preventDefault();
    }
  });
  frame.addEventListener("auxclick", (e) => e.preventDefault()); // a middle click opens nothing
  addEventListener("mouseup", (e) => {
    if (e.button === 3 || e.button === 4) e.preventDefault(); // side buttons don't leave the deck
  });
  if (!PRESENTER) frame.addEventListener("contextmenu", (e) => e.preventDefault());
  addEventListener("fullscreenchange", () => document.body.classList.toggle("fs", !!document.fullscreenElement));

  // ---------- start ----------

  window.DECK.api = { next, prev, go, get at() { return { i: cur }; } };
  const start = () => {
    fit();
    const m = location.hash.match(/^#(\d+)/);
    const i = m ? Math.min(defs.length, Math.max(1, Number(m[1]))) - 1 : 0;
    go(i, { dir: 1, broadcast: false });
    if (PRESENTER) chan?.postMessage({ type: "hello" });
    document.body.classList.add("ready");
  };
  (document.fonts?.ready ?? Promise.resolve()).then(start);
})();
