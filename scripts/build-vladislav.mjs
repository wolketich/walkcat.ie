import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'src/vladislav');
const output = path.join(root, 'vladislav');
const data = JSON.parse(await readFile(path.join(source, 'services.json'), 'utf8'));
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euros = (n) => `€${n.toLocaleString('en-IE')}`;
const mail = (service = 'a project') => `mailto:${data.email}?subject=${encodeURIComponent(`Let's discuss ${service}`)}`;
const arrow = '<span aria-hidden="true">↗</span>';
const download = './vladislav-cernega-rate-card.pdf';
const serviceRow = (s) => `<article class="service-row" id="${s.id}"><div><h3>${escape(s.name)}</h3><p>${escape(s.scope)}</p></div><div class="service-price"><span>From</span> <strong>${euros(s.price)}</strong><span> / ${s.unit}</span>${s.setup ? `<small>+ ${euros(s.setup)} one-time setup</small>` : ''}</div><a class="service-link" href="${mail(s.name)}" aria-label="Discuss ${escape(s.name)}">${arrow}</a></article>`;

await mkdir(output, { recursive: true });
await cp(path.join(source, 'fonts'), path.join(output, 'fonts'), {recursive:true});
await mkdir(path.join(output, 'media'), { recursive: true });
for (const project of data.projects) await cp(path.join(source, 'media', project.image), path.join(output, 'media', project.image));
await cp(path.join(source, 'styles.css'), path.join(output, 'styles.css'));
await writeFile(path.join(output, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#344b36"/><text x="32" y="43" text-anchor="middle" font-family="Georgia,serif" font-size="35" fill="#faf8f2">vc</text></svg>');

const html = `<!doctype html>
<html lang="en-IE">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Vladislav Cernega | Websites, Marketing & Design</title>
  <meta name="description" content="Websites, digital marketing and creative services for Irish small businesses. Work directly with Vladislav Cernega. Websites from €750, with clear service pricing.">
  <meta name="theme-color" content="#f7f6f0">
  <meta property="og:type" content="website"><meta property="og:title" content="Vladislav Cernega — Websites, marketing & design">
  <meta property="og:description" content="Independent expertise. Clear prices. Thoughtful websites, marketing and design for your business.">
  <meta property="og:image" content="https://walkcat.net/vladislav/media/share.jpg">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Vladislav Cernega — Websites, marketing and design. Websites from €750.">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://walkcat.net/vladislav/">
  <link rel="icon" href="./favicon.svg" type="image/svg+xml">
  <link rel="preload" href="./fonts/instrument-serif.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="preload" href="./fonts/dm-sans.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header wrap">
  <a class="wordmark" href="#" aria-label="Vladislav Cernega, back to top">Vladislav Cernega<span>Independent digital & creative</span></a>
  <nav aria-label="Main navigation"><a href="#work">Selected work</a><a href="#pricing">Services & prices</a><a class="nav-contact" href="${mail()}">Let’s talk ${arrow}</a></nav>
</header>
<main id="main">
<section class="hero wrap" aria-labelledby="hero-title">
  <div class="hero-copy"><p class="eyebrow"><span class="dot"></span> Based in Dublin. Built around you.</p>
  <h1 id="hero-title">Websites,<br>marketing <em>& design</em><br>for your business.</h1>
  <p class="hero-description">Good work deserves to be seen. I help small businesses show up with a better website, a clearer identity and marketing that has a plan.</p>
  <div class="hero-actions"><a class="button" href="${mail()}">Discuss your project ${arrow}</a><a class="text-link" href="${download}" download>Download rate card <span aria-hidden="true">↓</span></a></div>
  <p class="hero-note">One person to talk to. Clear scope. Prices upfront.</p></div>
  <div class="hero-art" aria-label="A selection of website designs by Vladislav Cernega">
    <div class="art-topline"><span>THOUGHTFUL DESIGN</span><span>PRACTICAL PURPOSE</span></div>
    <div class="preview preview-main"><div class="browser-bar" aria-hidden="true"><i></i><i></i><i></i><span>velvetbathrooms.ie</span></div><img src="./media/velvet.webp" width="1200" height="875" fetchpriority="high" alt="Velvet Bathrooms website design"></div>
    <div class="preview preview-small"><div class="browser-bar" aria-hidden="true"><i></i><i></i><i></i><span>myballoons.ie</span></div><img src="./media/myballoons.webp" width="1200" height="875" alt="MyBalloons website design"></div>
    <div class="art-mark" aria-hidden="true">Made<br><em>to matter.</em></div>
    <div class="art-bottomline"><span>DESIGN / BUILD / GROW</span><a href="#work">Explore the work <span aria-hidden="true">↓</span></a></div>
  </div>
</section>
<div class="intro-strip wrap"><p>For the business you’re building.</p><div><span>Websites</span><span>Search & ads</span><span>Brand & content</span></div></div>
<section id="work" class="section wrap" aria-labelledby="work-title">
  <div class="section-heading"><div><p class="eyebrow">01 / Selected work</p><h2 id="work-title">Different businesses.<br><em>Their own character.</em></h2></div><p>A few websites I’ve worked on.<br>Each shaped around the business behind it.</p></div>
  <div class="project-grid">${data.projects.map((p,i)=>`<article class="project"><a href="./media/${p.image}" class="project-image" aria-label="View ${escape(p.name)} website screenshot"><img src="./media/${p.image}" width="1200" height="875" loading="lazy" alt="${escape(p.name)} website homepage"><span class="image-action" aria-hidden="true">View design ↗</span></a><div class="project-meta"><p>${escape(p.category)}</p><span>0${i+1}</span></div><h3>${escape(p.name)}</h3><p class="project-description">${escape(p.description)}</p></article>`).join('')}</div>
</section>
<section id="pricing" class="websites-section" aria-labelledby="pricing-title"><div class="wrap section">
  <div class="section-heading"><div><p class="eyebrow">02 / Websites</p><h2 id="pricing-title">A proper home<br><em>for your business.</em></h2></div><p>A new website or a fresh start for an existing one.<br>Choose the scale that fits. We’ll agree the details together.</p></div>
  <div class="packages">${data.websites.map((w,i)=>`<article class="package ${i===1?'package-featured':''}"><div class="package-top"><span>0${i+1}</span>${i===1?'<span class="package-label">For established businesses</span>':''}</div><h3>${escape(w.name)}</h3><p class="package-tagline">${escape(w.tagline)}</p><p class="package-price"><span>From</span> ${euros(w.price)}<small>one-time project</small></p><p class="package-description">${escape(w.description)}</p><ul>${w.features.map(f=>`<li>${escape(f)}</li>`).join('')}</ul><a class="button ${i===1?'':'button-outline'}" href="${mail(w.name)}">Discuss this website ${arrow}</a></article>`).join('')}</div>
  <div class="pricing-footnote"><p>${escape(data.pricingNote)}<br>${escape(data.vat)}</p><p>50% to begin · 50% before handover<br>Two consolidated revision rounds included</p></div>
  <div class="care-row"><div><span class="eyebrow">After launch</span><h3>Keep your website in good hands.</h3><p>${escape(data.services[0].scope)}</p></div><a href="${mail('Website care')}" class="care-price">Website care from <strong>€75<span>/month</span></strong>${arrow}</a></div>
</div></section>
<section id="services" class="section wrap" aria-labelledby="services-title">
  <div class="section-heading"><div><p class="eyebrow">03 / Beyond the website</p><h2 id="services-title">Get seen.<br><em>Stay remembered.</em></h2></div><p>Support for what comes next, from getting found on Google to making your next post look the part.</p></div>
  <div class="service-group"><h3 class="group-title">Search & advertising <span>01—04</span></h3><div>${data.services.filter(s=>s.category==='Search & advertising').map(serviceRow).join('')}</div></div>
  <div class="service-group"><h3 class="group-title">Content & design <span>05—08</span></h3><div>${data.services.filter(s=>s.category==='Content & design').map(serviceRow).join('')}</div></div>
  <p class="services-note">${escape(data.pricingNote)} ${escape(data.vat)}<br>Advertising spend, hosting, domains and third-party subscriptions are separate.</p>
  <a class="text-link" href="${download}" download>Keep all the details. Download the rate card <span aria-hidden="true">↓</span></a>
</section>
<section class="process-section" id="process" aria-labelledby="process-title"><div class="wrap section"><div class="section-heading"><div><p class="eyebrow">04 / Working together</p><h2 id="process-title">A conversation.<br><em>Then a clear plan.</em></h2></div><p>I’m Vladislav, an independent digital and creative professional based in Dublin. You’ll work directly with me, from the first email to the final details.</p></div><div class="steps"><article><span>01</span><h3>Tell me what you need.</h3><p>Your business, what you want to improve and any ideas you already have. A short email is plenty to start.</p></article><article><span>02</span><h3>Know what’s included.</h3><p>I’ll put together a scope, price and timeline. We agree on the work before the project begins.</p></article><article><span>03</span><h3>Make it happen.</h3><p>I design and build, you review. We refine the details together, then prepare everything for handover.</p></article></div></div></section>
<section class="section wrap faq-section" aria-labelledby="faq-title"><div><p class="eyebrow">05 / A few useful details</p><h2 id="faq-title">Before<br><em>we begin.</em></h2></div><div class="faqs">
  <details><summary>Are these fixed prices?<span aria-hidden="true">+</span></summary><p>${escape(data.pricingNote)} ${escape(data.vat)} Extra pages, functionality or deliverables are quoted separately.</p></details>
  <details><summary>What do you need from me?<span aria-hidden="true">+</span></summary><p>Your business details, existing branding, images and a rough outline of what you’d like to say. Website packages include light editing of supplied copy. Full copywriting and new photography can be scoped separately.</p></details>
  <details><summary>How do payments and revisions work?<span aria-hidden="true">+</span></summary><p>${escape(data.terms[0])} ${escape(data.terms[1])} ${escape(data.terms[2])}</p></details>
  <details><summary>What costs are separate?<span aria-hidden="true">+</span></summary><p>${escape(data.terms[3])} ${escape(data.terms[4])}</p></details>
  <details><summary>How long will my project take?<span aria-hidden="true">+</span></summary><p>That depends on the scope and when your content is ready. I’ll confirm a timeline with your quote, including time for your feedback, before we start.</p></details>
  <details><summary>Can I start with just one service?<span aria-hidden="true">+</span></summary><p>Absolutely. You can commission a website, a design or a marketing service on its own. We’ll start with what your business needs now.</p></details>
</div></section>
<section id="contact" class="contact-section"><div class="wrap contact-inner"><p class="eyebrow">Your next chapter</p><h2>Let’s make something<br><em>good for your business.</em></h2><p>Tell me a little about what you’re working on.<br>I’ll help you work out the next step.</p><a class="button button-light" href="${mail()}">Discuss your project ${arrow}</a><a class="contact-email" href="mailto:${data.email}">${data.email}</a><span class="contact-monogram" aria-hidden="true">vc.</span></div></section>
</main>
<footer class="wrap site-footer"><a class="wordmark" href="#">Vladislav Cernega<span>Websites, marketing & design.</span></a><p>Dublin, Ireland<br>© 2026 Vladislav Cernega</p><a class="text-link" href="${download}" download>Rate card / PDF <span aria-hidden="true">↓</span></a></footer>
</body></html>`;
await writeFile(path.join(output, 'index.html'), html);

const pythonCandidates = process.env.PYTHON ? [process.env.PYTHON] : [
  'python3', path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3.12')
];
const python = pythonCandidates.find(command => spawnSync(command, ['-c', 'import reportlab, PIL'], {stdio:'ignore'}).status === 0);
if (!python) throw new Error('PDF build requires Python with reportlab and Pillow. Install them or set PYTHON to the appropriate interpreter.');
const pdf = spawnSync(python, [path.join(root, 'scripts/build-rate-card.py')], {cwd:root, stdio:'inherit'});
if (pdf.status !== 0) throw new Error('Rate card generation failed.');
console.log('Built /vladislav/ and the three-page rate card.');
