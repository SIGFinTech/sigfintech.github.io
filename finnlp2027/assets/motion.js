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

  // ---------- Kyoto scene: Daimonji embers, parallax ridges, lanterns ----------
  const scene = head.querySelector('.scene');
  const cv = document.createElement('canvas'); cv.className = 'petal-canvas'; cv.setAttribute('aria-hidden', 'true');
  head.prepend(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0;
  const size = () => { const dpr = Math.min(devicePixelRatio || 1, 2); W = head.clientWidth; H = head.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);
  const rnd = (a, b) => a + Math.random() * (b - a);
  // where the 大 sits, in header pixels
  const fire = () => {
    const d = scene && scene.querySelector('.daimonji');
    if (!d) return [W * .8, H * .5, 30];
    const r = d.getBoundingClientRect(), h = head.getBoundingClientRect();
    return [r.left - h.left + r.width / 2, r.top - h.top + r.height / 2, r.width / 2];
  };
  const embers = [], MAX = innerWidth < 700 ? 22 : 46;
  const spawn = (x, y, burst = 0) => {
    const [fx, fy, fr] = fire();
    const z = rnd(.5, 1.2);
    embers.push({ x: x ?? fx + rnd(-fr, fr), y: y ?? fy + rnd(-fr * .6, fr * .6), z, r: rnd(.6, 1.4) * z,
      vx: rnd(-.15, .15) + burst * rnd(-1.6, 1.6), vy: -rnd(.25, .7) * z - burst * rnd(.4, 1.8),
      life: 0, max: rnd(140, 260), ph: rnd(0, 6.28), hue: rnd(14, 38) });
  };
  let wind = 0, windT = 0, px = -1, py = -1, last = 0, run = true, acc = 0;
  head.addEventListener('pointermove', e => {
    const r = head.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (px >= 0) windT += (x - px) * .01;
    px = x; py = y;
    // lanterns warm up as the cursor nears the pagoda
    if (scene) { const pg = scene.querySelector('.pagoda').getBoundingClientRect();
      scene.classList.toggle('lit', Math.hypot(e.clientX - (pg.left + pg.width / 2), e.clientY - (pg.top + pg.height / 2)) < 140); }
  });
  head.addEventListener('pointerleave', () => { px = py = -1; scene && scene.classList.remove('lit'); });
  head.addEventListener('click', e => {
    if (e.target.closest('a, button')) return;
    const r = head.getBoundingClientRect();
    for (let i = 0; i < 18; i++) spawn(e.clientX - r.left, e.clientY - r.top, 1);
  });
  // gentle depth: layers drift at different rates with scroll and cursor
  const layers = scene ? [['.ridge-far', .06, 6], ['.daimonji', .06, 6], ['.ridge-near', .12, 10], ['.town', .18, 14], ['.pagoda', .18, 14]]
    .map(([s, k, m]) => [scene.querySelector(s), k, m]).filter(l => l[0]) : [];
  let mx = 0;
  head.addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; });
  const parallax = () => layers.forEach(([el, k, m]) => { el.style.transform = `translate(${(-mx * m).toFixed(1)}px, ${(Math.min(scrollY, 500) * k).toFixed(1)}px)`; });
  addEventListener('scroll', parallax, { passive: true });
  new IntersectionObserver(([e]) => { run = e.isIntersecting; if (run) requestAnimationFrame(tick); }).observe(head);
  document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) requestAnimationFrame(tick); });

  function tick(t) {
    if (!run) return;
    const dt = Math.min(48, t - (last || t)); last = t;
    windT *= .95; wind += ((.05 + windT) - wind) * .05;
    acc += dt; if (acc > 120 && embers.length < MAX) { acc = 0; spawn(); }
    parallax();
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = embers.length - 1; i >= 0; i--) {
      const p = embers[i]; p.life += dt / 16; p.ph += .12;
      p.vx += (wind * p.z - p.vx) * .03 + Math.sin(p.ph * .4) * .01;
      p.vy += (-.45 * p.z - p.vy) * .01;
      if (px >= 0) { const dx = p.x - px, dy = p.y - py, d2 = dx * dx + dy * dy;
        if (d2 < 4900) { const f = (1 - d2 / 4900) * .25; p.vx += dx / 70 * f; p.vy += dy / 70 * f; } }
      p.x += p.vx * dt / 16; p.y += p.vy * dt / 16;
      const k = p.life / p.max;
      if (k >= 1 || p.y < -10) { embers.splice(i, 1); continue; }
      const flick = .65 + .35 * Math.sin(p.ph * 2.3), a = Math.sin(Math.PI * Math.min(1, k * 1.2)) * flick * (.45 + .5 * p.z);
      const R = p.r * (2.2 - k);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R * 2.4);
      g.addColorStop(0, `hsla(${p.hue + 12}, 100%, 72%, ${a})`);
      g.addColorStop(.35, `hsla(${p.hue}, 95%, 55%, ${a * .55})`);
      g.addColorStop(1, `hsla(${p.hue - 8}, 90%, 45%, 0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, R * 2.4, 0, 6.29); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(tick);
  }
  setTimeout(() => { for (let i = 0; i < 12; i++) spawn(); requestAnimationFrame(tick); }, 1600);   // after the 大 is drawn
})();
