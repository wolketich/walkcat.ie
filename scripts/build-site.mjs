import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { blogPosts, serviceSchemas, site } from '../src/content/site-data.mjs';
import { defaultLocale, localeOrder, locales, translations } from '../src/content/i18n.mjs';

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, 'src/source/index.source.html');
const stylesPath = path.join(rootDir, 'assets/css/styles.css');
const scriptPath = path.join(rootDir, 'assets/js/site.js');
const faviconPath = path.join(rootDir, 'assets/icons/favicon.svg');
const ogImagePath = path.join(rootDir, 'assets/og/walkcat-og.svg');
const manifestPath = path.join(rootDir, 'site.webmanifest');

const sourceHtml = await readFile(sourcePath, 'utf8');
const styleMatch = sourceHtml.match(/<style>([\s\S]*?)<\/style>/);

if (!styleMatch) {
  throw new Error('Could not extract styles from src/source/index.source.html');
}

const pageMatchMap = {
  home: /<div id="page-home" class="page active page-wrap">([\s\S]*?)<\/div><!-- \/page-home -->/,
  services: /<div id="page-services" class="page page-wrap">([\s\S]*?)<\/div><!-- \/page-services -->/,
  process: /<div id="page-process" class="page page-wrap">([\s\S]*?)<\/div><!-- \/page-process -->/,
  cases: /<div id="page-cases" class="page page-wrap">([\s\S]*?)<\/div><!-- \/page-cases -->/,
  contact: /<div id="page-contact" class="page page-wrap">([\s\S]*?)<\/div><!-- \/page-contact -->/,
  about: /<div id="page-about" class="page page-wrap">([\s\S]*?)<\/div><!-- \/page-about -->/
};

const extractedPageContent = Object.fromEntries(
  Object.entries(pageMatchMap).map(([key, regex]) => {
    const match = sourceHtml.match(regex);
    if (!match) {
      throw new Error(`Could not extract page content for "${key}"`);
    }
    return [key, `<div id="page-${key}" class="page active page-wrap">${match[1]}</div>`];
  })
);

extractedPageContent.contact = enhanceContactForm(extractedPageContent.contact);

const commonSchemaBase = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': `${site.baseUrl}/#business`,
      name: site.name,
      description:
        'Business systems and web design for Irish trade and service businesses. Workflow automation, CRM setup, integrations, and websites that generate leads.',
      url: site.baseUrl,
      founder: {
        '@type': 'Person',
        name: site.founder
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Dublin',
        addressCountry: 'IE'
      },
      areaServed: {
        '@type': 'Country',
        name: 'Ireland'
      },
      serviceType: [
        'Web Design',
        'Workflow Automation',
        'Business Process Improvement',
        'CRM Setup',
        'Business Systems Consulting',
        'IT Support'
      ],
      priceRange: '€€'
    },
    {
      '@type': 'WebSite',
      '@id': `${site.baseUrl}/#website`,
      url: site.baseUrl,
      name: site.name,
      description: 'Business systems and web design for Irish SMEs',
      publisher: {
        '@id': `${site.baseUrl}/#business`
      }
    }
  ]
};

const faqSchemaBase = {
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do I need to know exactly what solution I need?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "No. Most clients come with a problem, not a solution. Describing what's slow or frustrating is enough to start."
      }
    },
    {
      '@type': 'Question',
      name: 'Do you only build websites?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Websites are one part of the work. The bigger focus is on systems: integrations, process fixes, automation, and internal tools.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do you work with small businesses in Ireland?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Small and mid-sized Irish businesses are the core market, especially trade businesses, service companies, and founder-led teams.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do you do one-off fixes as well as larger projects?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Some work is a single focused fix, others are multi-week projects. The scope follows the problem.'
      }
    }
  ]
};

const routes = [
  { key: 'home', output: 'index.html' },
  { key: 'services', output: 'services/index.html' },
  { key: 'process', output: 'how-i-work/index.html' },
  { key: 'cases', output: 'case-studies/index.html' },
  { key: 'contact', output: 'start-here/index.html' },
  { key: 'about', output: 'about/index.html' }
];

await rm(path.join(rootDir, 'assets'), { recursive: true, force: true });
await rm(path.join(rootDir, 'services'), { recursive: true, force: true });
await rm(path.join(rootDir, 'how-i-work'), { recursive: true, force: true });
await rm(path.join(rootDir, 'case-studies'), { recursive: true, force: true });
await rm(path.join(rootDir, 'start-here'), { recursive: true, force: true });
await rm(path.join(rootDir, 'about'), { recursive: true, force: true });
await rm(path.join(rootDir, 'blog'), { recursive: true, force: true });
for (const locale of localeOrder.filter((code) => code !== defaultLocale)) {
  await rm(path.join(rootDir, locales[locale].prefix.slice(1)), { recursive: true, force: true });
}
await Promise.all([
  mkdir(path.dirname(stylesPath), { recursive: true }),
  mkdir(path.dirname(scriptPath), { recursive: true }),
  mkdir(path.dirname(faviconPath), { recursive: true }),
  mkdir(path.dirname(ogImagePath), { recursive: true }),
  mkdir(path.join(rootDir, 'services'), { recursive: true }),
  mkdir(path.join(rootDir, 'how-i-work'), { recursive: true }),
  mkdir(path.join(rootDir, 'case-studies'), { recursive: true }),
  mkdir(path.join(rootDir, 'start-here/thanks'), { recursive: true }),
  mkdir(path.join(rootDir, 'about'), { recursive: true }),
  mkdir(path.join(rootDir, 'blog'), { recursive: true })
]);

await writeFile(stylesPath, `${styleMatch[1].trim()}\n\n${buildExtraStyles()}\n`, 'utf8');
await writeFile(scriptPath, buildScriptFile(), 'utf8');
await writeFile(faviconPath, buildFaviconSvg(), 'utf8');
await writeFile(ogImagePath, buildOgImageSvg(), 'utf8');

for (const locale of localeOrder) {
  const localizedSite = translateValue(site, locale);
  const localizedServiceSchemas = translateValue(serviceSchemas, locale);
  const localizedBlogPosts = translateValue(blogPosts, locale);
  const localizedCorePages = Object.fromEntries(
    Object.entries(extractedPageContent).map(([key, html]) => [key, localizeCorePageHtml(key, html, locale)])
  );

  for (const route of routes) {
    const page = localizedSite.pages[route.key];
    const schemas = [buildCommonSchema(locale)];

    if (route.key !== 'home') {
      schemas.push(buildBreadcrumbSchema(route.key, locale));
    }

    if (route.key === 'home') {
      schemas[0]['@graph'].push(buildFaqSchema(locale));
    }

    if (route.key === 'services') {
      schemas[0]['@graph'].push(...buildServiceSchemaGraph(localizedServiceSchemas, locale));
    }

    if (route.key === 'contact') {
      schemas[0]['@graph'].push({
        '@type': 'ContactPage',
        '@id': `${publicUrl(locale, page.path)}#contact`,
        name: tr(locale, 'Start Here'),
        description: page.description,
        url: publicUrl(locale, page.path)
      });
    }

    if (route.key === 'about') {
      schemas[0]['@graph'].push({
        '@type': 'Person',
        '@id': `${publicUrl(locale, page.path)}#person`,
        name: site.founder,
        jobTitle: tr(locale, 'Business Systems Partner'),
        worksFor: {
          '@id': `${site.baseUrl}/#business`
        }
      });
    }

    await writePage(localizedOutputPath(locale, route.output), renderDocument({
      locale,
      pageKey: route.key,
      page,
      body: localizedCorePages[route.key],
      schemas,
      basePath: page.path
    }));
  }

  await writePage(localizedOutputPath(locale, 'blog/index.html'), renderDocument({
    locale,
    pageKey: 'blog',
    page: localizedSite.pages.blog,
    body: renderBlogIndex(locale, localizedBlogPosts),
    schemas: [
      buildCommonSchema(locale),
      buildBreadcrumbSchema('blog', locale),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${site.name} ${tr(locale, 'Blog')}`,
        description: localizedSite.pages.blog.description,
        url: publicUrl(locale, localizedSite.pages.blog.path)
      }
    ],
    basePath: localizedSite.pages.blog.path
  }));

  for (const post of localizedBlogPosts) {
    const basePath = `/blog/${post.slug}/`;
    await writePage(localizedOutputPath(locale, `blog/${post.slug}/index.html`), renderDocument({
      locale,
      pageKey: 'blog',
      page: {
        path: basePath,
        title: `${post.title} | ${site.name}`,
        description: post.description,
        keywords: `${post.keyword}, ${tr(locale, 'Blog')}, ${tr(locale, 'Business systems and web design for Irish SMEs')}`
      },
      body: renderBlogPost(locale, post),
      schemas: [
        buildCommonSchema(locale),
        buildArticleBreadcrumbSchema(post, locale),
        buildArticleSchema(post, locale)
      ],
      ogType: 'article',
      article: post,
      basePath
    }));
  }

  await writePage(localizedOutputPath(locale, 'start-here/thanks/index.html'), renderDocument({
    locale,
    pageKey: 'contact',
    page: localizedSite.pages.thanks,
    body: renderThanksPage(locale),
    schemas: [
      buildCommonSchema(locale),
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: localizedSite.pages.thanks.title,
        description: localizedSite.pages.thanks.description,
        url: publicUrl(locale, localizedSite.pages.thanks.path)
      }
    ],
    basePath: localizedSite.pages.thanks.path
  }));

  await writePage(localizedOutputPath(locale, '404.html'), renderDocument({
    locale,
    pageKey: 'notFound',
    page: localizedSite.pages.notFound,
    body: renderNotFoundPage(locale),
    schemas: [
      buildCommonSchema(locale),
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: tr(locale, 'Page Not Found'),
        description: localizedSite.pages.notFound.description,
        url: publicUrl(locale, localizedSite.pages.notFound.path)
      }
    ],
    shouldIndex: false,
    basePath: localizedSite.pages.notFound.path
  }));
}

await writeFile(path.join(rootDir, 'robots.txt'), buildRobotsTxt(), 'utf8');
await writeFile(path.join(rootDir, 'sitemap.xml'), buildSitemapXml(), 'utf8');
await writeFile(manifestPath, buildManifest(), 'utf8');

async function writePage(relativePath, html) {
  const absolutePath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${html.trim()}\n`, 'utf8');
}

function renderDocument({ locale, pageKey, page, body, schemas, basePath, ogType = 'website', article = null, shouldIndex = true }) {
  const canonical = publicUrl(locale, basePath ?? page.path);
  const keywordsMeta = page.keywords ? `<meta name="keywords" content="${escapeHtmlAttribute(page.keywords)}" />\n` : '';
  const robots = shouldIndex ? 'index, follow' : 'noindex, follow';
  const currentLocale = locales[locale];
  const articleMeta = article
    ? `<meta property="article:published_time" content="${article.published}" />\n  <meta property="article:author" content="${escapeHtmlAttribute(site.founder)}" />\n`
    : '';
  const alternateLinks = localeOrder
    .map((code) => `<link rel="alternate" hreflang="${escapeHtmlAttribute(locales[code].htmlLang)}" href="${publicUrl(code, basePath ?? page.path)}" />`)
    .join('\n  ');
  const xDefaultLink = `<link rel="alternate" hreflang="x-default" href="${publicUrl(defaultLocale, basePath ?? page.path)}" />`;
  const alternateOgLocales = localeOrder
    .filter((code) => code !== locale)
    .map((code) => `<meta property="og:locale:alternate" content="${escapeHtmlAttribute(locales[code].ogLocale)}" />`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="${escapeHtmlAttribute(currentLocale.htmlLang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtmlAttribute(page.description)}" />
  ${keywordsMeta}  <meta name="author" content="${escapeHtmlAttribute(`${site.founder} - ${site.name}`)}" />
  <meta name="robots" content="${robots}" />
  <link rel="canonical" href="${canonical}" />
  ${alternateLinks}
  ${xDefaultLink}

  <meta property="og:title" content="${escapeHtmlAttribute(page.title)}" />
  <meta property="og:description" content="${escapeHtmlAttribute(page.description)}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${site.baseUrl}${site.ogImagePath}" />
  <meta property="og:locale" content="${escapeHtmlAttribute(currentLocale.ogLocale)}" />
  ${alternateOgLocales}
  <meta property="og:site_name" content="${escapeHtmlAttribute(site.name)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtmlAttribute(page.title)}" />
  <meta name="twitter:description" content="${escapeHtmlAttribute(page.description)}" />
  <meta name="twitter:image" content="${site.baseUrl}${site.ogImagePath}" />
  ${articleMeta}  <meta name="geo.region" content="IE-D" />
  <meta name="geo.placename" content="Dublin, Ireland" />
  <meta name="geo.position" content="53.3498;-6.2603" />
  <meta name="ICBM" content="53.3498, -6.2603" />
  <meta name="theme-color" content="#0c0c0e" />
  <link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg" />
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/css/styles.css" />
  ${schemas.map((schema) => `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>`).join('\n  ')}
</head>
<body data-page="${pageKey}" data-locale="${locale}" data-locale-prefix="${currentLocale.prefix}">
  ${renderNav(locale, pageKey, basePath ?? page.path)}
  ${renderMobileMenu(locale, basePath ?? page.path)}
  <main>
    ${body}
  </main>
  ${renderFooter(locale)}
  <script src="/assets/js/site.js" defer></script>
</body>
</html>`;
}

function renderNav(locale, pageKey, basePath) {
  return `<nav>
    <div class="nav-inner">
      <a class="nav-logo" href="${publicPath(locale, '/')}">Walk<span>cat</span></a>
      <div class="nav-links">
        ${renderNavLink(locale, 'home', '/', tr(locale, 'Home'), pageKey)}
        ${renderNavLink(locale, 'services', '/services/', tr(locale, 'Services'), pageKey)}
        ${renderNavLink(locale, 'process', '/how-i-work/', tr(locale, 'How I Work'), pageKey)}
        ${renderNavLink(locale, 'cases', '/case-studies/', tr(locale, 'Case Studies'), pageKey)}
        ${renderNavLink(locale, 'about', '/about/', tr(locale, 'About'), pageKey)}
      </div>
      <div class="nav-cta">
        ${renderLanguageSwitcher(locale, basePath, 'nav-lang')}
        <a class="btn-nav" href="${publicPath(locale, '/start-here/')}">${tr(locale, 'Start With Your Problem')}</a>
        <button class="hamburger" id="hamburger" type="button" onclick="toggleMenu()" aria-label="${escapeHtmlAttribute(tr(locale, 'Open navigation'))}">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </nav>`;
}

function renderMobileMenu(locale, basePath) {
  return `<div class="mobile-menu" id="mobileMenu">
    ${renderLanguageSwitcher(locale, basePath, 'mobile-lang')}
    <a href="${publicPath(locale, '/')}">${tr(locale, 'Home')}</a>
    <a href="${publicPath(locale, '/services/')}">${tr(locale, 'Services')}</a>
    <a href="${publicPath(locale, '/how-i-work/')}">${tr(locale, 'How I Work')}</a>
    <a href="${publicPath(locale, '/case-studies/')}">${tr(locale, 'Case Studies')}</a>
    <a href="${publicPath(locale, '/about/')}">${tr(locale, 'About')}</a>
    <a href="${publicPath(locale, '/blog/')}">${tr(locale, 'Blog')}</a>
    <a class="btn-nav" href="${publicPath(locale, '/start-here/')}">${tr(locale, 'Start With Your Problem')}</a>
  </div>`;
}

function renderFooter(locale) {
  return `<footer>
    <div class="footer-inner">
      <div class="footer-brand">
        <a class="nav-logo" href="${publicPath(locale, '/')}" style="display:block;margin-bottom:10px;">Walk<span>cat</span></a>
        <p>${tr(locale, 'Business systems & web design for Irish SMEs. Workflow automation, CRM setup, process improvement, and websites that generate leads. Based in Dublin, working across Ireland.')}</p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div class="footer-links">
          <a href="${publicPath(locale, '/')}">${tr(locale, 'Home')}</a>
          <a href="${publicPath(locale, '/services/')}">${tr(locale, 'Services')}</a>
          <a href="${publicPath(locale, '/how-i-work/')}">${tr(locale, 'How I Work')}</a>
          <a href="${publicPath(locale, '/case-studies/')}">${tr(locale, 'Case Studies')}</a>
          <a href="${publicPath(locale, '/about/')}">${tr(locale, 'About')}</a>
          <a href="${publicPath(locale, '/blog/')}">${tr(locale, 'Blog')}</a>
          <a href="${publicPath(locale, '/start-here/')}">${tr(locale, 'Start Here')}</a>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 0.72rem; color: var(--text-3); padding: 3px 10px; border: 1px solid var(--border); border-radius: 20px;">${tr(locale, 'Web design Ireland')}</span>
          <span style="font-size: 0.72rem; color: var(--text-3); padding: 3px 10px; border: 1px solid var(--border); border-radius: 20px;">${tr(locale, 'Workflow automation Dublin')}</span>
          <span style="font-size: 0.72rem; color: var(--text-3); padding: 3px 10px; border: 1px solid var(--border); border-radius: 20px;">${tr(locale, 'CRM setup Ireland')}</span>
          <span style="font-size: 0.72rem; color: var(--text-3); padding: 3px 10px; border: 1px solid var(--border); border-radius: 20px;">${tr(locale, 'Business process improvement')}</span>
          <span style="font-size: 0.72rem; color: var(--text-3); padding: 3px 10px; border: 1px solid var(--border); border-radius: 20px;">${tr(locale, 'Trade business website Ireland')}</span>
          <span style="font-size: 0.72rem; color: var(--text-3); padding: 3px 10px; border: 1px solid var(--border); border-radius: 20px;">${tr(locale, 'Business automation Ireland')}</span>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 Walkcat. ${tr(locale, 'All rights reserved.')}</p>
      <p>${tr(locale, 'Dublin, Ireland')}</p>
    </div>
  </footer>`;
}

function renderLanguageSwitcher(locale, basePath, className = '') {
  return `<div class="lang-switcher ${className}" aria-label="${escapeHtmlAttribute(tr(locale, 'Language'))}">
    ${localeOrder.map((code) => {
      const active = code === locale ? ' active' : '';
      return `<a class="lang-switcher-link${active}" href="${publicPath(code, basePath)}" lang="${escapeHtmlAttribute(locales[code].htmlLang)}" hreflang="${escapeHtmlAttribute(locales[code].htmlLang)}">${locales[code].label}</a>`;
    }).join('')}
  </div>`;
}

function renderNavLink(locale, key, href, label, pageKey) {
  const active = pageKey === key ? ' class="active"' : '';
  return `<a href="${publicPath(locale, href)}" data-page="${key}"${active}>${label}</a>`;
}

function renderBlogIndex(locale, posts) {
  return `<div id="page-blog" class="page active page-wrap">
    <section class="cases-hero blog-hero">
      <div class="container">
        <div class="section-label-row">
          <span class="label">${tr(locale, 'Blog')}</span>
        </div>
        <h1 class="display-xl" style="max-width: 700px; margin-bottom: 20px;">${tr(locale, 'Plain-language articles<br>for Irish businesses fixing<br>slow systems.')}</h1>
        <p class="lead" style="max-width: 560px;">${tr(locale, 'Practical reading for owners and small teams dealing with manual admin, missed leads, weak websites, disconnected tools, and CRM confusion.')}</p>
      </div>
    </section>

    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="blog-grid">
          ${posts.map((post) => renderBlogIndexCard(locale, post)).join('\n          ')}
        </div>
      </div>
    </section>

    <div style="background: var(--bg-2); padding: 64px 0; border-top: 1px solid var(--border);">
      <div class="container">
        <div class="cta-band">
          <div class="cta-band-text">
            <h2 class="display-md">${tr(locale, 'Need help with<br>the live version?')}</h2>
            <p style="margin-top: 12px;">${tr(locale, 'Reading is useful. Fixing the actual bottleneck matters more. Describe the situation and I will tell you what should happen next.')}</p>
          </div>
          <a class="btn-primary" style="font-size: 1rem; padding: 16px 28px; flex-shrink: 0;" href="${publicPath(locale, '/start-here/')}">${tr(locale, 'Start with your problem →')}</a>
        </div>
      </div>
    </div>
  </div>`;
}

function renderBlogIndexCard(locale, post) {
  return `<article class="blog-card">
    <div class="blog-card-top">
      <div class="blog-card-kicker">
        <span>${post.category}</span>
        <span class="blog-card-dot"></span>
        <span>${post.readTime}</span>
      </div>
      <div class="blog-card-chip-row">
        ${renderAudienceChips(post.audience, 'blog-card-chip')}
      </div>
    </div>
    <h2 class="blog-card-title">
      <a href="${publicPath(locale, `/blog/${post.slug}/`)}">${post.title}</a>
    </h2>
    <p class="blog-card-desc">${post.description}</p>
    <div class="blog-card-footer">
      <div class="blog-card-date">${tr(locale, 'Published')} ${formatPublished(post.published, locale)}</div>
      <a class="blog-card-link" href="${publicPath(locale, `/blog/${post.slug}/`)}">${tr(locale, 'Read article')}</a>
    </div>
  </article>`;
}

function renderBlogPost(locale, post) {
  return `<div id="page-blog-post" class="page active page-wrap">
    <section class="about-hero blog-post-hero">
      <div class="container">
        <div class="section-label-row">
          <span class="label">${tr(locale, 'Blog')}</span>
        </div>
        <div class="blog-post-meta">
          <div class="blog-card-kicker">
            <span>${post.category}</span>
            <span class="blog-card-dot"></span>
            <span>${post.readTime}</span>
            <span class="blog-card-dot"></span>
            <span>${formatPublished(post.published, locale)}</span>
          </div>
          <div class="blog-card-chip-row blog-post-chip-row">
            ${renderAudienceChips(post.audience, 'blog-card-chip')}
          </div>
        </div>
        <h1 class="display-xl blog-post-title">${post.title}</h1>
        <p class="lead blog-post-lead">${post.heroSummary}</p>
      </div>
    </section>

    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="blog-post-layout">
          <article class="blog-article">
            <div class="blog-article-intro card">
              <p>${post.description}</p>
            </div>
            ${post.sections.map(renderArticleSection).join('\n            ')}
          </article>

          <aside class="blog-sidebar">
            <div class="about-fact">
              <div class="about-fact-title">${tr(locale, 'At a glance')}</div>
              <div class="blog-sidebar-metrics">
                <div class="blog-sidebar-metric">
                  <span class="blog-sidebar-label">${tr(locale, 'Audience')}</span>
                  <span class="blog-sidebar-value">${post.audience}</span>
                </div>
                <div class="blog-sidebar-metric">
                  <span class="blog-sidebar-label">${tr(locale, 'Focus')}</span>
                  <span class="blog-sidebar-value">${post.category}</span>
                </div>
                <div class="blog-sidebar-metric">
                  <span class="blog-sidebar-label">${tr(locale, 'Read time')}</span>
                  <span class="blog-sidebar-value">${post.readTime}</span>
                </div>
                <div class="blog-sidebar-metric">
                  <span class="blog-sidebar-label">${tr(locale, 'Published')}</span>
                  <span class="blog-sidebar-value">${formatPublished(post.published, locale)}</span>
                </div>
              </div>
            </div>
            <div class="about-fact">
              <div class="about-fact-title">${tr(locale, 'Target keyword')}</div>
              <div class="about-fact-text">${post.keyword}</div>
            </div>
            <div class="about-fact">
              <div class="about-fact-title">${tr(locale, 'What this article is for')}</div>
              <div class="about-fact-text">${post.heroSummary}</div>
            </div>

            <div class="values-list" style="margin-top: 20px;">
              ${post.sidebarFacts.map((fact, index) => `<div class="value-row"><span class="value-num">0${index + 1}</span><span class="value-text">${fact}</span></div>`).join('')}
            </div>

            <div style="margin-top: 24px;">
              <a class="btn-primary" style="width: 100%; justify-content: center;" href="${publicPath(locale, '/start-here/')}">${tr(locale, 'Start with your problem →')}</a>
            </div>
            <div style="margin-top: 12px;">
              <a class="btn-ghost" style="width: 100%; justify-content: center;" href="${publicPath(locale, '/blog/')}">${tr(locale, 'Back to the blog')}</a>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <div style="background: var(--bg-2); padding: 64px 0; border-top: 1px solid var(--border);">
      <div class="container">
        <div class="cta-band">
          <div class="cta-band-text">
            <h2 class="display-md">${tr(locale, 'Seeing this problem<br>in your business?')}</h2>
            <p style="margin-top: 12px;">${tr(locale, 'Describe what is happening in plain language. That is enough to work out whether the right fix is a website, a process change, an integration, or a focused audit.')}</p>
          </div>
          <a class="btn-primary" style="font-size: 1rem; padding: 16px 28px; flex-shrink: 0;" href="${publicPath(locale, '/start-here/')}">${tr(locale, 'Explain the situation →')}</a>
        </div>
      </div>
    </div>
  </div>`;
}

function renderArticleSection(section) {
  return `<section class="blog-article-section">
      <h2 class="blog-article-heading">${section.title}</h2>
      ${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('\n      ')}
    </section>`;
}

function renderThanksPage(locale) {
  return `<div id="page-contact-thanks" class="page active page-wrap" data-thanks-page="true">
    <section class="contact-hero">
      <div class="container">
        <div class="section-label-row">
          <span class="label">${tr(locale, 'Start Here')}</span>
        </div>
        <h1 class="display-xl" style="max-width: 760px; margin-bottom: 20px;">${tr(locale, 'Your brief is ready.<br>If your email app did not open,<br><em style="color: var(--text-2);">send it manually here.</em>')}</h1>
        <p class="lead" style="max-width: 560px;">${tr(locale, 'The intake form prepares a structured email so the message lands in one place with the right detail. If the draft did not open automatically, use the retry link or copy the fallback summary below.')}</p>
      </div>
    </section>

    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="contact-layout">
          <div class="contact-sidebar">
            <h3 class="display-md" style="margin-bottom: 16px;">${tr(locale, 'What to do now.')}</h3>
            <p>${tr(locale, '1. Click the retry link to open the prepared email again.')}</p>
            <p>${tr(locale, '2. If your device blocks that, copy the fallback summary and send it manually.')}</p>
            <p>${tr(locale, '3. Once it is sent, expect a direct reply within one working day in most cases.')}</p>

            <div style="margin-top: 32px; padding: 20px 24px; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius);">
              <div class="service-detail-label" style="margin-bottom: 8px;">${tr(locale, 'Fallback inbox')}</div>
              <p class="body" style="font-size: 0.85rem;"><a href="mailto:${site.contactEmail}" id="fallbackInbox">${site.contactEmail}</a></p>
            </div>
          </div>

          <div>
            <div class="form-success show" style="display: block;">
              <div class="form-success-icon">✓</div>
              <h3>${tr(locale, 'Retry the draft or copy the summary.')}</h3>
              <p>${tr(locale, 'If nothing opened automatically, use the buttons below. The summary will include the information from your last submission on this device.')}</p>
            </div>

            <div class="intake-form" style="margin-top: 20px;">
              <div class="form-group">
                <label class="form-label">${tr(locale, 'Retry the prepared email')}</label>
                <a class="btn-primary" id="retryMailto" href="mailto:${site.contactEmail}" style="width: 100%; justify-content: center;">${tr(locale, 'Open email draft →')}</a>
              </div>
              <div class="form-group">
                <label class="form-label">${tr(locale, 'Fallback summary')}</label>
                <textarea class="form-textarea" id="fallbackSummary" style="min-height: 320px;" readonly>${tr(locale, 'Describe what is slow, manual, or broken in your business and send it to hello@walkcat.ie.').replace('hello@walkcat.ie', site.contactEmail)}</textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>`;
}

function renderNotFoundPage(locale) {
  return `<div id="page-not-found" class="page active page-wrap">
    <section class="about-hero">
      <div class="container">
        <div class="section-label-row">
          <span class="label">404</span>
        </div>
        <h1 class="display-xl" style="max-width: 720px; margin-bottom: 20px;">${tr(locale, 'That page does not exist.<br>The rest of the site does.')}</h1>
        <p class="lead" style="max-width: 540px;">${tr(locale, 'Use the links below to get back to the main pages, the blog, or the intake form.')}</p>
      </div>
    </section>

    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="services-overview">
          <a class="service-card" href="${publicPath(locale, '/services/')}">
            <div class="service-card-num">01</div>
            <div class="service-card-title">${tr(locale, 'Services')}</div>
            <div class="service-card-desc">${tr(locale, 'Websites, systems, integrations, process audits, automation, and focused technical help.')}</div>
            <div class="service-card-link">${tr(locale, 'Go to Services')}</div>
          </a>
          <a class="service-card" href="${publicPath(locale, '/case-studies/')}">
            <div class="service-card-num">02</div>
            <div class="service-card-title">${tr(locale, 'Case Studies')}</div>
            <div class="service-card-desc">${tr(locale, 'Illustrative examples of the kinds of operational problems Walkcat fixes.')}</div>
            <div class="service-card-link">${tr(locale, 'Go to Case Studies')}</div>
          </a>
          <a class="service-card" href="${publicPath(locale, '/blog/')}">
            <div class="service-card-num">03</div>
            <div class="service-card-title">${tr(locale, 'Blog')}</div>
            <div class="service-card-desc">${tr(locale, 'Practical guidance on CRM choice, admin reduction, websites, and lead follow-up.')}</div>
            <div class="service-card-link">${tr(locale, 'Go to Blog')}</div>
          </a>
          <a class="service-card" href="${publicPath(locale, '/start-here/')}">
            <div class="service-card-num">04</div>
            <div class="service-card-title">${tr(locale, 'Start Here')}</div>
            <div class="service-card-desc">${tr(locale, 'Describe what is slow, manual, or broken and get a direct response.')}</div>
            <div class="service-card-link">${tr(locale, 'Go to the form')}</div>
          </a>
        </div>
      </div>
    </section>
  </div>`;
}

function buildCommonSchema(locale) {
  const schema = translateValue(cloneSchema(commonSchemaBase), locale);
  schema['@graph'][1]['@id'] = `${publicUrl(locale, '/')}#website`;
  schema['@graph'][1].url = publicUrl(locale, '/');
  schema['@graph'][1].publisher = {
    '@id': `${site.baseUrl}/#business`
  };
  return schema;
}

function buildFaqSchema(locale) {
  return translateValue(cloneSchema(faqSchemaBase), locale);
}

function buildServiceSchemaGraph(localizedServiceSchemas, locale) {
  const pageUrl = publicUrl(locale, site.pages.services.path);
  return localizedServiceSchemas.map((service, index) => ({
    '@type': 'Service',
    '@id': `${pageUrl}#service-${index + 1}`,
    name: service.name,
    serviceType: service.name,
    description: service.description,
    provider: {
      '@id': `${site.baseUrl}/#business`
    },
    areaServed: {
      '@type': 'Country',
      name: tr(locale, 'Ireland')
    },
    url: pageUrl
  }));
}

function buildBreadcrumbSchema(pageKey, locale) {
  const page = site.pages[pageKey];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: tr(locale, 'Home'),
        item: publicUrl(locale, '/')
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: toCrumbName(pageKey, locale),
        item: publicUrl(locale, page.path)
      }
    ]
  };
}

function buildArticleBreadcrumbSchema(post, locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: tr(locale, 'Home'),
        item: publicUrl(locale, '/')
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: tr(locale, 'Blog'),
        item: publicUrl(locale, '/blog/')
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: publicUrl(locale, `/blog/${post.slug}/`)
      }
    ]
  };
}

function buildArticleSchema(post, locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.published,
    dateModified: post.published,
    author: {
      '@type': 'Person',
      name: site.founder
    },
    publisher: {
      '@type': 'Organization',
      name: site.name,
      logo: {
        '@type': 'ImageObject',
        url: `${site.baseUrl}${site.ogImagePath}`
      }
    },
    image: `${site.baseUrl}${site.ogImagePath}`,
    mainEntityOfPage: publicUrl(locale, `/blog/${post.slug}/`)
  };
}

function buildRobotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`;
}

function buildSitemapXml() {
  const staticPages = [
    site.pages.home.path,
    site.pages.services.path,
    site.pages.process.path,
    site.pages.cases.path,
    site.pages.about.path,
    site.pages.contact.path,
    site.pages.thanks.path,
    site.pages.blog.path
  ];
  const urls = localeOrder.flatMap((locale) => {
    const localizedStatic = staticPages.map((url) => publicUrl(locale, url));
    const localizedPosts = blogPosts.map((post) => publicUrl(locale, `/blog/${post.slug}/`));
    return [...localizedStatic, ...localizedPosts];
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${site.publishedDate}</lastmod>\n  </url>`).join('\n')}
</urlset>
`;
}

function buildManifest() {
  return JSON.stringify(
    {
      name: 'Walkcat',
      short_name: 'Walkcat',
      start_url: '/',
      display: 'standalone',
      background_color: '#0c0c0e',
      theme_color: '#0c0c0e',
      icons: [
        {
          src: '/assets/icons/favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any'
        },
        {
          src: '/assets/icons/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png',
          purpose: 'any'
        }
      ]
    },
    null,
    2
  );
}

function buildScriptFile() {
  const formCopy = Object.fromEntries(
    localeOrder.map((locale) => [
      locale,
      {
        subjectPrefix: tr(locale, 'Walkcat enquiry'),
        fallbackSubject: tr(locale, 'New project brief'),
        formTitle: tr(locale, 'Walkcat intake form'),
        name: tr(locale, 'Name'),
        businessName: tr(locale, 'Business name'),
        email: tr(locale, 'Email'),
        phone: tr(locale, 'Phone / WhatsApp'),
        website: tr(locale, 'Website'),
        businessType: tr(locale, 'Business type'),
        timeWaste: tr(locale, 'What is currently wasting your time?'),
        currentProblem: tr(locale, 'What feels slow, manual, or broken right now?'),
        desiredOutcome: tr(locale, 'What outcome are you hoping for?'),
        helpType: tr(locale, 'What type of help do you think you need?'),
        timeline: tr(locale, 'Any timelines or constraints?')
      }
    ])
  );

  return `const routes = {
  home: '/',
  services: '/services/',
  process: '/how-i-work/',
  cases: '/case-studies/',
  about: '/about/',
  contact: '/start-here/',
  blog: '/blog/'
};

const formCopy = ${JSON.stringify(formCopy, null, 2)};

function localizedPath(path) {
  const prefix = document.body?.dataset?.localePrefix || '';
  if (!prefix) return path;
  return path === '/' ? \`\${prefix}/\` : \`\${prefix}\${path}\`;
}

function showPage(id) {
  const target = routes[id];
  if (target) {
    window.location.href = localizedPath(target);
  }
}

function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.classList.toggle('open');
  }
}

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach((el) => el.classList.remove('open'));
  if (!isOpen) {
    item.classList.add('open');
  }
}

function getFormCopy(locale) {
  return formCopy[locale] || formCopy.en;
}

function buildMailtoUrl(data, email, locale) {
  const copy = getFormCopy(locale);
  const subject = encodeURIComponent(\`\${copy.subjectPrefix}: \${data.business_name || data.name || copy.fallbackSubject}\`);
  const lines = [
    copy.formTitle,
    '',
    \`\${copy.name}: \${data.name || ''}\`,
    \`\${copy.businessName}: \${data.business_name || ''}\`,
    \`\${copy.email}: \${data.email || ''}\`,
    \`\${copy.phone}: \${data.phone || ''}\`,
    \`\${copy.website}: \${data.website || ''}\`,
    \`\${copy.businessType}: \${data.business_type || ''}\`,
    '',
    copy.timeWaste,
    data.time_waste || '',
    '',
    copy.currentProblem,
    data.current_problem || '',
    '',
    copy.desiredOutcome,
    data.desired_outcome || '',
    '',
    copy.helpType,
    data.help_type || '',
    '',
    copy.timeline,
    data.timeline || ''
  ];
  return \`mailto:\${email}?subject=\${subject}&body=\${encodeURIComponent(lines.join('\\n'))}\`;
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget || document.getElementById('intakeForm');
  if (!form) return;

  const data = Object.fromEntries(new FormData(form).entries());
  const email = form.dataset.contactEmail || 'hello@walkcat.ie';
  const successPath = form.dataset.successPath || '/start-here/thanks/';
  const locale = document.body?.dataset?.locale || 'en';
  const mailtoUrl = buildMailtoUrl(data, email, locale);

  sessionStorage.setItem('walkcatDraft', JSON.stringify({
    email,
    mailtoUrl,
    summary: decodeURIComponent(mailtoUrl.split('&body=')[1] || ''),
    submittedAt: new Date().toISOString()
  }));

  window.location.href = mailtoUrl;
  window.setTimeout(() => {
    window.location.href = successPath;
  }, 300);
}

function initThanksPage() {
  const thanksPage = document.querySelector('[data-thanks-page]');
  if (!thanksPage) return;

  const stored = sessionStorage.getItem('walkcatDraft');
  if (!stored) return;

  try {
    const draft = JSON.parse(stored);
    const retryMailto = document.getElementById('retryMailto');
    const fallbackSummary = document.getElementById('fallbackSummary');
    const fallbackInbox = document.getElementById('fallbackInbox');

    if (retryMailto && draft.mailtoUrl) {
      retryMailto.href = draft.mailtoUrl;
    }

    if (fallbackSummary && draft.summary) {
      fallbackSummary.value = draft.summary;
    }

    if (fallbackInbox && draft.email) {
      fallbackInbox.href = \`mailto:\${draft.email}\`;
      fallbackInbox.textContent = draft.email;
    }
  } catch (error) {
    console.error('Unable to parse stored draft', error);
  }
}

function initAnimatedCards() {
  if (!('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll('.service-card, .card, .case-card, .blog-card, .case-teaser, .principle-card, .about-fact');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  targets.forEach((element) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(16px)';
    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(element);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThanksPage();
  initAnimatedCards();
});

window.showPage = showPage;
window.toggleMenu = toggleMenu;
window.toggleFaq = toggleFaq;
window.handleSubmit = handleSubmit;
`;
}

function buildFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" role="img" aria-labelledby="title desc">
  <title id="title">Walkcat favicon</title>
  <desc id="desc">Walkcat icon with a dark background and neon green WC lettering.</desc>
  <rect width="180" height="180" rx="32" fill="#0c0c0e" />
  <rect x="14" y="14" width="152" height="152" rx="24" fill="#111114" stroke="rgba(255,255,255,0.08)" />
  <text x="90" y="106" text-anchor="middle" font-size="70" font-family="Georgia, serif" fill="#c8f060">W</text>
  <text x="118" y="122" text-anchor="middle" font-size="42" font-family="Arial, sans-serif" font-weight="700" fill="#e8e8ec">c</text>
</svg>
`;
}

function buildOgImageSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c0c0e" />
      <stop offset="100%" stop-color="#18181c" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="none" stroke="rgba(255,255,255,0.09)" />
  <text x="92" y="170" fill="#c8f060" font-family="Georgia, serif" font-size="72">Walkcat</text>
  <text x="92" y="280" fill="#e8e8ec" font-family="Arial, sans-serif" font-size="72" font-weight="700">Business systems</text>
  <text x="92" y="360" fill="#e8e8ec" font-family="Arial, sans-serif" font-size="72" font-weight="700">&amp; web design</text>
  <text x="92" y="450" fill="#9898a8" font-family="Arial, sans-serif" font-size="34">For Irish trade and service businesses that need less admin, better systems,</text>
  <text x="92" y="495" fill="#9898a8" font-family="Arial, sans-serif" font-size="34">and websites that generate enquiries.</text>
</svg>
`;
}

function enhanceContactForm(html) {
  return html
    .replace(
      '<form class="intake-form" id="intakeForm" onsubmit="handleSubmit(event)">',
      `<form class="intake-form" id="intakeForm" action="mailto:${site.contactEmail}" method="post" enctype="text/plain" data-contact-email="${site.contactEmail}" data-success-path="/start-here/thanks/" onsubmit="handleSubmit(event)">`
    )
    .replace(
      '<input type="text" class="form-input" placeholder="First and last name" required />',
      '<input type="text" name="name" class="form-input" placeholder="First and last name" required />'
    )
    .replace(
      '<input type="text" class="form-input" placeholder="Your company name" required />',
      '<input type="text" name="business_name" class="form-input" placeholder="Your company name" required />'
    )
    .replace(
      '<input type="email" class="form-input" placeholder="your@email.com" required />',
      '<input type="email" name="email" class="form-input" placeholder="your@email.com" required />'
    )
    .replace(
      '<input type="tel" class="form-input" placeholder="+353..." />',
      '<input type="tel" name="phone" class="form-input" placeholder="+353..." />'
    )
    .replace(
      '<input type="url" class="form-input" placeholder="https://yourbusiness.ie" />',
      '<input type="url" name="website" class="form-input" placeholder="https://yourbusiness.ie" />'
    )
    .replace(
      '<select class="form-select" required>',
      '<select name="business_type" class="form-select" required>'
    )
    .replace(
      '<textarea class="form-textarea" style="min-height: 110px;" placeholder="E.g. we\'re manually entering the same data into three different systems, quotes take too long to produce, leads go cold because nobody follows up fast enough..." required></textarea>',
      '<textarea name="time_waste" class="form-textarea" style="min-height: 110px;" placeholder="E.g. we\'re manually entering the same data into three different systems, quotes take too long to produce, leads go cold because nobody follows up fast enough..." required></textarea>'
    )
    .replace(
      '<textarea class="form-textarea" placeholder="Walk me through the thing that frustrates you most. The messier the better — I\'ve seen worse." required></textarea>',
      '<textarea name="current_problem" class="form-textarea" placeholder="Walk me through the thing that frustrates you most. The messier the better — I\'ve seen worse." required></textarea>'
    )
    .replace(
      '<textarea class="form-textarea" style="min-height: 90px;" placeholder="E.g. quotes out in under 30 minutes, leads followed up automatically, a website that actually brings in enquiries..." required></textarea>',
      '<textarea name="desired_outcome" class="form-textarea" style="min-height: 90px;" placeholder="E.g. quotes out in under 30 minutes, leads followed up automatically, a website that actually brings in enquiries..." required></textarea>'
    )
    .replace(
      '<select class="form-select">',
      '<select name="help_type" class="form-select">'
    )
    .replace(
      '<input type="text" class="form-input" placeholder="E.g. need something in place before busy season in April..." />',
      '<input type="text" name="timeline" class="form-input" placeholder="E.g. need something in place before busy season in April..." />'
    );
}

function tr(locale, value) {
  if (locale === defaultLocale) {
    return value;
  }

  return translations[locale]?.[value] ?? value;
}

function translateValue(value, locale, key = '') {
  if (typeof value === 'string') {
    if (['slug', 'path', 'baseUrl', 'contactEmail', 'ogImagePath', 'publishedDate', 'published', 'founder'].includes(key)) {
      return value;
    }
    return tr(locale, value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => translateValue(item, locale, key));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, translateValue(childValue, locale, childKey)])
    );
  }

  return value;
}

function publicPath(locale, basePath) {
  const prefix = locales[locale].prefix;

  if (!prefix) {
    return basePath;
  }

  return basePath === '/' ? `${prefix}/` : `${prefix}${basePath}`;
}

function publicUrl(locale, basePath) {
  return `${site.baseUrl}${publicPath(locale, basePath)}`;
}

function localizedOutputPath(locale, relativePath) {
  if (locale === defaultLocale) {
    return relativePath;
  }

  return path.join(locales[locale].prefix.slice(1), relativePath);
}

function localizeCorePageHtml(pageKey, html, locale) {
  if (locale === defaultLocale) {
    return pageKey === 'contact'
      ? html.replace('data-success-path="/start-here/thanks/"', `data-success-path="${publicPath(locale, '/start-here/thanks/')}"`)
      : html;
  }

  const translatedHtml = html
    .replace(/>([^<>]+)</g, (match, text) => `>${translateHtmlTextNode(text, locale)}<`)
    .replace(/\b(placeholder|aria-label)="([^"]+)"/g, (match, attribute, value) => {
      const translatedValue = tr(locale, decodeHtmlEntities(value));
      return `${attribute}="${escapeHtmlAttribute(translatedValue)}"`;
    });

  if (pageKey !== 'contact') {
    return translatedHtml;
  }

  return translatedHtml.replace(
    /data-success-path="[^"]*"/,
    `data-success-path="${publicPath(locale, '/start-here/thanks/')}"`
  );
}

function translateHtmlTextNode(text, locale) {
  const normalized = decodeHtmlEntities(text).replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return text;
  }

  const translated = tr(locale, normalized);

  if (translated === normalized) {
    return text;
  }

  const leading = text.match(/^\s*/)?.[0] ?? '';
  const trailing = text.match(/\s*$/)?.[0] ?? '';
  return `${leading}${escapeHtml(translated)}${trailing}`;
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function toCrumbName(pageKey, locale) {
  const names = {
    services: 'Services',
    process: 'How I Work',
    cases: 'Case Studies',
    about: 'About',
    contact: 'Start Here',
    blog: 'Blog'
  };
  return tr(locale, names[pageKey] || 'Page');
}

function formatPublished(dateString, locale = defaultLocale) {
  return new Date(dateString).toLocaleDateString(locales[locale].dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function renderAudienceChips(audience, chipClass) {
  return audience
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<span class="${chipClass}">${item}</span>`)
    .join('');
}

function buildExtraStyles() {
  return `/* ============================================
   LANGUAGE SWITCHER
============================================ */
.lang-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(17,17,20,0.88);
}
.lang-switcher-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
  transition: color 0.2s, background 0.2s;
}
.lang-switcher-link:hover {
  color: var(--text);
}
.lang-switcher-link.active {
  color: var(--accent);
  background: var(--accent-dim);
}
.nav-lang {
  display: inline-flex;
}
.mobile-lang {
  display: none;
  width: fit-content;
  margin-bottom: 12px;
}

/* ============================================
   BLOG
============================================ */
.blog-hero { padding-bottom: 40px; }
.blog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-top: 24px;
}
.blog-card {
  display: flex;
  flex-direction: column;
  min-height: 420px;
  background: linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0) 100%), var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 34px;
  transition: border-color 0.25s, transform 0.2s, background 0.2s;
}
.blog-card:hover {
  border-color: var(--border-md);
  transform: translateY(-3px);
  background: var(--bg-3);
}
.blog-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 26px;
}
.blog-card-kicker {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  font-size: 0.72rem;
  color: var(--text-3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.blog-card-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-3);
}
.blog-card-chip-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.blog-card-chip {
  padding: 7px 12px;
  background: var(--accent-dim);
  border: 1px solid rgba(200,240,96,0.12);
  border-radius: 999px;
  font-size: 0.78rem;
  line-height: 1.35;
  color: var(--accent);
}
.blog-card-title {
  font-family: var(--serif);
  font-size: clamp(1.9rem, 2.4vw, 2.7rem);
  line-height: 1.08;
  letter-spacing: -0.02em;
  color: var(--white);
  margin-bottom: 18px;
  max-width: 12ch;
}
.blog-card-title a {
  transition: color 0.2s;
}
.blog-card:hover .blog-card-title a {
  color: var(--accent);
}
.blog-card-desc {
  font-size: 0.98rem;
  color: var(--text-2);
  line-height: 1.78;
  margin-bottom: 28px;
  max-width: 38ch;
}
.blog-card-footer {
  margin-top: auto;
  padding-top: 22px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.blog-card-date {
  font-size: 0.72rem;
  color: var(--text-3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.blog-card-link {
  font-size: 0.88rem;
  color: var(--text);
  transition: color 0.2s;
}
.blog-card-link::after {
  content: ' →';
  color: var(--accent);
}
.blog-card-link:hover {
  color: var(--accent);
}

.blog-post-hero { padding-bottom: 48px; }
.blog-post-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 26px;
}
.blog-post-chip-row {
  max-width: 420px;
}
.blog-post-title {
  max-width: 14ch;
  margin-bottom: 20px;
}
.blog-post-lead {
  max-width: 700px;
}
.blog-post-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) 320px;
  gap: 72px;
  align-items: start;
}
.blog-article {
  max-width: 760px;
}
.blog-article-intro {
  margin-bottom: 40px;
}
.blog-article-intro p {
  margin-bottom: 0;
  font-size: 1.04rem;
  line-height: 1.82;
  color: var(--text);
}
.blog-article-section {
  padding-top: 34px;
  margin-top: 34px;
  border-top: 1px solid var(--border);
}
.blog-article-heading {
  font-family: var(--serif);
  font-size: clamp(1.8rem, 2.4vw, 2.55rem);
  line-height: 1.12;
  letter-spacing: -0.02em;
  color: var(--white);
  margin-bottom: 18px;
}
.blog-article p {
  font-size: 0.99rem;
  color: var(--text-2);
  line-height: 1.82;
  margin-bottom: 18px;
}
.blog-article p:last-child {
  margin-bottom: 0;
}
.blog-sidebar {
  position: sticky;
  top: calc(var(--nav-h) + 36px);
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.blog-sidebar-metrics {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.blog-sidebar-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}
.blog-sidebar-metric:last-child {
  padding-bottom: 0;
  border-bottom: none;
}
.blog-sidebar-label {
  font-size: 0.68rem;
  color: var(--text-3);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.blog-sidebar-value {
  font-size: 0.9rem;
  color: var(--text);
  line-height: 1.55;
}

@media (max-width: 1080px) {
  .nav-lang {
    display: none;
  }
  .mobile-lang {
    display: inline-flex;
  }
  .blog-grid,
  .blog-post-layout {
    grid-template-columns: 1fr;
  }
  .blog-sidebar {
    position: static;
  }
}

@media (max-width: 700px) {
  .blog-card {
    min-height: 0;
    padding: 28px;
  }
  .blog-card-top,
  .blog-post-meta {
    flex-direction: column;
    align-items: flex-start;
  }
  .blog-card-chip-row,
  .blog-post-chip-row {
    justify-content: flex-start;
    max-width: none;
  }
  .blog-card-title,
  .blog-post-title {
    max-width: none;
  }
  .blog-card-desc {
    max-width: none;
  }
}`;
}

function cloneSchema(schema) {
  return JSON.parse(JSON.stringify(schema));
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlAttribute(value) {
  return escapeHtml(value);
}
