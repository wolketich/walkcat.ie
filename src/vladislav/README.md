# Personal services page

Run `npm run build:vladislav` for the standalone page and PDF, or `npm run build` for the whole site. The build needs Python 3 with `reportlab` and `Pillow`; set `PYTHON` to your interpreter if needed. It also detects the bundled Codex Python runtime. No browser dependencies are needed to build.

Edit `services.json` for service names, prices, inclusions and terms. Both the page and PDF are generated from it. The website template is in `scripts/build-vladislav.mjs`, its isolated CSS is here, and the PDF layout is in `scripts/build-rate-card.py`.

Generated files live under `/vladislav/`. The shareable PDF is also in `output/pdf/`. Preview with `npm run dev`, then visit `/vladislav/`. Nothing is deployed automatically.

The canonical URL uses `walkcat.net`, matching the repository's CNAME. If the destination changes, update the canonical and social-image URLs in the page generator. Existing Walkcat pages and their domain configuration are preserved.

The personal page uses self-hosted Instrument Serif and DM Sans fonts. Their OFL licence files are included in `fonts/`. Portfolio images are local homepage screenshots captured from the three client projects, not claims about their marketing results. Re-capture only if the underlying designs change.

The landing page sends enquiries through email links and does not install analytics or cookies. Clients' future contact forms and marketing tracking are scoped as part of their own website projects.
