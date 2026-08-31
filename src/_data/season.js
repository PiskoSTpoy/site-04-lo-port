// Данные календаря ограничений для шаблонов 11ty.
// Логика и цифры лежат в src/js/season-logic.js — том же файле, который грузит браузер.
// Здесь только «развернуть на дату сборки», чтобы страница была осмысленной без JS.
const logic = require("../js/season-logic.js");

module.exports = () => {
  const data = logic.data;
  return {
    ...data,
    // статус на момент сборки — фолбэк для no-JS и для краулера
    today: logic.statusFor(new Date()),
    // текущий месяц/год на момент сборки — для подсветки ячейки годовой полосы без JS
    nowMonth: new Date().getMonth() + 1,
    nowYear: new Date().getFullYear()
  };
};
