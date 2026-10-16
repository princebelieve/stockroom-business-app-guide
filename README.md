# Stockroom Business App handbook website

This folder is a standalone Vercel-ready static website. It is intended to live in its own GitHub repository and Vercel project, separate from the Stockroom app repository and hosting. The public book text is present in `public/index.html`; search engines do not need to execute JavaScript to read it. The page includes an in-book search, linked contents, readable type controls, a dark theme, and a PDF download.

## Repository contents

- `public/` — the website files Vercel publishes.
- `book.md` — the manuscript source used to regenerate the reader page.
- `assets/` — the reader CSS and search/navigation JavaScript source.
- `build-site.mjs` — rebuilds `public/` from `book.md`.
- `configure-site.mjs` — configures production indexing, canonical metadata, crawl rules, sitemap, and absolute social image URL using `BOOK_SITE_URL` or Vercel's production domain.
- `vercel.json` — configures Vercel to run the small URL configuration step and publish `public/`.

## Connect to Vercel

1. Create a separate public GitHub repository for this folder. A suitable repository name is `stockroom-business-app-book`.
2. Push the contents of this folder to that new repository. Do not use the Stockroom app repository.
3. In Vercel, import the new repository. `vercel.json` already sets the framework to Other, build command to `node configure-site.mjs`, and output directory to `public`.
4. Before assigning the final domain, preview the generated Vercel URL. Preview deployments are set to `noindex` to prevent them from competing with the final public URL.
5. When your Cloudflare domain is ready, add that domain to the Vercel project's Domains page and use the DNS records Vercel provides in Cloudflare.
6. Production deployments are crawlable by default. Vercel's production domain is used as the canonical URL and for the sitemap when `BOOK_SITE_URL` is unset. Set `BOOK_SITE_URL` to the final custom HTTPS address (for example `https://books.example.com`) in Vercel's production environment and redeploy so the canonical URL and sitemap use that address. Preview deployments remain `noindex`.
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

The committed `public/` folder is ready for preview without a custom domain. After the production domain is live, verify its robots file, sitemap, canonical URL, and page access in Google Search Console, then request indexing and submit the sitemap. Google decides when and whether to index a page; technical setup cannot guarantee a ranking or search result.

The current social preview uses the book cover (`cover.svg`). The repository does not contain the official Stockroom logo. Add that original logo asset before changing the social preview to use it; the site mark in `favicon.svg` is a book-site monogram, not a confirmed copy of the Stockroom brand logo.
