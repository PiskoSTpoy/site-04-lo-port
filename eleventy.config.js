// site-04-lo-port — 11ty config.
// Волна 11: добавлены slugify/extractH2s/injectH2Ids фильтры для ToC и коллекция blogPosts для related-posts.

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/gi, " ")
    // убрать всё, кроме букв (в т.ч. кириллицы), цифр, пробелов и дефисов
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripTags(html) {
  return String(html || "").replace(/<[^>]+>/g, "").trim();
}

function extractH2s(html) {
  const rx = /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi;
  const out = [];
  let m;
  while ((m = rx.exec(String(html || ""))) !== null) {
    const attrs = m[1];
    const inner = m[2];
    const text = stripTags(inner);
    if (!text) continue;
    const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/);
    const id = idMatch ? idMatch[1] : slugify(text);
    out.push({ id, text });
  }
  return out;
}

function injectH2Ids(html) {
  return String(html || "").replace(
    /<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi,
    (full, attrs, inner) => {
      if (/\bid\s*=/.test(attrs)) return full;
      const text = stripTags(inner);
      if (!text) return full;
      const id = slugify(text);
      // сохраняем оригинальные атрибуты (например, style=)
      return `<h2${attrs} id="${id}">${inner}</h2>`;
    }
  );
}

// 25.09.2026 (seo-2026-playbook §1, answer-first): лид статьи — первый <p>
// тела — должен стоять в DOM раньше оглавления, иначе парсер AI-выдачи
// первым «абзацем» страницы читает пункты ToC. splitLead отделяет первый
// абзац, если тело с него начинается; иначе лид пустой и всё идёт как было.
function splitLead(html) {
  const s = String(html || "");
  const m = s.match(/^\s*<p(?:\s[^>]*)?>[\s\S]*?<\/p>/i);
  if (!m) return { lead: "", rest: s };
  return { lead: m[0], rest: s.slice(m[0].length) };
}

// lastmod для sitemap.xml — время последнего изменения ИСХОДНОГО файла страницы.
// Не дата сборки: одинаковый lastmod у всех URL обесценивает сигнал свежести для
// всего домена, потому что Google учитывает его только когда он последовательно
// и проверяемо точен. Две сборки подряд без правок контента дают побайтово
// одинаковый sitemap — это и есть проверка честности значения.
const fs = require("node:fs");

function sourceMtimeISO(inputPath) {
  try {
    // .toISOString() даёт UTC с секундами — валидный W3C Datetime,
    // и значения у страниц, правленных в разные моменты, различаются.
    return fs.statSync(inputPath).mtime.toISOString().replace(/\.\d{3}Z$/, "+00:00");
  } catch {
    return null;
  }
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy({ "src/public": "/" });

  eleventyConfig.addFilter("sourceMtime", sourceMtimeISO);
  eleventyConfig.addFilter("slugify", slugify);
  eleventyConfig.addFilter("extractH2s", extractH2s);
  eleventyConfig.addFilter("injectH2Ids", injectH2Ids);
  eleventyConfig.addFilter("splitLead", splitLead);
  eleventyConfig.addFilter("head", (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []));
  eleventyConfig.addFilter("excludePath", (arr, path) =>
    Array.isArray(arr) ? arr.filter((p) => p && p.data && p.data.path !== path) : []
  );
  // relatedByPath: замена excludePath+head(3) для блока «Читайте также».
  // Прежняя пара фильтров всегда возвращала первые 3 поста по алфавиту
  // заголовка — 11 из 15 статей блога не получали НИ ОДНОЙ внутренней
  // ссылки из этого блока (проверено 14.09.2026: см. память
  // kran-network-v3). relatedByPath берёт следующие n постов ПОСЛЕ
  // текущего в том же отсортированном массиве, с переходом по кругу —
  // так у каждой статьи коллекции появляются свои 3 «соседа», и любая
  // статья получает свои 3 входящие ссылки от 3 статей перед ней.
  eleventyConfig.addFilter("relatedByPath", (arr, path, n) => {
    if (!Array.isArray(arr) || !arr.length) return [];
    const len = arr.length;
    const count = Math.min(n || 3, len - 1);
    if (count <= 0) return [];
    const idx = arr.findIndex((p) => p && p.data && p.data.path === path);
    const start = idx === -1 ? 0 : idx;
    const out = [];
    for (let i = 1; i <= count; i++) {
      out.push(arr[(start + i) % len]);
    }
    return out;
  });

  // Коллекция статей блога — все реальные index.njk из src/blog/<slug>/.
  // Индекс блога (src/blog/index.njk) исключён по проверке data.path.
  eleventyConfig.addCollection("blogPosts", (collectionApi) => {
    const posts = collectionApi
      .getFilteredByGlob("src/blog/**/index.njk")
      .filter((item) => {
        const p = item.data && item.data.path;
        return typeof p === "string" && p.startsWith("/blog/") && p !== "/blog/";
      });
    posts.sort((a, b) =>
      String(a.data.title || "").localeCompare(String(b.data.title || ""), "ru")
    );
    return posts;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
  };
};
