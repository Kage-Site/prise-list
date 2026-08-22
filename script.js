document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     1. HERO SLIDER — cross-fades main1.jpg / main2.jpg / main3.jpg
     ========================================================= */
  (function initHeroSlider() {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll('.slide'));
    if (slides.length <= 1) return;

    let current = slides.findIndex(s => s.classList.contains('is-active'));
    if (current === -1) current = 0;

    const INTERVAL_MS = 4000;

    setInterval(() => {
      const next = (current + 1) % slides.length;
      slides[current].classList.remove('is-active');
      slides[next].classList.add('is-active');
      current = next;
    }, INTERVAL_MS);
  })();

  /* =========================================================
     2. DYNAMIC PRICE LIST — fetched via CSV from Google Sheets
     ========================================================= */
  // Прямая стабильная CSV-ссылка на твою опубликованную таблицу
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtRlSaOn67brAycpuU2mKRZNPbVR2X8PtenLSboi6tuNUWaLVzmr6iUHsPGulOIY90u8yBKEf0PU9a/pub?output=csv';

  const container = document.getElementById('pricelist-container');

  const lipsDividerHTML = `
    <div class="divider" aria-hidden="true">
      <span class="line"></span>
      <svg class="lips" viewBox="0 0 64 28"><use href="#lipsShape"/></svg>
      <span class="line"></span>
    </div>`;

  function escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Надёжный CSV-парсер, учитывающий кавычки и переносы
  function parseCSV(text) {
    const lines = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(cell.trim());
        cell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        row.push(cell.trim());
        if (row.some(c => c !== '')) lines.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
    if (cell !== '' || row.length > 0) {
      row.push(cell.trim());
      if (row.some(c => c !== '')) lines.push(row);
    }
    return lines;
  }

  function renderPriceList(rows) {
    if (!rows || rows.length < 2) {
      container.innerHTML = '<p class="pricelist-error">Наразі прайс недоступний.</p>';
      return;
    }

    // Читаем заголовки колонок
    const headers = rows[0].map(h => h.toLowerCase().trim());
    
    const idxCategory = headers.findIndex(h => ['category', 'категорія', 'категория', 'розділ', 'раздел'].includes(h));
    const idxSubtitle = headers.findIndex(h => ['subtitle', 'підзаголовок', 'подзаголовок'].includes(h));
    const idxTitle    = headers.findIndex(h => ['title', 'name', 'назва', 'название', 'послуга', 'услуга'].includes(h));
    const idxDesc     = headers.findIndex(h => ['description', 'desc', 'опис', 'описание'].includes(h));
    const idxNote     = headers.findIndex(h => ['note', 'notes', 'примітка', 'примечание'].includes(h));
    const idxPrice    = headers.findIndex(h => ['price', 'ціна', 'цена', 'вартість', 'стоимость'].includes(h));

    const categories = [];
    const byCategory = new Map();

    // Разбираем строки данных
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const title = idxTitle !== -1 ? r[idxTitle] : '';
      const category = (idxCategory !== -1 ? r[idxCategory] : '') || 'Інше';

      if (!title) continue; // пропускаем пустые строки

      if (!byCategory.has(category)) {
        byCategory.set(category, {
          subtitle: idxSubtitle !== -1 ? r[idxSubtitle] : '',
          items: []
        });
        categories.push(category);
      }

      const entry = byCategory.get(category);
      if (!entry.subtitle && idxSubtitle !== -1) {
        entry.subtitle = r[idxSubtitle] || '';
      }

      entry.items.push({
        title,
        description: idxDesc !== -1 ? r[idxDesc] : '',
        note: idxNote !== -1 ? r[idxNote] : '',
        price: idxPrice !== -1 ? r[idxPrice] : ''
      });
    }

    if (categories.length === 0) {
      container.innerHTML = '<p class="pricelist-error">Наразі прайс недоступний.</p>';
      return;
    }

    const sectionsHTML = categories.map((catName, catIdx) => {
      const cat = byCategory.get(catName);

      const itemsHTML = cat.items.map((item, i) => {
        const num = String(i + 1).padStart(2, '0');
        const hasDesc = Boolean(item.description);
        const noteHTML = item.note ? ` <em>${escapeHTML(item.note)}</em>` : '';

        return `
          <li class="item${hasDesc ? ' item--desc' : ''}">
            <div class="item-row">
              <span class="num">${num}</span>
              <span class="name">${escapeHTML(item.title)}${noteHTML}</span>
              <span class="leader"></span>
              <span class="price">${escapeHTML(item.price)}</span>
            </div>
            ${hasDesc ? `<span class="desc">${escapeHTML(item.description)}</span>` : ''}
          </li>`;
      }).join('');

      const sectionHTML = `
        <section class="section" data-reveal>
          <div class="section-title">
            <span class="title-diamond"></span>
            <h2>${escapeHTML(catName)}</h2>
            ${cat.subtitle ? `<span class="title-sub">${escapeHTML(cat.subtitle)}</span>` : '<span class="title-sub"></span>'}
          </div>
          <ul class="items">
            ${itemsHTML}
          </ul>
        </section>`;

      return catIdx < categories.length - 1 ? sectionHTML + lipsDividerHTML : sectionHTML;
    }).join('');

    container.innerHTML = sectionsHTML;
    initItemInteractivity();
  }

  function initItemInteractivity() {
    const items = container.querySelectorAll('.item');

    items.forEach(item => {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
    });

    container.addEventListener('click', (e) => {
      const item = e.target.closest('.item');
      if (!item) return;
      items.forEach(other => {
        if (other !== item) other.classList.remove('is-tapped');
      });
      item.classList.toggle('is-tapped');
    });

    container.addEventListener('keydown', (e) => {
      const item = e.target.closest('.item');
      if (!item) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        items.forEach(other => {
          if (other !== item) other.classList.remove('is-tapped');
        });
        item.classList.toggle('is-tapped');
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.item')) {
        items.forEach(i => i.classList.remove('is-tapped'));
      }
    });
  }

  async function loadPriceList() {
    try {
      const res = await fetch(SHEET_CSV_URL);
      if (!res.ok) throw new Error('HTTP Error: ' + res.status);
      const text = await res.text();
      
      const rows = parseCSV(text);
      renderPriceList(rows);
    } catch (err) {
      console.error('Failed to load price list:', err);
      container.innerHTML = '<p class="pricelist-error">Не вдалося завантажити прайс. Спробуйте оновити сторінку.</p>';
    }
  }

  if (container) {
    loadPriceList();
  }

});