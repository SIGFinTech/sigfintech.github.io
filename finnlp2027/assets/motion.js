// FinNLP 2027 motion layer: sakura petals with depth and cursor wind, reactive branch,
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

  // ---------- petals ----------
  const branch = head.querySelector('.sakura');
  const cv = document.createElement('canvas'); cv.className = 'petal-canvas'; cv.setAttribute('aria-hidden', 'true');
  head.prepend(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = head.clientWidth; H = head.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);

  const COLORS = [['#fbe3ea', '#f2a7bf'], ['#fdeef3', '#e98aa8'], ['#f8d4df', '#d96f92']];
  const petals = [], MAX = innerWidth < 700 ? 14 : 30;
  const rnd = (a, b) => a + Math.random() * (b - a);
  // spawn near the branch blossoms (in page coords)
  const origin = () => {
    if (branch) { const r = branch.getBoundingClientRect(), h = head.getBoundingClientRect();
      return [r.left - h.left + rnd(.15, .95) * r.width, r.top - h.top + rnd(.1, .7) * r.height]; }
    return [W * rnd(.6, 1), -10];
  };
  const spawn = (x, y, burst = 0) => {
    const z = rnd(.45, 1.25);
    const [ox, oy] = x == null ? origin() : [x, y];
    petals.push({ x: ox, y: oy, z, s: rnd(7, 11) * z, c: COLORS[(Math.random() * 3) | 0],
      vx: rnd(-.6, .1) * z + burst * rnd(-2, 2), vy: rnd(.25, .6) * z + burst * rnd(-1.5, .5),
      rot: rnd(0, 6.28), vr: rnd(-.03, .03), flip: rnd(0, 6.28), vf: rnd(.04, .09), sw: rnd(0, 6.28), life: 0 });
  };

  let wind = 0, windT = 0, px = -1, py = -1, last = 0, run = true;
  head.addEventListener('pointermove', e => {
    const r = head.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (px >= 0) windT += (x - px) * .012;
    px = x; py = y;
  });
  head.addEventListener('pointerleave', () => { px = py = -1; });
  head.addEventListener('click', e => {
    if (e.target.closest('a, button')) return;
    const r = head.getBoundingClientRect();
    for (let i = 0; i < 9; i++) spawn(e.clientX - r.left, e.clientY - r.top, 1);
  });
  if (branch) {
    // a branch you can brush: it shivers and lets go of a few petals
    const shake = () => { branch.classList.remove('gust'); void branch.offsetWidth; branch.classList.add('gust');
      for (let i = 0; i < 6; i++) spawn(); windT -= .6; };
    branch.style.pointerEvents = 'auto';
    branch.addEventListener('pointerenter', shake);
    branch.addEventListener('animationend', () => branch.classList.remove('gust'));
  }
  addEventListener('scroll', () => {
    if (branch) branch.style.translate = `0 ${Math.min(scrollY, 400) * .18}px`;
  }, { passive: true });
  new IntersectionObserver(([e]) => { run = e.isIntersecting; if (run) requestAnimationFrame(tick); }).observe(head);
  document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) requestAnimationFrame(tick); });

  const draw = p => {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.scale(Math.cos(p.flip) * .9 + .1 * Math.sign(Math.cos(p.flip) || 1), 1);   // 3D flutter
    const s = p.s, g = ctx.createLinearGradient(-s, -s, s, s);
    g.addColorStop(0, p.c[0]); g.addColorStop(1, p.c[1]);
    ctx.globalAlpha = Math.min(1, p.life / 30) * (.35 + .55 * Math.min(p.z, 1));
    ctx.fillStyle = g;
    ctx.beginPath();                                   // notched sakura petal
    ctx.moveTo(0, s); ctx.bezierCurveTo(-s * .95, s * .3, -s * .7, -s * .85, -s * .18, -s);
    ctx.lineTo(0, -s * .72); ctx.lineTo(s * .18, -s);
    ctx.bezierCurveTo(s * .7, -s * .85, s * .95, s * .3, 0, s); ctx.fill();
    ctx.restore();
  };
  let acc = 0;
  function tick(t) {
    if (!run) return;
    const dt = Math.min(48, t - (last || t)); last = t;
    windT *= .96; wind += ((-.15 + windT) - wind) * .05;
    acc += dt; if (acc > 380 && petals.length < MAX) { acc = 0; spawn(); }
    ctx.clearRect(0, 0, W, H);
    petals.sort((a, b) => a.z - b.z);
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i]; p.life++;
      p.sw += .02; p.flip += p.vf; p.rot += p.vr;
      p.vx += (wind * p.z - p.vx) * .02; p.vy += (.55 * p.z - p.vy) * .015;
      if (px >= 0) { const dx = p.x - px, dy = p.y - py, d2 = dx * dx + dy * dy;      // cursor pushes petals aside
        if (d2 < 6400) { const f = (1 - d2 / 6400) * .35; p.vx += dx / 80 * f; p.vy += dy / 80 * f; } }
      p.x += (p.vx + Math.sin(p.sw) * .45 * p.z) * dt / 16; p.y += p.vy * dt / 16;
      if (p.y > H + 20 || p.x < -30 || p.x > W + 30) { petals.splice(i, 1); continue; }
      draw(p);
    }
    requestAnimationFrame(tick);
  }
  for (let i = 0; i < 6; i++) { spawn(); petals[i].y += rnd(0, H * .6); petals[i].life = 30; }
  requestAnimationFrame(tick);
})();
