'use strict';

/* ===== CONFIG (EDIT personal details here) ===== */
const CONFIG = { email: 'hello@kavinraj.dev', autoplayMs: 6000 };

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== Toast ===== */
const Toast = {
  show(msg, type = 'ok') {
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'error' : ''}`;
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 3200);
  }
};

/* ===== Loader ===== */
function initLoader() {
  const hide = () => $('#loader').classList.add('done');
  window.addEventListener('load', () => setTimeout(hide, reduceMotion ? 0 : 500));
  setTimeout(hide, 3000); // safety net
}

/* ===== Navigation: sticky state, mobile menu, active link ===== */
function initNav() {
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });
  window.addEventListener('resize', () => { if (innerWidth > 768) setMenu(false); });

  const links = $$('.menu a[href^="#"]:not(.btn)');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const update = () => {
    nav.classList.toggle('scrolled', scrollY > 20);
    const y = scrollY + innerHeight * 0.35;
    let current = null;
    sections.forEach(s => { if (s.offsetTop <= y) current = s.id; });
    links.forEach(a => {
      const on = a.getAttribute('href') === '#' + current;
      a.classList.toggle('active', on);
      on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ===== Scroll progress + back to top ===== */
function initScrollUI() {
  const bar = $('#progress'), top = $('#toTop');
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    top.classList.toggle('show', scrollY > 600);
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  update();
}

/* ===== Reveal, skill bars, counters ===== */
function animateCount(el) {
  const target = +el.dataset.count, suffix = el.dataset.suffix || '';
  if (reduceMotion) { el.textContent = target + suffix; return; }
  const dur = 1600, start = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      target.classList.add('in');
      const bar = $('.bar', target);
      if (bar) $('i', bar).style.width = bar.dataset.level + '%';
      $$('[data-count]', target).forEach(animateCount);
      io.unobserve(target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(el); });
}

/* ===== Card spotlight + cursor glow ===== */
function initHover() {
  $$('.spot').forEach(card => card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', e.clientX - r.left + 'px');
    card.style.setProperty('--my', e.clientY - r.top + 'px');
  }));
  const glow = $('#cursorGlow');
  if (matchMedia('(hover:hover)').matches && !reduceMotion) {
    window.addEventListener('pointermove', e => {
      glow.classList.add('on');
      glow.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
    }, { passive: true });
    document.addEventListener('mouseleave', () => glow.classList.remove('on'));
  }
}

/* ===== Project filter + modal ===== */
function initProjects() {
  const chips = $$('.chip'), cards = $$('.project');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => { c.classList.toggle('active', c === chip); c.setAttribute('aria-pressed', c === chip); });
    const f = chip.dataset.filter;
    cards.forEach(card => {
      const show = f === 'all' || card.dataset.cat === f;
      card.classList.toggle('hide', !show);
      if (show && !reduceMotion) { card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); }
    });
  }));

  const modal = $('#modal'), stack = $('#mStack');
  let lastFocus = null;
  const open = card => {
    lastFocus = document.activeElement;
    const d = card.dataset, thumb = $('.thumb', card);
    $('#mTitle').textContent = d.title;
    $('#mDesc').textContent = d.desc;
    $('#mLive').href = d.live; $('#mCode').href = d.code;
    stack.innerHTML = '';
    d.stack.split(',').forEach(t => { const li = document.createElement('li'); li.textContent = t.trim(); stack.appendChild(li); });
    const mt = $('#mThumb');
    mt.style.cssText = thumb.getAttribute('style') || '';
    mt.innerHTML = thumb.innerHTML;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#mClose').focus();
  };
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  cards.forEach(card => {
    card.addEventListener('click', () => open(card));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); } });
  });
  $('#mClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // simple focus trap
      const f = $$('button,a[href]', modal), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ===== Testimonial carousel ===== */
function initCarousel() {
  const box = $('#carousel'), track = $('#slides'), slides = $$('.slide', track), dotsWrap = $('#dots');
  let i = 0, timer;
  slides.forEach((_, n) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', `Go to testimonial ${n + 1}`);
    b.addEventListener('click', () => { go(n); restart(); });
    dotsWrap.appendChild(b);
  });
  const go = n => {
    i = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${i * 100}%)`;
    slides.forEach((s, k) => s.setAttribute('aria-hidden', k !== i));
    $$('button', dotsWrap).forEach((d, k) => d.classList.toggle('active', k === i));
  };
  const stop = () => clearInterval(timer);
  const restart = () => { stop(); if (!reduceMotion) timer = setInterval(() => go(i + 1), CONFIG.autoplayMs); };
  $('#prev').addEventListener('click', () => { go(i - 1); restart(); });
  $('#next').addEventListener('click', () => { go(i + 1); restart(); });
  box.addEventListener('mouseenter', stop);
  box.addEventListener('mouseleave', restart);
  box.addEventListener('focusin', stop);
  box.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'ArrowRight') go(i + 1); });
  let x0 = null; // touch swipe
  box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
    x0 = null; restart();
  });
  go(0); restart();
}

/* ===== Marquee: duplicate items for a seamless loop ===== */
function initMarquee() {
  if (reduceMotion) return;
  const track = $('#marquee');
  $$('li', track).forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
}

/* ===== Contact: copy email + validated form ===== */
function initContact() {
  $('#emailLink').textContent = CONFIG.email;
  $('#emailLink').href = 'mailto:' + CONFIG.email;
  $('#copyEmail').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(CONFIG.email); }
    catch {
      const t = document.createElement('textarea'); t.value = CONFIG.email; document.body.appendChild(t);
      t.select(); document.execCommand('copy'); t.remove();
    }
    Toast.show('Email copied to clipboard');
  });

  const form = $('#contactForm');
  const rules = {
    name: v => v.trim().length >= 2 || 'Enter your name (at least 2 characters).',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Enter a valid email, like you@company.com.',
    message: v => v.trim().length >= 10 || 'Write at least 10 characters so I know how to help.'
  };
  const check = input => {
    const res = rules[input.name](input.value), field = input.closest('.field');
    field.classList.toggle('bad', res !== true);
    $('.err', field).textContent = res === true ? '' : res;
    input.setAttribute('aria-invalid', res !== true);
    return res === true;
  };
  $$('input,textarea', form).forEach(inp => {
    inp.addEventListener('blur', () => check(inp));
    inp.addEventListener('input', () => { if (inp.closest('.field').classList.contains('bad')) check(inp); });
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const inputs = $$('input,textarea', form), results = inputs.map(check);
    if (results.includes(false)) {
      inputs[results.indexOf(false)].focus();
      return Toast.show('Fix the highlighted fields and try again.', 'error');
    }
    // EDIT: connect to Formspree/Netlify/your API here. This demo only simulates sending.
    form.reset();
    Toast.show('Message sent. I\'ll reply within two working days.');
  });
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  [initLoader, initNav, initScrollUI, initReveal, initHover, initProjects, initCarousel, initMarquee, initContact].forEach(fn => fn());
});
