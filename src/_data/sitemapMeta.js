// Приоритет и changefreq по URL — перенесены 1:1 из прежнего РУЧНОГО
// src/public/sitemap.xml, чтобы генерация карты ничего не обнулила.
// Сам файл карты больше не редактируется руками: src/sitemap.njk строит его
// из коллекции страниц, поэтому расхождение «страница есть, в карте нет»
// (реальный дефект прошлых волн — см. content-plan.md) стало невозможным.
// Для новой страницы, которой здесь нет, берётся DEFAULT.

const DEFAULT = { changefreq: 'monthly', priority: '0.6' };

const BY_PATH = {
  "/": { changefreq: 'daily', priority: '1.0' },
  "/kalendar/": { changefreq: 'daily', priority: '0.9' },
  "/marshruty/": { changefreq: 'weekly', priority: '0.9' },
  "/marshruty/ust-luga-port/": { changefreq: 'weekly', priority: '0.8' },
  "/marshruty/karery-volosovo/": { changefreq: 'weekly', priority: '0.8' },
  "/marshruty/gruntovki-i-sezdy/": { changefreq: 'weekly', priority: '0.8' },
  "/marshruty/asfaltobeton-gatchina-lomonosov/": { changefreq: 'weekly', priority: '0.8' },
  "/marshruty/vyborgskoe-napravlenie/": { changefreq: 'weekly', priority: '0.8' },
  "/marshruty/vsevolozhskoe-napravlenie/": { changefreq: 'weekly', priority: '0.8' },
  "/marshruty/priozerskoe-napravlenie/": { changefreq: 'weekly', priority: '0.8' },
  "/marshruty/luzhskoe-napravlenie/": { changefreq: 'weekly', priority: '0.8' },
  "/uslugi/avtokran-dlya-stroyki/": { changefreq: 'weekly', priority: '0.9' },
  "/uslugi/gusenichnyy-kran-dlya-porta/": { changefreq: 'weekly', priority: '0.9' },
  "/uslugi/bashennyy-kran-lo/": { changefreq: 'weekly', priority: '0.9' },
  "/uslugi/tehnika-cherez-partnerov/": { changefreq: 'monthly', priority: '0.7' },
  "/park/": { changefreq: 'monthly', priority: '0.8' },
  "/park/mkg-25-01a/": { changefreq: 'monthly', priority: '0.7' },
  "/park/ivanovets-ks-55717k-1/": { changefreq: 'monthly', priority: '0.7' },
  "/park/kb-403b/": { changefreq: 'monthly', priority: '0.7' },
  "/keysy/": { changefreq: 'monthly', priority: '0.7' },
  "/keysy/dostavka-v-mezhsezone/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/razgruzka-v-portu-ust-luga/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/rabota-v-karere-kikerino/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/montazh-bashennogo-krana-vesnoy/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/montazh-vahtovogo-gorodka-kpeg/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/podgotovka-puti-pod-kb-403b/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/dva-dopuska-v-vysotske/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/montazh-karkasa-sklada-klassa-a/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/montazh-na-deystvuyushchem-zavode/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/shkola-v-7-mikrorayone-kingiseppa/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/fok-v-agalatovo/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/montazh-ochistnyh-oselki-semiozerie/": { changefreq: 'monthly', priority: '0.6' },
  "/keysy/stanciya-vodopodgotovki-porogi-volhov/": { changefreq: 'monthly', priority: '0.6' },
  "/documents/": { changefreq: 'monthly', priority: '0.7' },
  "/blog/": { changefreq: 'weekly', priority: '0.6' },
  "/blog/prosushka-dorog-ogranicheniya/": { changefreq: 'monthly', priority: '0.8' },
  "/blog/otvetstvennost-za-narushenie-prosushki/": { changefreq: 'monthly', priority: '0.7' },
  "/blog/trebovaniya-k-ploshchadke-dlya-krana/": { changefreq: 'monthly', priority: '0.7' },
  "/blog/terminaly-porta-ust-luga/": { changefreq: 'monthly', priority: '0.7' },
  // Правовые документы: индексируются, но в выдаче не конкурируют.
  '/politika-obrabotki-personalnyh-dannyh/': { changefreq: 'yearly', priority: '0.2' },
  '/soglasie-na-obrabotku-personalnyh-dannyh/': { changefreq: 'yearly', priority: '0.2' },
};

module.exports = { DEFAULT, BY_PATH };
