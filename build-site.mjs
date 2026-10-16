import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const siteDir = path.dirname(fileURLToPath(import.meta.url));
const markdown = await readFile(path.join(siteDir, 'book.md'), 'utf8');
const css = await readFile(path.join(siteDir, 'assets', 'book.css'), 'utf8');
const js = await readFile(path.join(siteDir, 'assets', 'book.js'), 'utf8');
const pdfName = 'Stockroom-Business-App-by-S-B-Ibhadode.pdf';
const publicDir = path.join(siteDir, 'public');
const configuredUrl = process.argv.find(arg => arg.startsWith('--site-url='))?.slice('--site-url='.length)
  || process.env.BOOK_SITE_URL || '';
const siteUrl = configuredUrl.replace(/\/$/, '');

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function inline(value) {
  const code = [];
  let result = escapeHtml(value).replace(/`([^`]+)`/g, (_, text) => {
    code.push(`<code>${text}</code>`); return `\u0000${code.length - 1}\u0000`;
  });
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\u0000(\d+)\u0000/g, (_, index) => code[Number(index)]);
  return result;
}

function slug(value) {
  return value.toLowerCase().replace(/&/g, ' ').replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

const lines = markdown.replaceAll('\r\n', '\n').split('\n');
const content = [];
const headings = [];
let title = 'Stockroom Business App by S. B. Ibhadode';
let subtitle = 'A practical business-school guide to choosing, setting up, and operating a business in Stockroom';
let frontMatter = true;
let skipContents = false;

for (let index = 0; index < lines.length;) {
  const line = lines[index];
  if (frontMatter) {
    const titleLine = line.match(/^# (.+)$/);
    if (titleLine) title = titleLine[1];
    const deckLine = line.match(/^\*\*(.+)\*\*$/);
    if (deckLine && !subtitle) subtitle = deckLine[1];
    if (deckLine && deckLine[1].startsWith('A practical')) subtitle = deckLine[1];
    if (line === '---') frontMatter = false;
    index++; continue;
  }
  if (line === '## Table of contents') { skipContents = true; index++; continue; }
  if (skipContents) { if (line === '---') skipContents = false; index++; continue; }
  if (!line.trim()) { index++; continue; }
  if (line === '---') { content.push('<hr>'); index++; continue; }
  const heading = line.match(/^(#{2,6}) (.+)$/);
  if (heading) {
    const level = heading[1].length;
    const text = heading[2];
    const id = slug(text);
    if (level === 2) headings.push({ text, id });
    content.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
    index++; continue;
  }
  if (line.startsWith('|')) {
    const rows = [];
    while (index < lines.length && lines[index].startsWith('|')) {
      const row = lines[index].split('|').slice(1, -1).map(cell => cell.trim());
      if (!row.every(cell => /^:?-{3,}:?$/.test(cell))) rows.push(row);
      index++;
    }
    if (rows.length) {
      content.push('<div class="table-scroll"><table><thead><tr>' + rows[0].map(cell => `<th>${inline(cell)}</th>`).join('') + '</tr></thead><tbody>');
      for (const row of rows.slice(1)) content.push('<tr>' + row.map(cell => `<td>${inline(cell)}</td>`).join('') + '</tr>');
      content.push('</tbody></table></div>');
    }
    continue;
  }
  if (/^\s*>/.test(line)) {
    const quote = [];
    while (index < lines.length && /^\s*>/.test(lines[index])) quote.push(lines[index++].replace(/^\s*> ?/, ''));
    content.push(`<blockquote>${quote.map(item => `<p>${inline(item)}</p>`).join('')}</blockquote>`);
    continue;
  }
  if (/^\s*[-*] /.test(line) || /^\s*\d+\. /.test(line)) {
    const ordered = /^\s*\d+\. /.test(line), tag = ordered ? 'ol' : 'ul';
    content.push(`<${tag}>`);
    while (index < lines.length && (ordered ? /^\s*\d+\. /.test(lines[index]) : /^\s*[-*] /.test(lines[index]))) {
      content.push(`<li>${inline(lines[index].replace(ordered ? /^\s*\d+\. / : /^\s*[-*] /, ''))}</li>`); index++;
    }
    content.push(`</${tag}>`); continue;
  }
  const paragraph = [line]; index++;
  while (index < lines.length && lines[index].trim() && !/^(#{1,6} |---$|\||\s*>|\s*[-*] |\s*\d+\. )/.test(lines[index])) paragraph.push(lines[index++]);
  content.push(`<p>${inline(paragraph.join(' '))}</p>`);
}

const tocItems = headings.filter(item => item.text !== 'Sources and evidence notes')
  .map(item => `<li><a href="#${item.id}">${escapeHtml(item.text)}</a></li>`).join('\n');
const chapterCount = headings.filter(item => /^Chapter \d+:/.test(item.text)).length;
const chapter21 = markdown.split('### In-app Help chapters')[1] || '';
const referenceCount = (chapter21.match(/^#### \d+\./gm) || []).length;
const description = 'A practical guide to setting up and using Stockroom Business App, with workspace walkthroughs for retail, oil sales, services, restaurants, hotels, nightlife and more.';
const canonical = siteUrl ? `<link rel="canonical" href="${siteUrl}/">` : '';
const bookUrl = siteUrl ? `"url":"${siteUrl}/",` : '';

const page = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stockroom Business App by S. B. Ibhadode | Setup and workspace guide</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="author" content="S. B. Ibhadode">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#f1f0e9">
<meta property="og:type" content="book"><meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="cover.svg">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="cover.svg">
${canonical}
<link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/book.css">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Book",${bookUrl}"name":"${escapeHtml(title)}","author":{"@type":"Person","name":"S. B. Ibhadode"},"inLanguage":"en","genre":"Business education","bookFormat":"https://schema.org/EBook","abstract":"${escapeHtml(description)}","workExample":{"@type":"Book","bookFormat":"https://schema.org/PDF","encodingFormat":"application/pdf","name":"Download the complete book"}}</script>
</head><body><div class="progress-track" aria-hidden="true"><span class="progress-bar"></span></div>
<header class="topbar"><div class="topbar-inner"><a class="brand" href="#top" aria-label="Stockroom handbook home"><span class="brand-mark">S</span><span>Stockroom handbook<small>by S. B. Ibhadode</small></span></a><nav class="top-actions" aria-label="Book actions"><button class="button button-icon" id="open-search" type="button" aria-label="Search the book" title="Search (Ctrl+K)">⌕</button><a class="button button-primary" href="${pdfName}" download>Download PDF <span aria-hidden="true">↓</span></a></nav></div></header>
<div class="layout" id="top"><aside class="sidebar" aria-label="Table of contents"><p class="sidebar-title">In this book</p><nav><ol class="toc-list">${tocItems}</ol></nav></aside>
<main class="content-column"><section class="hero" aria-labelledby="book-title"><p class="eyebrow">A practical business-school handbook</p><h1 id="book-title">${escapeHtml(title)}</h1><p class="hero-deck">${escapeHtml(subtitle)}</p><p class="hero-byline">Written by <strong>S. B. Ibhadode</strong> <span aria-hidden="true">·</span> Reader edition</p><div class="hero-actions"><a class="button button-primary" href="#how-to-use-this-book">Start reading <span aria-hidden="true">→</span></a><a class="button" href="${pdfName}" download>Get the PDF</a></div><div class="book-meta"><span>${chapterCount} chapters</span><span>${referenceCount} task guides</span><span>Free to read</span></div></section>
<details class="mobile-toc"><summary>Open table of contents</summary><nav><ol class="toc-list">${tocItems}</ol></nav></details>
<section class="reader-tools" aria-label="Reading tools"><div class="search-wrap"><span class="search-icon" aria-hidden="true">⌕</span><label class="sr-only" for="book-search">Search the book</label><input id="book-search" type="search" placeholder="Search chapters, workspaces, or controls" autocomplete="off"><div class="search-results" id="search-results" role="listbox" aria-label="Search results" hidden></div></div><span class="tool-separator" aria-hidden="true"></span><button class="tool-button" id="font-smaller" type="button" aria-label="Decrease text size" title="Smaller text">A−</button><button class="tool-button" id="font-larger" type="button" aria-label="Increase text size" title="Larger text">A+</button><button class="tool-button" id="toggle-theme" type="button" aria-label="Toggle dark reading theme" aria-pressed="false" title="Reading theme">◐</button></section>
<article class="book-content">${content.join('\n')}</article></main></div>
<footer class="site-footer"><span>Stockroom Business App by S. B. Ibhadode</span><a href="${pdfName}" download>Download the complete book as PDF</a></footer>
<script src="assets/book.js" defer></script></body></html>`;

await mkdir(path.join(publicDir, 'assets'), { recursive: true });
await writeFile(path.join(publicDir, 'index.html'), page, 'utf8');
await copyFile(path.join(siteDir, 'assets', 'book.css'), path.join(publicDir, 'assets', 'book.css'));
await copyFile(path.join(siteDir, 'assets', 'book.js'), path.join(publicDir, 'assets', 'book.js'));
await copyFile(path.join(siteDir, 'cover.svg'), path.join(publicDir, 'cover.svg'));
await copyFile(path.join(siteDir, 'favicon.svg'), path.join(publicDir, 'favicon.svg'));
await copyFile(path.join(siteDir, pdfName), path.join(publicDir, pdfName));
const standalone = page.replace('<link rel="stylesheet" href="assets/book.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="assets/book.js" defer></script>', `<script>\n${js}\n</script>`)
  .replaceAll('href="favicon.svg"', 'href="site/public/favicon.svg"')
  .replaceAll('content="cover.svg"', 'content="site/public/cover.svg"');
await writeFile(path.join(siteDir, 'book-reader.html'), standalone, 'utf8');

await writeFile(path.join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`, 'utf8');
if (siteUrl) {
  await writeFile(path.join(publicDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url></urlset>\n`, 'utf8');
} else {
  await rm(path.join(publicDir, 'sitemap.xml'), { force: true });
}
console.log(`Built ${path.join(publicDir, 'index.html')}`);
console.log(`TOC chapters: ${headings.length}; operator topics: ${referenceCount}`);
if (!siteUrl) console.log('No deployment origin set; canonical URL and sitemap are intentionally deferred.');
