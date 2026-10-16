# Stockroom Business App handbook website

This folder is a standalone Vercel-ready static website. It is intended to live in its own GitHub repository and Vercel project, separate from the Stockroom app repository and hosting. The public book text is present in `public/index.html`; search engines do not need to execute JavaScript to read it. The page includes an in-book search, linked contents, readable type controls, a dark theme, and a PDF download.

## Repository contents

- `public/` — the website files Vercel publishes.
- `book.md` — the manuscript source used to regenerate the reader page.
- `assets/` — the reader CSS and search/navigation JavaScript source.
- `build-site.mjs` — rebuilds `public/` from `book.md`.
- `configure-site.mjs` — sets the production canonical URL, crawl rules, and sitemap from `BOOK_SITE_URL`.
- `vercel.json` — configures Vercel to run the small URL configuration step and publish `public/`.

## Connect to Vercel

1. Create a separate public GitHub repository for this folder. A suitable repository name is `stockroom-business-app-book`.
2. Push the contents of this folder to that new repository. Do not use the Stockroom app repository.
3. In Vercel, import the new repository. `vercel.json` already sets the framework to Other, build command to `node configure-site.mjs`, and output directory to `public`.
4. Before assigning the final domain, preview the generated Vercel URL. Preview deployments are set to `noindex` to prevent them from competing with the final public URL.
5. When your Cloudflare domain is ready, add that domain to the Vercel project's Domains page and use the DNS records Vercel provides in Cloudflare.
6. In Vercel's production environment variables, set `BOOK_SITE_URL` to the canonical HTTPS address, for example `https://books.example.com`, and redeploy. The production build then adds its canonical URL, allows indexing, and creates an absolute sitemap.
7. Add the deployed domain property to Google Search Console, inspect the final URL, and submit `/sitemap.xml`.

Google can crawl an accessible page that returns success and has indexable content, but meeting those technical requirements does not guarantee that Google will include it in results. See [Google's technical requirements](https://developers.google.com/search/docs/essentials/technical) and [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Rebuild the static reader

With Node.js installed, run:

```sh
node build-site.mjs
```

To generate canonical metadata and a sitemap for a known public URL outside Vercel:

```sh
node build-site.mjs --site-url=https://books.example.com
```

The committed `public/` folder is ready for preview without a custom domain. Do not add a made-up canonical URL or submit the temporary Vercel URL as the final book address.
