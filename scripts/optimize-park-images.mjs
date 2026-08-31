// Волна 107 (перенос пилота фото парка на site-04-lo-port): ресайз/сжатие скачанных
// исходников Wikimedia/Pexels до веб-разумных размеров. Исходники — 640×480 (147 КБ,
// уже маленький, не апскейлится) / 2884×1912 (5,08 МБ) / 6000×4000 (3,37 МБ) —
// публиковать оригиналы нельзя (LCP/трафик), по образцу
// site-01-moscow-avtokran/app/scripts/optimize-park-images.mjs.
import sharp from 'sharp';
import { statSync, renameSync } from 'node:fs';

// ВАЖНО: src===out — скрипт сжимает файл, который уже лежит в public/. Повторный
// запуск на уже обработанном файле означает повторное JPEG-сжатие (генерационные
// потери) без какой-либо пользы. Поэтому задание Волны 107 ниже закомментировано
// сразу после того, как отработало один раз — раскомментировать только если нужно
// пересобрать конкретный файл заново из свежего оригинала в этом же пути.
const jobs = [
  // Волна 107 — уже обработаны, не перезапускать без свежего оригинала:
  // { src: 'src/public/images/park/kb-403b.jpg', out: 'src/public/images/park/kb-403b.jpg', width: 1280 },
  // { src: 'src/public/images/park/mkg-25-01a.jpg', out: 'src/public/images/park/mkg-25-01a.jpg', width: 1280 },
  // { src: 'src/public/images/hero/park-hero.jpg', out: 'src/public/images/hero/park-hero.jpg', width: 1920 },
];

for (const job of jobs) {
  const before = statSync(job.src).size;
  const buf = await sharp(job.src).rotate().resize({ width: job.width, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  await sharp(buf).toFile(job.out + '.tmp');
  renameSync(job.out + '.tmp', job.out);
  const after = statSync(job.out).size;
  console.log(`${job.src}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`);
}
