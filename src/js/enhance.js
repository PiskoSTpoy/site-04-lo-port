// Волна 10 — премиум-полировка: параллакс портовой иллюстрации + scroll-reveal.
// Волна 12 — a11y: доводка мобильного меню.
// Волна 16 — блок паузы бегущей строки удалён вместе с самой строкой.
// Все блоки независимы друг от друга и от calculator.js — если один упадёт, другие отработают.

(function mobileNav() {
  // Само раскрытие — нативный <details>, он работает и без JS.
  // Здесь только то, чего <details> не умеет: Esc и клик вне панели.
  var nav = document.querySelector('[data-nav-mobile]');
  if (!nav) return;
  var summary = nav.querySelector('summary');

  function close(returnFocus) {
    if (!nav.open) return;
    nav.open = false;
    if (returnFocus && summary) summary.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') close(true);
  });

  document.addEventListener('click', function (e) {
    if (!nav.open) return;
    if (nav.contains(e.target)) {
      // клик по ссылке внутри панели: на якорь той же страницы навигации не будет — закрываем сами
      if (e.target.closest('a')) close(false);
      return;
    }
    close(false);
  });
})();

(function heroParallax() {
  var wrap = document.querySelector('.hero-illustration');
  var svg = document.querySelector('.hero-illustration__svg');
  if (!wrap || !svg) return;

  var MAX_SHIFT_X = 10; // px, от курсора
  var MAX_SHIFT_Y = 6;  // px, от курсора
  var SCROLL_SHIFT = 14; // px, от скролла
  var LERP = 0.08; // демпфирование

  var reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var targetX = 0, targetY = 0, curX = 0, curY = 0, scrollShift = 0;
  var raf = null;

  function onPointerMove(e) {
    var rect = wrap.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    var relX = (e.clientX - rect.left) / rect.width - 0.5;
    var relY = (e.clientY - rect.top) / rect.height - 0.5;
    targetX = Math.max(-0.5, Math.min(0.5, relX)) * (MAX_SHIFT_X * 2);
    targetY = Math.max(-0.5, Math.min(0.5, relY)) * (MAX_SHIFT_Y * 2);
  }

  function onScroll() {
    var rect = wrap.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    // progress: 0 когда блок у нижнего края экрана, 1 когда у верхнего
    var progress = 1 - Math.max(0, Math.min(1, rect.top / vh));
    scrollShift = (progress - 0.5) * SCROLL_SHIFT;
  }

  function tick() {
    curX += (targetX - curX) * LERP;
    curY += (targetY - curY) * LERP;
    var totalY = curY + scrollShift;
    svg.style.transform = 'translate3d(' + curX.toFixed(2) + 'px,' + totalY.toFixed(2) + 'px,0)';
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (raf) return;
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    document.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('scroll', onScroll);
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    targetX = targetY = curX = curY = scrollShift = 0;
    svg.style.transform = '';
  }

  function applyMotionPreference() {
    if (reduceMotionMQ.matches) {
      stop();
    } else {
      start();
    }
  }

  applyMotionPreference();
  // live-listener: пользователь может переключить "уменьшить движение" в системе прямо во время сессии
  if (typeof reduceMotionMQ.addEventListener === 'function') {
    reduceMotionMQ.addEventListener('change', applyMotionPreference);
  } else if (typeof reduceMotionMQ.addListener === 'function') {
    // старый Safari
    reduceMotionMQ.addListener(applyMotionPreference);
  }
})();

(function scrollReveal() {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  var reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotionMQ.matches) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var revealed = new WeakSet();
  function revealEl(el, delayMs) {
    if (revealed.has(el)) return;
    revealed.add(el);
    if (delayMs) {
      setTimeout(function () { el.classList.add('is-visible'); }, delayMs);
    } else {
      el.classList.add('is-visible');
    }
  }

  if (!('IntersectionObserver' in window)) {
    // фолбэк для окружений без IO — сразу показываем всё
    els.forEach(function (el) { revealEl(el); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
        return c.classList.contains('reveal');
      });
      var idx = siblings.indexOf(el);
      var stagger = Math.max(idx, 0) * 80; // 80ms между соседями в одной группе
      revealEl(el, stagger);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  els.forEach(function (el) { io.observe(el); });

  // fallback-таймаут: если IO по какой-то причине не сработал (редкий баг браузера,
  // элемент уже вне области видимости при загрузке и т.п.) — не дать контенту остаться невидимым навсегда
  setTimeout(function () {
    els.forEach(function (el) { revealEl(el); });
  }, 4000);
})();
