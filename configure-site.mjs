import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(project, 'public');
const indexPath = path.join(publicDir, 'index.html');
const siteUrl = (process.env.BOOK_SITE_URL || '').trim().replace(/\/$/, '');
const isVercel = process.env.VERCEL === '1';
const isProduction = !isVercel || process.env.VERCEL_ENV === 'production';
const canIndex = isProduction && (!isVercel || Boolean(siteUrl));
let html = await readFile(indexPath, 'utf8');

html = html.replace(/\s*<link rel="canonical" href="[^"]*">/g, '');
html = html.replace(/\s*<meta property="og:url" content="[^"]*">/g, '');
if (siteUrl && isProduction) {
  html = html.replace('</head>', `<link rel="canonical" href="${siteUrl}/">\n<meta property="og:url" content="${siteUrl}/">\n</head>`);
}
html = html.replace(/<meta name="robots" content="[^"]*">/,
  `<meta name="robots" content="${canIndex ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">`);

const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (jsonLd) {
  const book = JSON.parse(jsonLd[1]);
  if (siteUrl && isProduction) book.url = `${siteUrl}/`;
  else delete book.url;
  html = html.replace(jsonLd[0], `<script type="application/ld+json">${JSON.stringify(book)}</script>`);
}
await writeFile(indexPath, html, 'utf8');

const robots = `User-agent: *\nAllow: /\n${siteUrl && isProduction ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`;
await writeFile(path.join(publicDir, 'robots.txt'), robots, 'utf8');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
if (siteUrl && isProduction) {
  await writeFile(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url></urlset>\n`, 'utf8');
} else {
  await rm(sitemapPath, { force: true });
}
console.log(canIndex ? `Public canonical configured: ${siteUrl || 'static host root'}` : 'Preview deployment set to noindex until the public domain is configured.');
