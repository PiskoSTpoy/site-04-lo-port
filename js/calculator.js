function initCalculator() {
  const type = document.getElementById('calc-type');
  const season = document.getElementById('calc-season');
  const total = document.getElementById('calc-total');
  const note = document.getElementById('calc-season-note');
  if (!type || !season || !total || !note) return;

  const rates = { avtokran: 4000, gusenichnyy: 6000 };

  function recalc() {
    const rate = rates[type.value];
    const sum = rate * 8;
    total.textContent = 'от ' + sum.toLocaleString('ru-RU') + ' ₽';
    if (season.checked) {
      note.style.display = 'block';
    } else {
      note.style.display = 'none';
    }
  }

  type.addEventListener('change', recalc);
  season.addEventListener('change', recalc);
  recalc();

  initCalculatorWizard(type, season);
}

// Пошаговый визард поверх тех же полей #calc-type / #calc-season.
// Формула и значения расчёта не меняются — визард только переключает шаги
// и синхронизирует реальные поля через .value / .checked + dispatchEvent('change').
function initCalculatorWizard(type, season) {
  const calc = document.getElementById('calculator');
  if (!calc) return;

  const steps = calc.querySelectorAll('.calc__step');
  const dots = calc.querySelectorAll('[data-step-dot]');
  const progressLabel = document.getElementById('calc-progress-label');
  if (!steps.length) return;

  const stepLabels = { 1: 'Тип техники', 2: 'Сезон выезда', 3: 'Результат расчёта' };
  const totalSteps = steps.length;
  let current = 1;

  // Волна 29 (a11y-аудит): у goTo() было два вызывающих сценария с разной семантикой —
  // (а) переход по шагам после клика пользователя (варианты/назад/заново) — фокус ДОЛЖЕН
  // переехать на вопрос нового шага, это помогает незрячим пользователям; и
  // (б) самый первый вызов goTo(1) сразу при загрузке страницы для инициализации разметки —
  // здесь .focus() был багом: он молча уводил фокус клавиатуры с начала документа в середину
  // страницы ДО первого Tab пользователя, из-за чего skip-link становился недостижимым первым
  // Tab'ом и нарушался порядок фокуса (WCAG 2.4.3). moveFocus=false — только для сценария (б).
  function goTo(stepNum, moveFocus) {
    if (moveFocus === undefined) moveFocus = true;
    current = Math.min(Math.max(stepNum, 1), totalSteps);

    steps.forEach(function (el) {
      const n = Number(el.getAttribute('data-step'));
      el.classList.toggle('is-active', n === current);
    });

    dots.forEach(function (el) {
      const n = Number(el.getAttribute('data-step-dot'));
      el.classList.toggle('is-active', n === current);
      el.classList.toggle('is-done', n < current);
    });

    if (progressLabel) {
      progressLabel.textContent = 'Шаг ' + current + ' из ' + totalSteps + ' · ' + stepLabels[current];
    }

    if (!moveFocus) return;

    const activeStep = calc.querySelector('.calc__step[data-step="' + current + '"]');
    if (activeStep) {
      const focusTarget = activeStep.querySelector('.calc__question, .calc__result-label');
      if (focusTarget) {
        focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
      }
    }
  }

  // Выбор варианта — это состояние кнопки, а не разовое действие: держим aria-pressed
  // в синхроне с классом .is-selected, иначе скринридер не сообщает выбранный вариант.
  function select(group, btn) {
    calc.querySelectorAll(group).forEach(function (b) {
      b.classList.remove('is-selected');
      b.setAttribute('aria-pressed', 'false');
    });
    if (btn) {
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
    }
  }

  calc.querySelectorAll('[data-set-type]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      select('[data-set-type]', btn);
      type.value = btn.getAttribute('data-set-type');
      type.dispatchEvent(new Event('change'));
      goTo(2);
    });
  });

  calc.querySelectorAll('[data-set-season]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      select('[data-set-season]', btn);
      season.checked = btn.getAttribute('data-set-season') === '1';
      season.dispatchEvent(new Event('change'));
      goTo(3);
    });
  });

  calc.querySelectorAll('[data-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      goTo(current - 1);
    });
  });

  calc.querySelectorAll('[data-restart]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      select('[data-set-type], [data-set-season]', null);
      goTo(1);
    });
  });

  goTo(1, false); // инициализация разметки при загрузке страницы — фокус трогать нельзя (см. комментарий в goTo)
}

document.addEventListener('DOMContentLoaded', initCalculator);
