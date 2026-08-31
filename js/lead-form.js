// lead-form.js — отправка формы заявки (#order-form на главной) на обработчик
// заявок КРАН-ЛО. Обработчик принимает JSON и отвечает {"ok":true} — по этому
// полю ниже и определяется успех, статус 200 сам по себе успехом не считается.
//
// Поля формы: имя/компания (name), телефон (phone, обязателен), район/адрес
// объекта (district). Поля "комментарий" на сайте нет, поэтому третье поле
// уходит в payload под своим именем district, а не подменяется на comment.

const LEAD_ENDPOINT = 'https://kran-network-leads.kran-network-leads.workers.dev/submit'; // рабочий адрес обработчика, не заглушка

(function leadForm() {
  const form = document.getElementById('order-form');
  if (!form) return;

  const nameField = document.getElementById('order-name');
  const phone = document.getElementById('order-phone');
  const district = document.getElementById('order-district');
  const honeypot = document.getElementById('order-website');
  const consent = document.getElementById('order-consent');
  const consentError = document.getElementById('order-consent-error');
  const error = document.getElementById('order-phone-error');
  const status = document.getElementById('order-status');
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabelDefault = submitBtn ? submitBtn.textContent : '';

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
    phone.setAttribute('aria-invalid', 'true');
    status.textContent = '';
    phone.focus();
  }

  function clearError() {
    error.textContent = '';
    error.hidden = true;
    phone.removeAttribute('aria-invalid');
  }

  phone.addEventListener('input', function () {
    if (phone.getAttribute('aria-invalid') === 'true') clearError();
  });

  function showConsentError() {
    if (!consentError) return;
    consentError.textContent = 'Без согласия на обработку данных мы не имеем права перезвонить.';
    consentError.hidden = false;
    consent.setAttribute('aria-invalid', 'true');
    status.textContent = '';
    consent.focus();
  }

  function clearConsentError() {
    if (!consentError) return;
    consentError.textContent = '';
    consentError.hidden = true;
    consent.removeAttribute('aria-invalid');
  }

  if (consent) {
    consent.addEventListener('change', function () {
      if (consent.checked) clearConsentError();
    });
  }

  function setSending(isSending) {
    if (!submitBtn) return;
    submitBtn.disabled = isSending;
    submitBtn.textContent = isSending ? 'Отправляем…' : submitLabelDefault;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot. Поле спрятано от глаз и от скринридеров, tabindex="-1" — человек
    // физически не может его заполнить, значит заполнено оно роботом. Отправку
    // отбрасываем МОЛЧА: боту показываем ровно тот же успешный ответ, что и
    // человеку, иначе он поймёт, что попался, и обойдёт ловушку со следующего раза.
    if (honeypot && honeypot.value.trim() !== '') {
      status.textContent = 'Заявка отправлена, мы перезвоним.';
      form.reset();
      return;
    }

    var digits = (phone.value.match(/\d/g) || []).length;
    if (!phone.value.trim()) {
      showError('Укажите телефон — без него мы не сможем перезвонить.');
      return;
    }
    if (digits < 10) {
      showError('В номере не хватает цифр: нужно минимум 10, например +7 (900) 000-00-00.');
      return;
    }
    if (digits > 15) {
      showError('В номере слишком много цифр — максимум 15. Проверьте номер, например +7 (900) 000-00-00.');
      return;
    }
    clearError();

    // Согласие проверяется ПОСЛЕ телефона: у чекбокса стоит required, поэтому
    // до сюда доходят только те отправки, где встроенная валидация браузера
    // отключена или обойдена. Своя проверка нужна, чтобы заявка без согласия
    // не ушла на сервер ни при каких условиях.
    if (consent && !consent.checked) {
      showConsentError();
      return;
    }
    clearConsentError();

    var payload = {
      site: 'kranlo',
      name: nameField ? nameField.value.trim() : '',
      phone: phone.value.trim(),
      district: district ? district.value.trim() : '',
      page: location.pathname,
      consent: true, // до сюда доходят только отправки с проставленным согласием
      website: '',   // honeypot: заполненная ловушка отброшена выше, здесь всегда пусто
    };

    setSending(true);
    status.textContent = '';

    // ЗАЩИТА ОТ ОТПРАВКИ ТЕСТОВЫХ ЗАЯВОК В БОЕВОЙ ПРИЁМНИК.
    // Обработчик заявок пересылает заявку живому человеку в мессенджер, и
    // любая проверка формы с машины разработчика доходила до него как
    // настоящий лид: так уже случилось трижды. Ниже запрос физически не
    // уходит, если страница открыта не на боевом домене. Вся остальная логика
    // (статусы, разблокировка кнопки, разбор ответа) работает как обычно —
    // форму можно проверять, не мусоря в переписке.
    const leadRelayFetch = (url, init) => {
      const h = typeof location !== 'undefined' ? location.hostname : '';
      const isLocal =
        /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(h) ||
        h.endsWith('.local') ||
        (typeof location !== 'undefined' && location.protocol === 'file:');
      if (isLocal) {
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true, dryRun: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      return fetch(url, init);
    };
    leadRelayFetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (resp) {
        if (!resp.ok) throw new Error('bad_status');
        return resp.json();
      })
      .then(function (data) {
        if (!data || data.ok !== true) throw new Error('bad_response');
        setSending(false);
        status.textContent = 'Заявка отправлена, мы перезвоним.';
        form.reset();
      })
      .catch(function () {
        // Честно: сеть/сервер могли не сработать — не притворяемся, что заявка ушла.
        setSending(false);
        status.textContent = 'Заявка не отправлена — позвоните: +7 (964) 724-31-76.';
      });
  });
})();
