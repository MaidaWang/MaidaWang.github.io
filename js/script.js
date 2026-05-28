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

  /* ── background canvas: a soft quantum-network field ─── */
  const canvas = document.getElementById('bg-canvas');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || reduced) return;

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;

  const COUNT = 70;
  const MAX_DIST = 140;
  const points = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth = window.innerWidth;
    H = canvas.clientHeight = window.innerHeight;
    canvas.width  = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    points.length = 0;
    for (let i = 0; i < COUNT; i++) {
      points.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - .5) * 0.25,
        vy: (Math.random() - .5) * 0.25,
        r: Math.random() * 1.4 + 0.6,
        hue: Math.random() < .65 ? 'cyan' : (Math.random() < .5 ? 'violet' : 'magenta'),
      });
    }
  }

  const colors = {
    cyan:    [92, 240, 255],
    violet:  [139, 108, 255],
    magenta: [255, 122, 214],
  };

  function frame() {
    ctx.clearRect(0, 0, W, H);

    // update + draw points
    for (const p of points) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      const c = colors[p.hue];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.55)`;
      ctx.fill();
    }

    // connections
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i], b = points[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MAX_DIST * MAX_DIST) {
          const d = Math.sqrt(d2);
          const alpha = (1 - d / MAX_DIST) * 0.18;
          const c = colors[a.hue];
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(frame);
  }

  resize();
  seed();
  frame();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); seed(); }, 150);
  });
})();
