/* «Добрый садик» — интерактив страницы */
(() => {
  'use strict';

  // ===== Настройки сайта — ЗАМЕНИТЬ на реальные =====
  const SITE = {
    // Куда отправлять заявки (POST, JSON). Например: Formspree, Make/Zapier webhook, свой PHP-скрипт, amoCRM/Bitrix24 webhook.
    // Если пусто — заявка откроется в WhatsApp с готовым текстом на номер ниже.
    formEndpoint: '',
    whatsapp: '79990000000',
    // Номер счётчика Яндекс.Метрики — тогда клики по кнопкам и заявки станут целями
    metrikaId: null,
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- Цели Метрики ----------
  const goal = (name) => {
    try { if (SITE.metrikaId && typeof window.ym === 'function') window.ym(SITE.metrikaId, 'reachGoal', name); } catch (e) { /* ignore */ }
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-goal]');
    if (el) goal(el.dataset.goal);
  });

  // ---------- Шапка и мобильное меню ----------
  const header = $('.header');
  const burger = $('.burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    if (!nav || !burger) return;
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };
  burger && burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav && nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => {
    if (nav && nav.classList.contains('is-open') && !e.target.closest('.header')) setMenu(false);
  });

  const onScroll = () => { header && header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Появление блоков ----------
  $$('.cards-3, .numbers, .faq, .timeline').forEach((group) => {
    Array.from(group.children).forEach((child, i) => { child.style.transitionDelay = `${Math.min(i, 6) * 70}ms`; });
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const el = en.target;
          el.classList.add('is-visible');
          io.unobserve(el);
          // после появления убираем задержку, чтобы ховеры срабатывали сразу
          setTimeout(() => { el.style.transitionDelay = ''; }, 1400);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('is-visible'));
  }

  // ---------- Счётчики ----------
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (!target || reduceMotion) return;
    const dur = 1300;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((el) => cio.observe(el));
  }

  // ---------- Круг режима дня ----------
  const wheel = $('.wheel');
  if (wheel) {
    const segs = $$('.seg', wheel);
    const items = $$('.timeline li');
    const timeEl = $('.wheel-time', wheel);
    const labelEl = $('.wheel-label', wheel);
    const def = { time: timeEl.textContent, label: labelEl.textContent };
    const short = { 1: 'Утренний круг', 2: 'Завтрак', 3: 'Прогулка', 4: 'Обед', 5: 'Тихий час', 6: 'Полдник и творчество', 7: 'Вечерний круг' };
    const times = {};
    items.forEach((li) => { times[li.dataset.seg] = $('.tl-time', li).textContent.replace(/\s/g, ''); });

    const activate = (n) => {
      wheel.classList.toggle('has-active', Boolean(n));
      segs.forEach((s) => s.classList.toggle('is-active', s.dataset.seg === n));
      items.forEach((li) => li.classList.toggle('is-active', li.dataset.seg === n));
      timeEl.textContent = n ? times[n] : def.time;
      labelEl.textContent = n ? short[n] : def.label;
    };
    items.forEach((li) => {
      li.addEventListener('mouseenter', () => activate(li.dataset.seg));
      li.addEventListener('mouseleave', () => activate(null));
      li.addEventListener('focus', () => activate(li.dataset.seg));
      li.addEventListener('blur', () => activate(null));
    });
    segs.forEach((s) => {
      s.addEventListener('mouseenter', () => activate(s.dataset.seg));
      s.addEventListener('mouseleave', () => activate(null));
      s.addEventListener('click', () => {
        const li = items.find((x) => x.dataset.seg === s.dataset.seg);
        if (li) li.focus({ preventScroll: false });
      });
    });
  }

  // ---------- Карусель отзывов ----------
  const car = $('.carousel');
  const carNav = $('.carousel-nav');
  if (car && carNav) {
    const update = () => { carNav.hidden = car.scrollWidth <= car.clientWidth + 4; };
    $$('button', carNav).forEach((b) => {
      b.addEventListener('click', () => {
        const slide = car.firstElementChild;
        const step = slide ? slide.getBoundingClientRect().width + 20 : car.clientWidth;
        car.scrollBy({ left: Number(b.dataset.dir) * step, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
    window.addEventListener('resize', update);
    update();
  }

  // ---------- Подсветка текущего раздела в меню ----------
  const links = $$('.nav a[href^="#"]:not(.btn)');
  if ('IntersectionObserver' in window && links.length) {
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const a = map.get(en.target.id);
        if (a && en.isIntersecting) { links.forEach((l) => l.classList.remove('is-current')); a.classList.add('is-current'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) sio.observe(s); });
  }

  // ---------- Мобильная панель записи ----------
  const bar = $('.mobile-bar');
  const hero = $('.hero');
  const zapis = $('#zapis');
  if (bar && hero && 'IntersectionObserver' in window) {
    let heroVisible = true; let formVisible = false;
    const sync = () => bar.classList.toggle('is-visible', !heroVisible && !formVisible);
    new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; sync(); }, { threshold: 0.05 }).observe(hero);
    if (zapis) new IntersectionObserver(([en]) => { formVisible = en.isIntersecting; sync(); }, { threshold: 0.15 }).observe(zapis);
  }

  // ---------- Форма записи ----------
  const form = $('#lead-form');
  if (form) {
    // Кнопки «Пробный день» сразу выбирают нужный формат
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-format]');
      if (!a) return;
      const radio = form.querySelector(`input[name="format"][value="${a.dataset.format}"]`);
      if (radio) radio.checked = true;
    });

    const phone = $('#f-phone');
    const phoneErr = $('#f-phone-err');
    const digits = (v) => v.replace(/\D/g, '');
    const formatPhone = (v) => {
      let d = digits(v);
      if (!d) return '';
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      const p = d.slice(1, 11);
      let out = '+7';
      if (p.length) out += ' (' + p.slice(0, 3);
      if (p.length >= 3) out += ')';
      if (p.length > 3) out += ' ' + p.slice(3, 6);
      if (p.length > 6) out += '-' + p.slice(6, 8);
      if (p.length > 8) out += '-' + p.slice(8, 10);
      return out;
    };
    phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+7 ('; });
    phone.addEventListener('blur', () => { if (digits(phone.value).length <= 1) phone.value = ''; });
    phone.addEventListener('input', (e) => {
      if (e.inputType && e.inputType.startsWith('delete')) return;
      phone.value = formatPhone(phone.value);
      phone.closest('.field').classList.remove('is-invalid');
      phoneErr.hidden = true;
    });

    const status = $('.form-status', form);
    const setStatus = (msg, isErr) => { status.textContent = msg; status.classList.toggle('is-err', Boolean(isErr)); };

    const success = (name, viaWhatsApp) => {
      const box = document.createElement('div');
      box.className = 'form-success';
      box.innerHTML = '<svg class="ic"><use href="#i-check"/></svg><h3></h3><p></p>';
      box.querySelector('h3').textContent = name ? `Спасибо, ${name}!` : 'Спасибо!';
      box.querySelector('p').textContent = viaWhatsApp
        ? 'Мы открыли WhatsApp с готовым сообщением — просто отправьте его, и мы подберём удобный день.'
        : 'Заявка получена. Мы перезвоним, чтобы выбрать удобный день и время.';
      form.replaceChildren(box);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.company) return; // ловушка для ботов

      let ok = true;
      const nameField = $('#f-name').closest('.field');
      nameField.classList.toggle('is-invalid', !data.name || !data.name.trim());
      if (!data.name || !data.name.trim()) ok = false;
      if (digits(data.phone || '').length !== 11) {
        phone.closest('.field').classList.add('is-invalid'); phoneErr.hidden = false; ok = false;
      }
      const consent = $('.consent', form);
      consent.classList.toggle('is-invalid', !data.consent);
      if (!data.consent) ok = false;
      if (!ok) { setStatus('Пожалуйста, заполните отмеченные поля.', true); return; }

      const payload = {
        format: data.format, name: data.name.trim(), phone: data.phone, child_age: data.child_age || '',
        time: data.time, page: location.href, sent_at: new Date().toISOString(),
      };
      goal('form_submit');

      if (SITE.formEndpoint) {
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; setStatus('Отправляем…');
        try {
          const res = await fetch(SITE.formEndpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(String(res.status));
          success(payload.name, false);
        } catch (err) {
          btn.disabled = false;
          setStatus('Не получилось отправить. Позвоните нам, пожалуйста, — мы на связи.', true);
        }
        return;
      }

      const text = `Здравствуйте! Хочу записаться: ${payload.format}.\nИмя: ${payload.name}\nТелефон: ${payload.phone}` +
        (payload.child_age ? `\nВозраст ребёнка: ${payload.child_age}` : '') + `\nУдобно: ${payload.time}`;
      window.open(`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      success(payload.name, true);
    });
  }

  // ---------- Год в подвале ----------
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
