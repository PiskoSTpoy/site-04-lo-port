// Генерация WebP-дублей рядом с оригиналами в src/public/images.
// Оригиналы НЕ трогаются и остаются в разметке внутри <img> — <picture> отдаёт
// WebP только тем браузерам, которые сами о нём попросили.
//
// Скрипт идемпотентен: сравнивает mtime, перегенерирует только когда исходник
// новее своего .webp. И отдельно — если webp получился не меньше оригинала
// (так бывает на схемах и плоской графике), файл удаляется, и в разметке для
// такой картинки <source> ставить не надо: лишний запрос ради худшего веса.
//
//   node scripts/make-webp.mjs
import sharp from 'sharp';
import { readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = 'src/public/images';
const RASTER = new Set(['.jpg', '.jpeg', '.png']);
// og/ пропускаем сознательно: og:image читают краулеры соцсетей и мессенджеров,
// среди которых WebP поддерживают не все, а <picture> там не работает в принципе.
// Карточка остаётся одним PNG, чтобы не плодить файл, который никто не запросит.
const SKIP_DIRS = new Set(['og']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (!SKIP_DIRS.has(name)) out.push(...walk(p)); }
    else if (RASTER.has(extname(name).toLowerCase())) out.push(p);
  }
  return out;
}

let made = 0, skipped = 0, dropped = 0;
for (const src of walk(ROOT)) {
  const out = src.replace(/\.(jpe?g|png)$/i, '.webp');
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) {
    skipped++;
    continue;
  }
  // effort 6 — самый медленный и самый плотный режим; картинок единицы,
  // время сборки от этого не страдает, а вес отдаваемого файла падает.
  const buf = await sharp(src).webp({ quality: 80, effort: 6 }).toBuffer();
  const origSize = statSync(src).size;
  if (buf.length >= origSize) {
    if (existsSync(out)) unlinkSync(out);
    dropped++;
    console.log(`ХУЖЕ ОРИГИНАЛА, пропущен: ${src} (${(origSize / 1024).toFixed(0)} КБ -> ${(buf.length / 1024).toFixed(0)} КБ)`);
    continue;
  }
  await sharp(buf).toFile(out);
  made++;
  console.log(`${src}: ${(origSize / 1024).toFixed(0)} КБ -> ${(buf.length / 1024).toFixed(0)} КБ webp (-${Math.round((1 - buf.length / origSize) * 100)}%)`);
}
console.log(`\nсоздано ${made}, уже актуальны ${skipped}, отброшено как бесполезные ${dropped}`);
