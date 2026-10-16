const root = document.documentElement;
const search = document.querySelector('#book-search');
const results = document.querySelector('#search-results');
const article = document.querySelector('.book-content');
const searchable = [...article.querySelectorAll('h2,h3,h4,p,li,td')];
const sectionHeadings = [...article.querySelectorAll('h2,h3,h4')];

function excerpt(text, query) {
  const lower = text.toLowerCase();
  const at = lower.indexOf(query.toLowerCase());
  const start = Math.max(0, at - 85);
  return `${start ? '…' : ''}${text.slice(start, Math.min(text.length, at + query.length + 135)).trim()}${at + query.length + 135 < text.length ? '…' : ''}`;
}

function runSearch() {
  const query = search.value.trim();
  results.replaceChildren();
  if (!query) { results.hidden = true; return; }
  const matches = searchable.filter(node => node.textContent.toLowerCase().includes(query.toLowerCase())).slice(0, 12);
  if (!matches.length) {
    const empty = document.createElement('div'); empty.className = 'search-empty'; empty.textContent = 'No matches. Try another word or phrase.'; results.append(empty);
  } else {
    for (const node of matches) {
      const heading = node.matches('h2,h3,h4') ? node.textContent : sectionHeadings
        .filter(item => item.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING).at(-1)?.textContent || 'Book text';
      const target = node.matches('h2,h3,h4') ? node : node.closest('h2,h3,h4') || node;
      if (!target.id) target.id = `search-hit-${searchable.indexOf(node)}`;
      const link = document.createElement('a'); link.className = 'search-result'; link.href = `#${target.id}`;
      const strong = document.createElement('strong'); strong.textContent = heading || section.textContent.slice(0, 90);
      const summary = document.createElement('span'); summary.textContent = excerpt(node.textContent.replace(/\s+/g, ' '), query);
      link.append(strong, summary); link.addEventListener('click', () => { results.hidden = true; search.value = ''; }); results.append(link);
    }
  }
  results.hidden = false;
}

search.addEventListener('input', runSearch);
search.addEventListener('keydown', event => { if (event.key === 'Escape') { results.hidden = true; search.blur(); } });
document.querySelector('#open-search').addEventListener('click', () => { search.focus(); search.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus(); } });
document.addEventListener('click', event => { if (!event.target.closest('.search-wrap')) results.hidden = true; });

document.querySelector('#font-smaller').addEventListener('click', () => {
  const size = parseFloat(getComputedStyle(root).getPropertyValue('--reader-size')) || 1.14;
  root.style.setProperty('--reader-size', `${Math.max(1, size - .04)}rem`);
});
document.querySelector('#font-larger').addEventListener('click', () => {
  const size = parseFloat(getComputedStyle(root).getPropertyValue('--reader-size')) || 1.14;
  root.style.setProperty('--reader-size', `${Math.min(1.42, size + .04)}rem`);
});
document.querySelector('#toggle-theme').addEventListener('click', () => {
  const night = root.dataset.theme !== 'night';
  root.dataset.theme = night ? 'night' : 'day';
  document.querySelector('#toggle-theme').setAttribute('aria-pressed', String(night));
});

const bar = document.querySelector('.progress-bar');
function updateProgress() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = `${distance > 0 ? Math.min(100, scrollY / distance * 100) : 0}%`;
}
addEventListener('scroll', updateProgress, { passive: true });
addEventListener('resize', updateProgress); updateProgress();

const tocLinks = [...document.querySelectorAll('.toc-list a')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      for (const link of tocLinks) link.classList.toggle('active', link.hash === `#${entry.target.id}`);
    }
  }, { rootMargin: '-18% 0px -72% 0px' });
  for (const heading of article.querySelectorAll('h2[id]')) observer.observe(heading);
}
