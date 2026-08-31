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
  eleventyConfig.addFilter("head", (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []));
  eleventyConfig.addFilter("excludePath", (arr, path) =>
    Array.isArray(arr) ? arr.filter((p) => p && p.data && p.data.path !== path) : []
  );

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
