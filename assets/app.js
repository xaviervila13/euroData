'use strict';

const state = { data: null, lang: 'es' };

const ICONS = {
    euro: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><text x="15" y="22" text-anchor="middle" font-size="17" font-weight="bold" fill="currentColor" stroke="none">&#8364;</text></svg>',
    food: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 11c-4-2.5-9 .5-9 6.5 0 5 4 9.5 9 9.5s9-4.5 9-9.5c0-6-5-9-9-6.5z"/><path d="M15 11c-.5-3.5 1.5-6 4-7"/></svg>',
    bolt: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M17 3L7 17h6l-2 10 12-15h-7l1-9z"/></svg>',
    house: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15L15 4l11 11"/><path d="M6 13v13h7v-7h4v7h7V13"/></svg>',
    car: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18l3-7h14l3 7"/><rect x="3" y="18" width="24" height="7" rx="2"/><circle cx="8" cy="25" r="2.5"/><circle cx="22" cy="25" r="2.5"/></svg>',
    fork: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v8"/><path d="M7 3v5a3 3 0 006 0V3"/><path d="M10 11v16"/><path d="M21 3c-2.5 3.5-2.5 8 0 11v13"/></svg>',
    coffee: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h15v6a7 7 0 01-7 7h-1a7 7 0 01-7-7v-6z"/><path d="M20 13h2a3.5 3.5 0 010 7h-2"/><path d="M9 8V5M13 8V5"/></svg>',
    beer: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9h14v18H6z"/><path d="M20 12h3a2 2 0 012 2v6a2 2 0 01-2 2h-3"/><path d="M6 9c0-2.5 3-4.5 7-4.5S20 6.5 20 9"/></svg>',
    gas: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="13" height="20" rx="2"/><rect x="8" y="9" width="7" height="5" rx="1"/><path d="M18 11h3a2 2 0 012 2v6a2 2 0 01-2 2"/><line x1="5" y1="25" x2="18" y2="25"/></svg>',
    film: '<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="24" height="20" rx="3"/><circle cx="15" cy="15" r="5"/><path d="M13 12.5l4.5 2.5-4.5 2.5z" fill="currentColor" stroke="none"/></svg>'
};

const CAT_ICONS = { '000000': 'euro', '011000': 'food', '045000': 'bolt', '041100': 'house', '070000': 'car', '111000': 'fork' };
const CHART_YEARS = [1980, 1990, 1999, 2005, 2010, 2015, 2019, 2020, 2021, 2022, 2024, null];

const $ = (sel) => document.querySelector(sel);

function t(key) { return I18N[state.lang][key]; }

function tmpl(key, params) {
    return (t(key) || '').replace(/\{(\w+)\}/g, (m, k) => (params && k in params) ? params[k] : m);
}

function locale() { return state.lang === 'es' ? 'es-ES' : 'en-US'; }

function numFmt(v, decimals = 0) {
    return v.toLocaleString(locale(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtMoney(v, decimals) {
    const d = decimals !== undefined ? decimals : (Math.abs(v) >= 1000 ? 0 : 2);
    const n = numFmt(v, d);
    return state.lang === 'es' ? `${n} €` : `€${n}`;
}

function fmtCompact(v) {
    const abs = Math.abs(v);
    if (state.lang === 'es') {
        if (abs >= 1e6) return numFmt(abs / 1e6, abs >= 1e7 ? 0 : 1) + ' M€';
        if (abs >= 1e3) return numFmt(abs / 1e3, 0) + ' K€';
        return numFmt(abs, 0) + ' €';
    }
    if (abs >= 1e9) return '€' + numFmt(abs / 1e9, 1) + 'B';
    if (abs >= 1e6) return '€' + numFmt(abs / 1e6, abs >= 1e7 ? 0 : 1) + 'M';
    if (abs >= 1e3) return '€' + numFmt(abs / 1e3, 0) + 'K';
    return '€' + numFmt(abs, 0);
}

function fmtTrillions(vM) {
    const tr = vM / 1e6;
    return state.lang === 'es' ? numFmt(tr, 1) + ' bill€' : '€' + numFmt(tr, 1) + 'T';
}

function fmtPeriod(period) {
    const [y, m] = period.split('-');
    return `${t('months')[+m - 1]} ${y}`;
}

function valueAtYear(series, year) {
    const limit = `${year}-12`;
    let last = null;
    for (const row of series) {
        if (row[0] > limit) break;
        last = row;
    }
    return last || series[0];
}

function detectLang() {
    const saved = localStorage.getItem('ecbmp-lang');
    if (saved === 'es' || saved === 'en') return saved;
    return (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
}

function applyI18n() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));
}

// ── Odómetro ──
function createSlot() {
    const slot = document.createElement('span');
    slot.className = 'odometer-slot';
    const strip = document.createElement('span');
    strip.className = 'odometer-strip';
    for (let i = 0; i <= 9; i++) { const d = document.createElement('span'); d.textContent = i; strip.appendChild(d); }
    slot.appendChild(strip);
    return slot;
}

function updateOdometer(container, str) {
    const existing = container.children;
    const sig = (el) => el.dataset.t || '';
    const existingSig = Array.from(existing).map(sig).join('');
    const targetSig = Array.from(str).map(ch => (ch >= '0' && ch <= '9') ? 'D' : ch).join('');

    if (existingSig !== targetSig) {
        container.innerHTML = '';
        for (const ch of str) {
            if (ch >= '0' && ch <= '9') {
                const slot = createSlot(); slot.dataset.t = 'D';
                const strip = slot.querySelector('.odometer-strip');
                strip.style.transition = 'none';
                strip.style.transform = `translateY(-${parseInt(ch) * 10}%)`;
                container.appendChild(slot);
            } else {
                const s = document.createElement('span');
                s.className = ch === '€' ? 'cur' : 'sep';
                s.textContent = ch; s.dataset.t = ch;
                container.appendChild(s);
            }
        }
        return;
    }

    for (let i = 0; i < existing.length; i++) {
        const el = existing[i], ch = str[i];
        if (el.dataset.t === 'D' && ch >= '0' && ch <= '9') {
            const strip = el.querySelector('.odometer-strip');
            strip.style.transition = 'transform 0.4s cubic-bezier(0.25,0.1,0.25,1)';
            strip.style.transform = `translateY(-${parseInt(ch) * 10}%)`;
        }
    }
}

function currentM3() {
    const m3 = state.data.monetary.m3;
    const baseMs = Date.parse(m3.basePeriod + '-01T00:00:00Z');
    return m3.baseValueM * 1e6 + ((Date.now() - baseMs) / 1000) * m3.perSecond;
}

function tick() {
    if (!state.data) return;
    const v = currentM3();
    const num = Math.floor(v).toLocaleString(locale());
    const str = state.lang === 'es' ? `${num} €` : `€${num}`;
    updateOdometer($('#heroCounter'), str);
}

// ── Hero ──
function renderHero() {
    const m3 = state.data.monetary.m3;
    const base = m3.baseValueM;
    const v99row = state.data.monetary.m3.history.find(r => r[0] === '1999-01');
    const v99 = v99row ? v99row[1] : base / 3.96;

    $('#headlineAmount').textContent = fmtTrillions(base);
    $('#rateValue').textContent = fmtMoney(Math.round(m3.perSecond), 0);

    $('#heroSub').innerHTML = tmpl('hero.sub', {
        ratio: numFmt(base / v99, 1),
        from: fmtTrillions(v99),
        to: fmtTrillions(base)
    });

    $('#lastOfficialChip').textContent = `${t('chip.lastOfficial')} ${fmtPeriod(m3.basePeriod)}`;

    $('#statSec').textContent = fmtMoney(Math.round(m3.perSecond), 0);
    $('#statMin').textContent = fmtCompact(m3.perSecond * 60);
    $('#statHour').textContent = fmtCompact(m3.perSecond * 3600);
    $('#statDay').textContent = fmtCompact(m3.perSecond * 86400);
}

// ── Gráfico M3 ──
let chartBuilt = false;

function buildChart() {
    const chart = $('#m3Chart');
    const yearsRow = $('#m3Years');
    const hist = state.data.monetary.m3.history;
    const maxVal = Math.max(...hist.map(r => r[1]));
    chart.innerHTML = '';
    yearsRow.innerHTML = '';

    CHART_YEARS.forEach(year => {
        const row = year === null ? hist[hist.length - 1] : valueAtYear(hist, year);
        if (!row) return;
        const labelYear = year === null ? row[0].slice(0, 4) : year;
        const covid = ['2020', '2021', '2022'].includes(String(year));
        const pct = (row[1] / maxVal * 85).toFixed(1);
        const col = document.createElement('div');
        col.className = 'm3-col' + (covid ? ' covid' : '');
        col.dataset.pct = pct;
        col.innerHTML = `<div class="m3-col-label">${fmtTrillions(row[1])}</div><div class="m3-col-bar" style="height: 0%"></div>`;
        chart.appendChild(col);

        const yl = document.createElement('div');
        yl.className = 'm3-year-label';
        yl.textContent = labelYear;
        yearsRow.appendChild(yl);
    });

    const first = fmtTrillions(hist[0][1]);
    const last = fmtTrillions(hist[hist.length - 1][1]);
    $('#chartSub').textContent = tmpl('chart.sub', { from: first, to: last });

    if (chartBuilt) {
        chart.querySelectorAll('.m3-col').forEach(c => {
            c.classList.add('visible');
            const bar = c.querySelector('.m3-col-bar');
            if (c.dataset.pct) bar.style.height = c.dataset.pct + '%';
        });
    }
    chartBuilt = true;
}

// ── Slider de precios ──
const CAT_REF = {};
const ITEM_REF = {};
let cardRefs = [];

function buildCards() {
    const grid = $('#priceGrid');
    grid.innerHTML = '';
    cardRefs = [];

    state.data.hicp.categories.forEach((cat) => {
        const icon = ICONS[CAT_ICONS[cat.code]] || ICONS.euro;
        const card = document.createElement('div');
        card.className = 'price-card';
        card.innerHTML = `
            <div class="price-card-top">
                <span class="price-card-icon">${icon}</span>
                <span class="price-card-change"></span>
            </div>
            <div class="price-card-name">${state.lang === 'es' ? cat.es : cat.en}</div>
            <div class="price-card-row">
                <span class="price-then-val"></span>
                <span class="price-arrow-sep">&rarr;</span>
                <span class="price-now-val"></span>
            </div>
            <div class="price-card-bar"><div class="price-card-bar-fill"></div></div>`;
        grid.appendChild(card);
        cardRefs.push({ type: 'hicp', cat, el: card });
    });

    state.data.items.forEach((item) => {
        const icon = ICONS[item.icon] || ICONS.euro;
        const card = document.createElement('div');
        card.className = 'price-card';
        card.innerHTML = `
            <div class="price-card-top">
                <span class="price-card-icon">${icon}</span>
                <span class="price-card-change"></span>
            </div>
            <div class="price-card-name">${state.lang === 'es' ? item.es : item.en}</div>
            <div class="price-card-row">
                <span class="price-then-val"></span>
                <span class="price-arrow-sep">&rarr;</span>
                <span class="price-now-val"></span>
            </div>
            <div class="price-card-bar"><div class="price-card-bar-fill"></div></div>`;
        grid.appendChild(card);
        cardRefs.push({ type: 'item', item, el: card });
    });
}

function updatePrices(idx) {
    const slider = $('#yearSlider');
    const years = state.data.meta.sliderYears;
    const maxIdx = years.length;
    const isNow = idx >= maxIdx;
    $('#sliderYear').textContent = isNow ? t('infl.nowBadge') : years[idx];

    cardRefs.forEach(ref => {
        const changeEl = ref.el.querySelector('.price-card-change');
        const thenEl = ref.el.querySelector('.price-then-val');
        const nowEl = ref.el.querySelector('.price-now-val');
        const barEl = ref.el.querySelector('.price-card-bar-fill');

        let thenVal, nowVal, thenStr;
        if (ref.type === 'hicp') {
            const series = ref.cat.index;
            const nowIdx = series[series.length - 1][1];
            const baseRow = valueAtYear(series, years[idx]);
            nowVal = 100 * nowIdx / baseRow[1];
            const baseYear = Number(baseRow[0].slice(0, 4));
            const base100 = numFmt(100, 0);
            const yearTag = baseYear !== years[idx] ? ` · ${baseYear}` : '';
            thenStr = state.lang === 'es' ? `${base100} €${yearTag}` : `€${base100}${yearTag}`;
        } else {
            const prices = ref.item.prices;
            thenVal = prices[idx];
            nowVal = prices[prices.length - 1];
            thenStr = (ref.item.approx ? '≈ ' : '') + fmtMoney(thenVal, thenVal >= 1000 ? 0 : 2);
        }

        const pct = (nowVal / (ref.type === 'hicp' ? 100 : thenVal) - 1) * 100;
        const nowStr = (ref.type === 'item' && ref.item.approx ? '≈ ' : '') +
            fmtMoney(nowVal, ref.type === 'hicp' ? 0 : (nowVal >= 1000 ? 0 : 2)) +
            (ref.type === 'item' && ref.item.unit && ref.item.unit !== '€' ? ' ' + ref.item.unit : '');

        thenEl.textContent = thenStr;
        nowEl.textContent = nowStr;

        if (isNow) {
            changeEl.textContent = t('infl.nowBadge');
            changeEl.style.color = 'var(--text-dim)';
            changeEl.style.background = 'rgba(255,255,255,0.04)';
            changeEl.style.borderColor = 'transparent';
            barEl.style.width = '0%';
        } else {
            changeEl.textContent = '+' + numFmt(pct, 0) + '%';
            changeEl.style.color = 'var(--red)';
            changeEl.style.background = 'rgba(255, 59, 59, 0.08)';
            changeEl.style.borderColor = 'rgba(255, 59, 59, 0.1)';
            barEl.style.width = Math.min(100, pct) + '%';
        }
    });
}

// ── FAQ ──
function buildFaq() {
    const wrap = $('#faqList');
    wrap.innerHTML = '';
    I18N[state.lang].faq.forEach(item => {
        const div = document.createElement('div');
        div.className = 'faq-item';
        div.innerHTML = `<h3 class="faq-q"></h3><p class="faq-a"></p>`;
        div.querySelector('.faq-q').textContent = item.q;
        div.querySelector('.faq-a').textContent = item.a;
        wrap.appendChild(div);
    });
}

// ── Scroll reveal ──
function setupReveal() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const el = e.target;
            if (el.hasAttribute('data-reveal')) el.classList.add('visible');
            if (el.id === 'm3Chart') {
                Array.from(el.children).forEach((c, i) => {
                    setTimeout(() => {
                        c.classList.add('visible');
                        const bar = c.querySelector('.m3-col-bar');
                        if (bar && c.dataset.pct) bar.style.height = c.dataset.pct + '%';
                    }, i * 80);
                });
            }
            obs.unobserve(el);
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-reveal], #m3Chart').forEach(el => obs.observe(el));
}

// ── Init ──
function bindEvents() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
    const slider = $('#yearSlider');
    slider.addEventListener('input', () => updatePrices(+slider.value));
}

function setLang(lang) {
    if (state.lang === lang) return;
    state.lang = lang;
    localStorage.setItem('ecbmp-lang', lang);
    applyI18n();
    renderHero();
    buildChart();
    buildCards();
    buildFaq();
    updatePrices(+$('#yearSlider').value);
    tick();
}

async function init() {
    state.lang = detectLang();
    bindEvents();

    try {
        const res = await fetch('data/data.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(res.status);
        state.data = await res.json();
    } catch (err) {
        applyI18n();
        $('#heroSub').textContent = t('error.load');
        return;
    }

    const years = state.data.meta.sliderYears;
    const slider = $('#yearSlider');
    slider.max = years.length;
    slider.value = 0;

    applyI18n();
    renderHero();
    buildChart();
    buildCards();
    buildFaq();
    updatePrices(0);
    setupReveal();

    tick();
    setInterval(tick, 200);
}

init();
