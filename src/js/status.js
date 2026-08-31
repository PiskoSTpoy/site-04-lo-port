/* status.js — пересчитывает виджет статуса на РЕАЛЬНОЕ «сегодня» пользователя.
 *
 * Без JS в разметке остаётся статус на дату сборки — он корректный, просто может
 * отстать. Скрипт ничего не выдумывает: берёт ту же функцию statusFor из
 * season-logic.js, что и сборка, и переписывает четыре текстовых узла.
 * Если season-logic не загрузился — молча выходим, разметка остаётся валидной.
 */
(function () {
  "use strict";

  var logic = window.SeasonLogic;
  if (!logic) return;

  var panels = document.querySelectorAll("[data-status-panel]");
  if (!panels.length) return;

  var status = logic.statusFor(new Date());

  Array.prototype.forEach.call(panels, function (panel) {
    var set = function (sel, text) {
      var el = panel.querySelector(sel);
      if (el && text) el.textContent = text;
    };
    set("[data-status-date]", status.dateHuman);
    set("[data-status-headline]", status.headline);
    set("[data-status-detail]", status.detail);
    set("[data-status-limit]", status.limit);
    panel.setAttribute("data-state", status.state);
  });

  // Подсветка текущего месяца в годовой полосе — только если год совпал с годом приказа.
  var now = new Date();
  if (now.getFullYear() === logic.data.year) {
    var cells = document.querySelectorAll("[data-month]");
    Array.prototype.forEach.call(cells, function (cell) {
      var isNow = Number(cell.getAttribute("data-month")) === now.getMonth() + 1;
      cell.classList.toggle("is-now", isNow);
      if (isNow) cell.setAttribute("aria-current", "date");
      else cell.removeAttribute("aria-current");
    });
  }
})();
