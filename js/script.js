/* ──────────────────────────────────────────────────────────────
   Maida Wang — interactions
   ────────────────────────────────────────────────────────────── */

(() => {
  /* ── footer year ─────────────────────────────────────── */
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ── mobile nav toggle ───────────────────────────────── */
  const toggle = document.querySelector('.nav__toggle');
  const links  = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', e => {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── scroll-spy on nav ───────────────────────────────── */
  const navLinks = document.querySelectorAll('.nav__links a');
  const sections = [...navLinks]
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => io.observe(s));
  }

  /* ── reveal on scroll ────────────────────────────────── */
  const revealEls = document.querySelectorAll('.section, .pub, .card, .news__item, .timeline__item');
  revealEls.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          ro.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealEls.forEach(el => ro.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ── back-to-top floating button ─────────────────────── */
  const top = document.querySelector('.to-top');
  if (top) {
    top.hidden = false;
    const onScroll = () => {
      top.classList.toggle('is-visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── copy email ──────────────────────────────────────── */
  document.querySelectorAll('.copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy || '';
      try {
        await navigator.clipboard.writeText(text);
        const old = btn.textContent;
        btn.textContent = 'Copied ✓';
        btn.classList.add('is-copied');
        setTimeout(() => { btn.textContent = old; btn.classList.remove('is-copied'); }, 1600);
      } catch {
        btn.textContent = 'Copy failed';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
      }
    });
  });

  /* ── Bloch sphere widget (hero) ──────────────────────── */
  (() => {
    const canvas = document.querySelector('.bloch');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.width, H = canvas.height;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const CX = W / 2, CY = H / 2;
    const R  = 200;                   // sphere radius (>portrait radius=140 so halo shows)

    // camera rotation state (radians)
    let rx = -0.45;                   // tilt down
    let ry =  0.6;                    // spin right
    let vry = 0.0025;                 // auto-spin velocity (idle)
    let dragging = false;
    let lastX = 0, lastY = 0;

    const portrait = canvas.parentElement;

    // pointer interaction
    canvas.addEventListener('pointerdown', e => {
      dragging = true;
      vry = 0;
      lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      portrait.classList.add('is-rotated');
    });
    canvas.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      ry += dx * 0.008;
      rx += dy * 0.008;
      rx = Math.max(-1.4, Math.min(1.4, rx));
      lastX = e.clientX; lastY = e.clientY;
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
      // gentle resume of auto-spin
      vry = 0.0015;
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', endDrag);

    // rotate (x,y,z) by camera angles; returns {x,y,z} (z = depth, +z toward viewer)
    function rotate(p) {
      // around Y
      let x = Math.cos(ry) * p.x + Math.sin(ry) * p.z;
      let z = -Math.sin(ry) * p.x + Math.cos(ry) * p.z;
      let y = p.y;
      // around X
      const y2 = Math.cos(rx) * y - Math.sin(rx) * z;
      const z2 = Math.sin(rx) * y + Math.cos(rx) * z;
      return { x: x, y: y2, z: z2 };
    }
    // orthographic project
    const proj = (p) => ({ x: CX + p.x * R, y: CY - p.y * R, z: p.z });

    // draw a great circle in plane orthogonal to `axis` ('x'|'y'|'z')
    function drawCircle(axis, alphaFront, alphaBack, color) {
      const N = 96;
      const pts = [];
      for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        const c = Math.cos(t), s = Math.sin(t);
        let p;
        if (axis === 'z') p = { x: c, y: s, z: 0 };
        else if (axis === 'y') p = { x: c, y: 0, z: s };
        else p = { x: 0, y: c, z: s };
        pts.push(proj(rotate(p)));
      }
      // split into front/back arcs to draw with different opacities
      ctx.lineWidth = 1;
      for (let i = 0; i < N; i++) {
        const a = pts[i], b = pts[(i + 1) % N];
        const front = a.z > 0 && b.z > 0;
        ctx.globalAlpha = front ? alphaFront : alphaBack;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // draw an axis line from -1 to +1 with optional label at both poles
    function drawAxis(axisVec, color, labels) {
      const a = proj(rotate({ x: -axisVec.x, y: -axisVec.y, z: -axisVec.z }));
      const b = proj(rotate({ x:  axisVec.x, y:  axisVec.y, z:  axisVec.z }));
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.globalAlpha = .55;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // labels at poles (outside sphere)
      const off = 16;
      ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      [[axisVec, labels[0], b], [{x:-axisVec.x,y:-axisVec.y,z:-axisVec.z}, labels[1], a]].forEach(([dir, label, p]) => {
        const r = rotate(dir);
        const dx = r.x, dy = -r.y;
        const len = Math.hypot(dx, dy) || 1;
        const lx = p.x + (dx / len) * off;
        const ly = p.y + (dy / len) * off;
        const depth = r.z;
        ctx.globalAlpha = depth > 0 ? 0.95 : 0.35;
        ctx.fillStyle = color;
        ctx.fillText(label, lx, ly);
      });
      ctx.globalAlpha = 1;
    }

    // draw the state vector |ψ⟩
    function drawStateVector(theta, phi) {
      const v = {
        x: Math.sin(theta) * Math.cos(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(theta),
      };
      const tip = proj(rotate(v));
      const origin = proj(rotate({ x: 0, y: 0, z: 0 }));

      // shaft
      const grad = ctx.createLinearGradient(origin.x, origin.y, tip.x, tip.y);
      grad.addColorStop(0, 'rgba(255,122,214,0.0)');
      grad.addColorStop(1, 'rgba(255,122,214,1)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();

      // tip glow + dot
      ctx.shadowColor = '#ff7ad6';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ff7ad6';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // psi state animation (theta, phi drift slowly)
    const t0 = performance.now();
    function frame(now) {
      // advance auto-spin
      if (!dragging) ry += vry;

      ctx.clearRect(0, 0, W, H);

      // wireframe sphere — equator (z-axis great circle), meridian (x), meridian (y)
      drawCircle('z', 0.65, 0.18, '#5cf0ff');   // equator
      drawCircle('y', 0.50, 0.14, '#8b6cff');   // meridian
      drawCircle('x', 0.50, 0.14, '#8b6cff');   // meridian

      // axes (X cyan, Y violet, Z magenta) with computational-basis labels
      drawAxis({ x: 1, y: 0, z: 0 }, '#5cf0ff', ['|+⟩', '|−⟩']);
      drawAxis({ x: 0, y: 1, z: 0 }, '#8b6cff', ['|+i⟩', '|−i⟩']);
      drawAxis({ x: 0, y: 0, z: 1 }, '#ff7ad6', ['|0⟩', '|1⟩']);

      // state vector — slowly precesses
      const t = (now - t0) / 1000;
      const theta = Math.PI / 3 + Math.sin(t * 0.3) * 0.2;
      const phi   = t * 0.5;
      drawStateVector(theta, phi);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ── background canvas: a slow quantum-circuit field ── */
  const canvas = document.getElementById('bg-canvas');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || reduced) return;

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;

  const WIRE_GAP    = 90;     // vertical spacing between qubit lines
  const SPEED       = 0.25;   // px / frame drift to the left
  const GATE_SIZE   = 26;
  const SPAWN_EVERY = 75;     // frames between gate spawns

  let wires = [];             // y positions
  const gates = [];           // {x, wire, kind, color, alpha}
  let frameCount = 0;

  // gate kinds available; CNOT pairs are spawned specially below
  const GATE_KINDS = ['H', 'X', 'Y', 'Z', 'T', 'S', 'R'];
  const PALETTE = {
    H: [92, 240, 255],     // cyan
    X: [255, 122, 214],    // magenta
    Y: [139, 108, 255],    // violet
    Z: [255, 122, 214],
    T: [139, 108, 255],
    S: [92, 240, 255],
    R: [255, 209, 102],    // warm amber for rotation
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth = window.innerWidth;
    H = canvas.clientHeight = window.innerHeight;
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // compute wire y positions, leaving a bit of margin top/bottom
    wires = [];
    const usableH = H - 60;
    const count = Math.max(4, Math.floor(usableH / WIRE_GAP));
    const startY = (H - (count - 1) * WIRE_GAP) / 2;
    for (let i = 0; i < count; i++) wires.push(startY + i * WIRE_GAP);
  }

  function spawnGate() {
    // 18% chance of spawning a CNOT, otherwise a single-qubit gate
    if (Math.random() < 0.18 && wires.length >= 3) {
      const i = Math.floor(Math.random() * wires.length);
      let j = i + (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2));
      j = Math.max(0, Math.min(wires.length - 1, j));
      if (j === i) return;
      gates.push({
        x: W + GATE_SIZE, kind: 'CNOT',
        ctrl: i, target: j,
        color: [92, 240, 255], alpha: 0,
      });
    } else {
      const kind = GATE_KINDS[Math.floor(Math.random() * GATE_KINDS.length)];
      const wire = Math.floor(Math.random() * wires.length);
      gates.push({ x: W + GATE_SIZE, wire, kind, color: PALETTE[kind], alpha: 0 });
    }
  }

  function drawWires() {
    ctx.lineWidth = 1;
    for (const y of wires) {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  function drawGate(g) {
    const a = g.alpha;
    const [r, gg, b] = g.color;

    if (g.kind === 'CNOT') {
      const yc = wires[g.ctrl];
      const yt = wires[g.target];
      // vertical link
      ctx.strokeStyle = `rgba(${r},${gg},${b},${a * 0.7})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(g.x, yc); ctx.lineTo(g.x, yt);
      ctx.stroke();
      // control dot
      ctx.fillStyle = `rgba(${r},${gg},${b},${a})`;
      ctx.beginPath();
      ctx.arc(g.x, yc, 4, 0, Math.PI * 2);
      ctx.fill();
      // ⊕ on target
      ctx.strokeStyle = `rgba(${r},${gg},${b},${a})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(g.x, yt, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(g.x - 8, yt); ctx.lineTo(g.x + 8, yt);
      ctx.moveTo(g.x, yt - 8); ctx.lineTo(g.x, yt + 8);
      ctx.stroke();
      return;
    }

    const y = wires[g.wire];

    // single-qubit gate box
    const s = GATE_SIZE;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = `rgba(${r},${gg},${b},0.12)`;
    ctx.strokeStyle = `rgba(${r},${gg},${b},0.85)`;
    ctx.lineWidth = 1;
    const rd = 4;
    ctx.beginPath();
    ctx.moveTo(g.x - s/2 + rd, y - s/2);
    ctx.arcTo(g.x + s/2, y - s/2, g.x + s/2, y + s/2, rd);
    ctx.arcTo(g.x + s/2, y + s/2, g.x - s/2, y + s/2, rd);
    ctx.arcTo(g.x - s/2, y + s/2, g.x - s/2, y - s/2, rd);
    ctx.arcTo(g.x - s/2, y - s/2, g.x + s/2, y - s/2, rd);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(${r},${gg},${b},1)`;
    ctx.font = '600 12px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g.kind, g.x, y + 1);
    ctx.restore();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawWires();

    // spawn
    frameCount++;
    if (frameCount % SPAWN_EVERY === 0) spawnGate();

    // update + draw
    for (let i = gates.length - 1; i >= 0; i--) {
      const g = gates[i];
      g.x -= SPEED;
      if (g.alpha < 0.7) g.alpha = Math.min(0.7, g.alpha + 0.01);
      if (g.x < -GATE_SIZE - 4) gates.splice(i, 1);
    }
    for (const g of gates) drawGate(g);

    requestAnimationFrame(frame);
  }

  resize();
  frame();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
})();
