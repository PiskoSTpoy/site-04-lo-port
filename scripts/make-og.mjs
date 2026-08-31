// Сборка OG-картинки 1200x630 из ЖИВОЙ страницы в headless-Chrome.
//
// Почему не sharp по SVG: sharp рисует текст системными шрифтами и локальный
// Cuprum не подхватит — на картинке оказался бы чужой шрифт. Здесь страница
// открывается в браузере с того же локального сервера, что и сайт, поэтому
// /fonts/fonts.css применяется как на реальном сайте, и на карточке настоящая
// заголовочная гарнитура сайта.
//
// Ничего не выдумано: на карточке только название, зона работы и тезис,
// дословно совпадающий с h1 главной. Никаких цифр, телефонов и реквизитов.
//
// Требует поднятого сервера сборки (npm run preview / launch.json, порт 5854):
//   node scripts/make-og.mjs [http://127.0.0.1:5854]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = process.argv[2] || 'http://127.0.0.1:5854';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9421;
const TMP = '_site/__og-source.html';
const OUT_DIR = 'src/public/images/og';

// Портовый hazard-код сайта: сигнальная лента, жёсткие прямые углы,
// акцент #F5A623 на #1A1A1A, заголовок капслоком Cuprum.
const HTML = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<link rel="stylesheet" href="/fonts/fonts.css">
<style>
  html,body{margin:0;padding:0;background:#1A1A1A}
  .card{width:1200px;height:630px;position:relative;overflow:hidden;
        display:flex;flex-direction:column;justify-content:center;
        padding:0 88px;box-sizing:border-box;
        border:10px solid #F5A623;}
  .band{position:absolute;left:0;right:0;top:0;height:34px;
        background:repeating-linear-gradient(45deg,#F5A623 0 26px,#1A1A1A 26px 52px)}
  .band--b{top:auto;bottom:0}
  .brand{font-family:'Cuprum',sans-serif;font-weight:700;font-size:34px;
         letter-spacing:.06em;text-transform:uppercase;color:#F2F0EA}
  .brand span{color:#F5A623}
  h1{font-family:'Cuprum',sans-serif;font-weight:700;font-size:82px;line-height:1.06;
     letter-spacing:.02em;text-transform:uppercase;color:#F2F0EA;margin:26px 0 0;max-width:19ch}
  .sub{font-family:'Scada',sans-serif;font-size:27px;line-height:1.4;color:#B8B5AC;
       margin-top:26px;max-width:44ch}
  .rule{width:132px;height:8px;background:#F5A623;margin-top:30px}
</style></head><body>
<div class="card">
  <div class="band"></div><div class="band band--b"></div>
  <div class="brand">КРАН<span>-ЛО</span> · Ленинградская область</div>
  <h1>Сначала дата и дорога, потом модель</h1>
  <p class="sub">Заявку в область ломает не грузоподъёмность, а число в календаре и покрытие того плеча, по которому поедет техника.</p>
  <div class="rule"></div>
</div></body></html>`;

writeFileSync(TMP, HTML);
mkdirSync(OUT_DIR, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + process.env.TEMP + '\\cdp-s04og',
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: 'ignore' });

async function j(p) {
  for (let i = 0; i < 80; i++) {
    try { return await (await fetch(`http://127.0.0.1:${PORT}${p}`)).json(); }
    catch { await sleep(250); }
  }
  throw new Error('CDP не поднялся');
}
try {
  const pg = (await j('/json/list')).find(t => t.type === 'page');
  const s = new globalThis.WebSocket(pg.webSocketDebuggerUrl);
  await new Promise(r => s.addEventListener('open', r));
  let id = 0; const pend = new Map();
  s.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  });
  const send = (m, p = {}) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, x => x.error ? rej(new Error(m + JSON.stringify(x.error))) : res(x.result));
    s.send(JSON.stringify({ id: i, method: m, params: p }));
  });

  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${BASE}/__og-source.html` });
  for (let i = 0; i < 60; i++) {
    const r = await send('Runtime.evaluate', { expression: 'document.readyState==="complete"&&document.fonts.status==="loaded"', returnByValue: true });
    if (r.result.value) break;
    await sleep(200);
  }
  // Убедиться, что на карточке ИМЕННО Cuprum, а не системный запасной:
  // ширина пробной строки в назначенной гарнитуре обязана отличаться от fallback.
  const chk = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(()=>{const c=document.createElement('canvas').getContext('2d');
      const S='КРАН В ЛЕНИНГРАДСКУЮ ОБЛАСТЬ';
      c.font="700 100px 'Cuprum'"; const a=c.measureText(S).width;
      c.font="700 100px 'CuprumNotReal'"; const b=c.measureText(S).width;
      return {cuprum:Math.round(a), fallback:Math.round(b)};})()`,
  });
  const { cuprum, fallback } = chk.result.value;
  if (cuprum === fallback) throw new Error('Cuprum не применился — на карточке был бы системный шрифт');
  console.log(`Cuprum применился: ${cuprum}px против ${fallback}px у запасного`);

  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
  writeFileSync(`${OUT_DIR}/og-default.png`, Buffer.from(shot.data, 'base64'));
  console.log(`${OUT_DIR}/og-default.png — 1200x630`);
  s.close();
} finally {
  chrome.kill();
  rmSync(TMP, { force: true }); // временный исходник в сборке не остаётся
}
