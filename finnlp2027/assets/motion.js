// FinNLP 2027 motion layer: fireflies over the Kinkaku-ji screen painting,
// headline + scroll reveals, magnetic CTA, tilting cards. No dependencies.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const head = document.querySelector('header.hero, header.page-head');

  // ---------- headline reveal (split into masked words) ----------
  const h1 = head && head.querySelector('h1');
  if (h1 && !reduce) {
    const words = h1.textContent.trim().split(/\s+/);
    h1.innerHTML = words.map((w, i) => `<span class="rv-word"><span style="transition-delay:${120 + i * 55}ms">${w}</span></span>`).join(' ');
    [...head.children].forEach((el, i) => {
      if (el === h1 || el.matches('.sakura, .petal-canvas')) return;
      el.classList.add('rv-fade'); el.style.transitionDelay = `${300 + i * 90}ms`;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => head.classList.add('rv-in')));
  }

  // ---------- section reveals ----------
  const blocks = document.querySelectorAll('section.block');
  blocks.forEach(b => b.querySelectorAll('li, a.org, .cta-card, .dates-table tr, p, .policy-list > *').forEach((el, i) => {
    if (el.closest('li') && el.tagName !== 'LI') return;
    el.classList.add('rv-item'); el.style.setProperty('--i', Math.min(i, 14));
  }));
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); } }),
      { rootMargin: '0px 0px -12% 0px' });
    blocks.forEach(b => io.observe(b));
    // never leave a section hidden that the reader has already passed (anchor jumps, fast scrolls)
    const sweep = () => blocks.forEach(b => { if (b.getBoundingClientRect().top < innerHeight * .9) b.classList.add('rv-in'); });
    addEventListener('scroll', sweep, { passive: true }); addEventListener('hashchange', sweep); sweep();
  } else blocks.forEach(b => b.classList.add('rv-in'));

  // ---------- magnetic CTA ----------
  document.querySelectorAll('.hero-cta').forEach(btn => {
    if (!fine || reduce) return;
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${((e.clientX - r.left) / r.width - .5) * 10}px`);
      btn.style.setProperty('--my', `${((e.clientY - r.top) / r.height - .5) * 8}px`);
    });
    btn.addEventListener('pointerleave', () => { btn.style.setProperty('--mx', '0px'); btn.style.setProperty('--my', '0px'); });
  });

  // ---------- cards: tilt + spotlight ----------
  document.querySelectorAll('a.org, .cta-card, a.committee').forEach(c => {
    if (!fine || reduce) return;
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--ry', `${(x - .5) * 7}deg`); c.style.setProperty('--rx', `${(.5 - y) * 7}deg`);
      c.style.setProperty('--sx', `${x * 100}%`); c.style.setProperty('--sy', `${y * 100}%`);
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  if (!head || reduce) return;

  // ---------- Kinkaku-ji screen: fireflies over the pond ----------
  const cv = document.createElement('canvas'); cv.className = 'petal-canvas'; cv.setAttribute('aria-hidden', 'true');
  head.prepend(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0;
  const size = () => { const dpr = Math.min(devicePixelRatio || 1, 2); W = head.clientWidth; H = head.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  const rnd = (a, b) => a + Math.random() * (b - a);
  // fireflies live over the pond, on the painting's side of the header
  const box = () => [W * .45, H * .3, W * .55, H * .7];
  const flies = [], MAX = innerWidth < 700 ? 9 : 18;
  const spawn = () => {
    const [bx, by, bw, bh] = box();
    flies.push({ x: bx + bw * rnd(.55, 1), y: by + bh * rnd(.45, .85), vx: rnd(-.12, .12), vy: rnd(-.12, .06),
      r: rnd(1.1, 2), ph: rnd(0, 6.28), rate: rnd(.025, .06), life: 0, max: rnd(500, 900), t: rnd(0, 6.28) });
  };
  let last = 0, run = true;
  new IntersectionObserver(([e]) => { run = e.isIntersecting; if (run) requestAnimationFrame(tick); }).observe(head);
  document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) requestAnimationFrame(tick); });

  function tick(t) {
    if (!run) return;
    const dt = Math.min(48, t - (last || t)); last = t;
    if (flies.length < MAX && Math.random() < .02) spawn();
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = flies.length - 1; i >= 0; i--) {
      const f = flies[i]; f.life += dt / 16; f.t += .015; f.ph += f.rate;
      // lazy wandering: steer by a slowly turning heading
      f.vx += Math.cos(f.t * 1.7 + i) * .006; f.vy += Math.sin(f.t * 1.3 + i * 2) * .005;
      f.vx *= .985; f.vy *= .985;
      f.x += f.vx * dt / 16; f.y += f.vy * dt / 16;
      const age = f.life / f.max;
      if (age >= 1 || f.x < -20 || f.x > W + 20 || f.y < -20 || f.y > H + 20) { flies.splice(i, 1); continue; }
      const blink = Math.max(0, Math.sin(f.ph)) ** 2, a = blink * Math.sin(Math.PI * age) * .95;
      if (a < .02) continue;
      const R = f.r * 5;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, R);
      g.addColorStop(0, `rgba(255, 252, 210, ${a})`);
      g.addColorStop(.25, `rgba(232, 236, 120, ${a * .6})`);
      g.addColorStop(1, 'rgba(190, 220, 90, 0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, R, 0, 6.29); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(tick);
  }
  for (let i = 0; i < 8; i++) { spawn(); flies[i].life = rnd(50, 300); }
  requestAnimationFrame(tick);
})();
