// Волна 11 — UX-элементы статей блога:
//   1) reading-progress: тонкая полоса вверху, transform:scaleX по прогрессу скролла внутри <article>
//   2) ToC active highlight: подсветка текущего h2 через IntersectionObserver
// Оба блока изолированы; сломался один — второй работает.
// Related-posts генерируется на этапе билда 11ty (статичный HTML), JS для него не требуется.

(function markJsReady() {
  // Помечаем корневой элемент — reading-progress по умолчанию display:none и показывается только при .js
  document.documentElement.classList.add("js");
})();

(function readingProgress() {
  var wrap = document.querySelector(".reading-progress");
  var bar = wrap && wrap.querySelector(".reading-progress__bar");
  var article = document.querySelector("main article");
  if (!wrap || !bar || !article) return;

  var reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotionMQ.matches) {
    // Без transition — value скачет сразу, но сам индикатор остаётся полезным
    bar.style.transition = "none";
  }

  var raf = null;
  function measure() {
    raf = null;
    var rect = article.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    // Прогресс: 0 когда начало article ниже верха viewport, 1 когда конец article достиг верха viewport.
    var total = rect.height - vh;
    var scrolled = -rect.top;
    var p = 0;
    if (total > 0) {
      p = scrolled / total;
    } else {
      p = 1; // если статья короче экрана — считаем целиком прочитанной
    }
    if (p < 0) p = 0;
    if (p > 1) p = 1;
    bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
  }

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(measure);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  measure();
})();

(function tocActiveHighlight() {
  var links = document.querySelectorAll("[data-toc-link]");
  if (!links.length) return;
  var byId = {};
  links.forEach(function (a) {
    var id = a.getAttribute("data-toc-link");
    if (id) {
      (byId[id] = byId[id] || []).push(a);
    }
  });
  var headings = [];
  Object.keys(byId).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) headings.push(el);
  });
  if (!headings.length) return;

  function setActive(id) {
    links.forEach(function (a) {
      var isActive = a.getAttribute("data-toc-link") === id;
      a.classList.toggle("is-active", isActive);
    });
  }

  if (!("IntersectionObserver" in window)) {
    // Фолбэк: подсветить первый заголовок и не мешать
    setActive(headings[0].id);
    return;
  }

  var currentId = null;
  var visible = new Set();

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visible.add(entry.target);
        } else {
          visible.delete(entry.target);
        }
      });
      // Выбираем самый верхний из видимых
      if (visible.size) {
        var top = null;
        visible.forEach(function (el) {
          if (!top || el.getBoundingClientRect().top < top.getBoundingClientRect().top) {
            top = el;
          }
        });
        if (top && top.id !== currentId) {
          currentId = top.id;
          setActive(currentId);
        }
      } else {
        // Никого не видно — определить ближайший сверху
        var above = null;
        for (var i = 0; i < headings.length; i++) {
          var r = headings[i].getBoundingClientRect();
          if (r.top < 0) above = headings[i];
        }
        if (above && above.id !== currentId) {
          currentId = above.id;
          setActive(currentId);
        }
      }
    },
    { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
  );

  headings.forEach(function (h) {
    io.observe(h);
  });
})();
