// 3D-тилт для фото-карточек парка на главной (.park-card--photo).
// Первый и единственный тилт-механизм на сайте — проверено grep по src/
// перед тем, как писать этот файл. Самоограничивается через "if (!cards.length) return",
// как и остальные фиче-скрипты сайта (calculator.js, lead-form.js): на
// страницах без .park-card--photo этот файл не делает вообще ничего.
//
// Угол считает JS по позиции курсора внутри карточки и пишет его в CSS-
// переменные --tilt-x/--tilt-y на самом элементе; CSS (main.css,
// a.park-card--photo:hover) применяет их через perspective(800px) rotateX()
// rotateY() только в hover/focus-состоянии. Слушатели mousemove вешаются
// ТОЛЬКО на сами карточки (не на document) — «дорогого» глобального
// обработчика нет. Отключается на touch (pointer:coarse) и при
// prefers-reduced-motion — оба гейта проверяются явно в JS (слушатели вообще
// не навешиваются), а не только в CSS main.css дублирует это @media-правилом
// на случай, если --tilt-* уже записаны в inline-стиль до переключения
// настройки в реальном времени.
(function initCardTilt() {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.park-card--photo'));
  if (!cards.length) return;

  var MAX_DEG = 8; // в пределах требуемых 5–10°

  var reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointerMQ = window.matchMedia('(pointer: fine)');
  var attached = false;

  function onMove(e) {
    var card = e.currentTarget;
    var rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var px = (e.clientX - rect.left) / rect.width;  // 0..1
    var py = (e.clientY - rect.top) / rect.height;  // 0..1
    // Курсор у правого края → карточка поворачивается правым краем от зрителя:
    // смещение от центра по каждой оси, нормированное в -1..1 и умноженное на
    // предельный угол.
    card.style.setProperty('--tilt-y', ((px - 0.5) * 2 * MAX_DEG).toFixed(2) + 'deg');
    card.style.setProperty('--tilt-x', ((0.5 - py) * 2 * MAX_DEG).toFixed(2) + 'deg');
  }

  function reset(card) {
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
  }

  function onLeave(e) { reset(e.currentTarget); }

  function attach() {
    if (attached) return;
    attached = true;
    cards.forEach(function (c) {
      c.addEventListener('mousemove', onMove);
      c.addEventListener('mouseleave', onLeave);
    });
  }

  function detach() {
    if (!attached) return;
    attached = false;
    cards.forEach(function (c) {
      c.removeEventListener('mousemove', onMove);
      c.removeEventListener('mouseleave', onLeave);
      reset(c);
    });
  }

  function evaluate() {
    if (reduceMotionMQ.matches || !finePointerMQ.matches) detach();
    else attach();
  }

  evaluate();
  // live-listener: пользователь может переключить "уменьшить движение" или
  // подключить/отключить мышь прямо во время сессии (та же схема, что у
  // heroParallax в enhance.js, включая фоллбэк для старого Safari).
  if (typeof reduceMotionMQ.addEventListener === 'function') {
    reduceMotionMQ.addEventListener('change', evaluate);
    finePointerMQ.addEventListener('change', evaluate);
  } else if (typeof reduceMotionMQ.addListener === 'function') {
    reduceMotionMQ.addListener(evaluate);
    finePointerMQ.addListener(evaluate);
  }
})();
