// Волна 126 (перенос пилота видео-hero с site-01 на site-04-lo-port): сжатие
// скачанного оригинала фонового видео hero до веб-разумного размера + извлечение
// постера. По образцу site-01-moscow-avtokran/app/scripts/optimize-hero-video.mjs
// (та же ffmpeg-static — портируемый бинарник, без системной зависимости от
// ffmpeg на машине разработчика), но пути адаптированы под 11ty-раскладку этого
// сайта: passthrough-копия отдаёт в раздачу src/public/ (не public/, как у
// Astro-сайтов сети — см. eleventy.config.js, addPassthroughCopy({"src/public": "/"})).
//
// ВАЖНО: исходник — НЕ в src/public/. Раздавать посетителям сырой файл с
// оригинальным разрешением незачем (используется только как вход в сжатие), а
// на выходе в src/public/ попадает только сжатая версия.
// Источник (автор/лицензия/ссылка) см. content-plan.md, «Волна 126».
import { execFileSync } from 'node:child_process';
import { statSync, mkdirSync, existsSync } from 'node:fs';
import ffmpegPath from 'ffmpeg-static';

const jobs = [
  {
    src: 'scripts/source-assets/hero-crane-silhouette-original.mp4',
    outVideo: 'src/public/videos/hero-crane-silhouette.mp4',
    outPoster: 'src/public/images/hero/hero-crane-silhouette-poster.jpg',
    // Не выше 1280px по широкой стороне (ТЗ) — исходник скачан в 1920x1080,
    // поэтому масштаб всегда вниз; -2 у высоты — чётность обязательна для libx264.
    width: 1280,
    // Кадр постера берётся НЕ с нулевой секунды: у большинства стоковых клипов
    // первый кадр — технический (наезд объектива/затемнение). Ролик короткий
    // (7,36с) — секунда 2.0 уже внутри содержательного плана (силуэт крана на
    // фоне заката виден целиком, солнце ещё не вышло из кадра).
    posterAt: '00:00:02',
  },
];

for (const job of jobs) {
  if (!existsSync(job.src)) {
    console.error(`Пропуск: исходник не найден — ${job.src}. Скачайте оригинал в scripts/source-assets/ перед запуском.`);
    continue;
  }
  mkdirSync('src/public/videos', { recursive: true });
  mkdirSync('src/public/images/hero', { recursive: true });

  const before = statSync(job.src).size;

  // H.264 mp4, без звука (-an — задание прямо требует беззвучный луп), масштаб
  // до job.width по ширине с сохранением пропорций (высота считается ffmpeg-ом,
  // -2 округляет до чётного числа), CRF 28 (баланс размер/качество для фонового,
  // не первоплановое видео) + faststart (moov-атом в начале файла — воспроизведение
  // стартует до полной загрузки, важно при autoplay в браузере).
  execFileSync(ffmpegPath, [
    '-y',
    '-i', job.src,
    '-an',
    '-vf', `scale=${job.width}:-2:flags=lanczos`,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    job.outVideo,
  ], { stdio: 'inherit' });

  // Постер — кадр из УЖЕ сжатого файла (тот же размер/цветокоррекция, что и
  // видео, а не случайно другое разрешение оригинала).
  execFileSync(ffmpegPath, [
    '-y',
    '-ss', job.posterAt,
    '-i', job.outVideo,
    '-frames:v', '1',
    '-q:v', '3',
    job.outPoster,
  ], { stdio: 'inherit' });

  const afterVideo = statSync(job.outVideo).size;
  const afterPoster = statSync(job.outPoster).size;
  console.log(
    `${job.src}: ${(before / 1024 / 1024).toFixed(2)} MB -> ${job.outVideo}: ${(afterVideo / 1024 / 1024).toFixed(2)} MB` +
    ` | постер ${job.outPoster}: ${(afterPoster / 1024).toFixed(0)} KB`
  );
  if (afterVideo > 3 * 1024 * 1024) {
    console.warn(`ВНИМАНИЕ: ${job.outVideo} тяжелее 3 МБ (цель ТЗ — 2–3 МБ). Поднимите CRF (например 30–32) и перезапустите.`);
  }
}
