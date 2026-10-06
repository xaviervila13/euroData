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
const CHART_SOURCES = {
    hpi: 'Eurostat · prc_hpi_q',
    basket_gold: 'HICP (BCE/Eurostat) + LBMA Gold Price (WGC)',
    old_dep: 'Eurostat · demo_pjanind + proj_23np',
    pension_spend: 'Eurostat · spr_exp_pens',
    spend_compare: 'Eurostat · gov_10a_exp (COFOG)',
    pension_sim: 'INE · salario medio + Eurostat · reemplazo y esperanza de vida',
    permits: 'Eurostat · sts_cobp_a',
    population: 'Eurostat · demo_pjan',
    inmigracion: 'Eurostat · migr_imm1ctz',
    hogares: 'INE · 60133'
};

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

function fmtEuroCompact(v) {
    const abs = Math.abs(v);
    if (abs >= 1e6) return state.lang === 'es' ? numFmt(v / 1e6, 2) + ' M€' : '€' + numFmt(v / 1e6, 2) + 'M';
    if (abs >= 1e3) return state.lang === 'es' ? numFmt(v / 1e3, 0) + ' k€' : '€' + numFmt(v / 1e3, 0) + 'k';
    return state.lang === 'es' ? numFmt(v, 0) + ' €' : '€' + numFmt(v, 0);
}

function fmtTrillions(vM) {
    const tr = vM / 1e6;
    return state.lang === 'es' ? numFmt(tr, 1) + ' bill€' : '€' + numFmt(tr, 1) + 'T';
}

function fmtPeriod(period) {
    const parts = period.split('-');
    if (parts.length === 2 && parts[1].startsWith('Q')) return `${parts[1]} ${parts[0]}`;
    if (parts.length === 2) return `${t('months')[+parts[1] - 1]} ${parts[0]}`;
    return period;
}

function fmtPeriodShort(period) {
    const parts = period.split('-');
    if (parts.length === 2 && parts[1].startsWith('Q')) return `${parts[0]} ${parts[1]}`;
    if (parts.length === 2) return `${t('months')[+parts[1] - 1]} ${parts[0].slice(2)}`;
    return period;
}

function yearOf(period) { return period.slice(0, 4); }

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
    const saved = localStorage.getItem('esproblemas-lang');
    if (saved === 'es' || saved === 'en') return saved;
    return (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
}

function applyI18n() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));
    const infoBtn = $('#m3InfoBtn');
    if (infoBtn) infoBtn.setAttribute('aria-label', t('infl.infoLabel'));
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
    const targetSig = Array.from(str).map(ch => (ch >= '0' && ch <= '9') ? 'D' : ch).join('');
    const cache = container._od;

    if (!cache || cache.sig !== targetSig) {
        // cambia la estructura (longitud o separadores): se reconstruye y se cachean los strips
        container.innerHTML = '';
        const strips = [];
        const chars = [];
        for (const ch of str) {
            chars.push(ch);
            if (ch >= '0' && ch <= '9') {
                const slot = createSlot();
                slot.dataset.t = 'D';
                const strip = slot.querySelector('.odometer-strip');
                strip.style.transition = 'none';
                strip.style.transform = `translateY(-${parseInt(ch) * 10}%)`;
                container.appendChild(slot);
                strips.push(strip);
            } else {
                const sep = document.createElement('span');
                sep.className = ch === '€' ? 'cur' : 'sep';
                sep.textContent = ch;
                sep.dataset.t = ch;
                container.appendChild(sep);
                strips.push(null);
            }
        }
        container._od = { sig: targetSig, strips, chars };
        return;
    }

    // mismo numero de digitos: solo se animan los que han cambiado
    const { strips, chars } = cache;
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (chars[i] === ch || !strips[i]) continue;
        chars[i] = ch;
        strips[i].style.transition = 'transform 0.4s cubic-bezier(0.25,0.1,0.25,1)';
        strips[i].style.transform = `translateY(-${parseInt(ch) * 10}%)`;
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

// ── Hero / contador ──
function renderSite() {
    const m3 = state.data.monetary.m3;
    $('#rateValue').textContent = fmtMoney(Math.round(m3.perSecond), 0);
    $('#lastOfficialChip').textContent = `${t('chip.lastOfficial')} ${fmtPeriod(m3.basePeriod)}`;
    $('#statSec').textContent = fmtMoney(Math.round(m3.perSecond), 0);
    $('#statMin').textContent = fmtCompact(m3.perSecond * 60);
    $('#statHour').textContent = fmtCompact(m3.perSecond * 3600);
    $('#statDay').textContent = fmtCompact(m3.perSecond * 86400);
}

// ── Sección inflación ──
let chartBuilt = false;

function renderInflationCards() {
    const wrap = $('#inflationCards');
    wrap.innerHTML = '';
    const idx = state.data.hicp.categories[0].index;
    const baseRow = valueAtYear(idx, 1999);
    const lastVal = idx[idx.length - 1][1];
    const cum = (lastVal / baseRow[1] - 1) * 100;
    const today = 100 * lastVal / baseRow[1];

    const anr = state.data.hicp.categories[0].anr;
    const lastYear = Number(yearOf(anr[anr.length - 1][0]));
    const recent = anr.filter(r => Number(yearOf(r[0])) > lastYear - 10);
    const avg = recent.reduce((acc, r) => acc + r[1], 0) / recent.length;
    const loss = (1 - 1 / Math.pow(1 + avg / 100, 10)) * 100;

    const cards = [
        {
            value: fmtMoney(today, 0),
            label: t('infl.card.pp.label'),
            note: tmpl('infl.card.pp.note', { cum: numFmt(cum, 0) }),
            source: t('infl.card.pp.source')
        },
        {
            value: '−' + numFmt(loss, 1) + '%',
            label: t('infl.card.savings.label'),
            note: tmpl('infl.card.savings.note', { avg: numFmt(avg, 1), loss: numFmt(loss, 1) }),
            source: t('infl.card.savings.source')
        }
    ];

    cards.forEach(c => {
        const card = document.createElement('div');
        card.className = 'metric-card pain-card';
        card.innerHTML = `<div class="metric-label"></div><div class="metric-value"></div><div class="metric-extra"></div><div class="metric-foot"><span class="metric-source"></span></div>`;
        card.querySelector('.metric-label').textContent = c.label;
        card.querySelector('.metric-value').textContent = c.value;
        card.querySelector('.metric-extra').textContent = c.note;
        card.querySelector('.metric-source').textContent = c.source;
        wrap.appendChild(card);
    });
}

function renderInflationLists() {
    renderMythList('#inflMythsList', I18N[state.lang].inflMyths);
    renderClaimList('#inflCausesList', I18N[state.lang].inflCauses);
    renderClaimList('#inflSolutionsList', I18N[state.lang].inflSolutions);
    renderSources('#inflSources', state.data.problems.inflation.sources);
}

function renderInflation() {
    const m3 = state.data.monetary.m3;
    $('#moneyAmount').textContent = fmtTrillions(m3.baseValueM);
    $('#moneySub').innerHTML = tmpl('infl.lede', { rate: fmtMoney(Math.round(m3.perSecond), 0) });
    renderInflationCards();
    renderChartsInto('#inflationCharts', state.data.problems.inflation.charts);
    renderInflationLists();
    renderPensions();
}

function buildMoneyChart() {
    const chart = $('#m3Chart');
    const yearsRow = $('#m3Years');
    const hist = state.data.monetary.m3.history;
    const maxVal = Math.max(...hist.map(r => r[1]));
    chart.innerHTML = '';
    yearsRow.innerHTML = '';

    CHART_YEARS.forEach(year => {
        const row = year === null ? hist[hist.length - 1] : valueAtYear(hist, year);
        if (!row) return;
        const labelYear = year === null ? yearOf(row[0]) : year;
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
    $('#moneyChartSub').textContent = tmpl('infl.chart.sub', { from: first, to: last });

    if (chartBuilt) {
        chart.querySelectorAll('.m3-col').forEach(c => {
            c.classList.add('visible');
            const bar = c.querySelector('.m3-col-bar');
            if (c.dataset.pct) bar.style.height = c.dataset.pct + '%';
        });
    }
    chartBuilt = true;
}

// ── Gráficos SVG genéricos ──
function chartValue(v, unit) {
    if (v === 0) return '0';
    if (unit === 'index') return numFmt(v, 1);
    if (unit === 'thousand') return numFmt(v, 0) + (state.lang === 'es' ? ' mil' : 'k');
    if (unit === 'ratio') return numFmt(v, 0);
    if (unit === 'pct_gdp') return numFmt(v, 0) + '%';
    if (unit === 'euro_hab') return state.lang === 'es' ? numFmt(v, 0) + ' €' : '€' + numFmt(v, 0);
    if (unit === 'euro') {
        if (Math.abs(v) >= 1e6) return (state.lang === 'es' ? numFmt(v / 1e6, 1) + ' M€' : '€' + numFmt(v / 1e6, 1) + 'M');
        if (Math.abs(v) >= 1e3) return (state.lang === 'es' ? numFmt(v / 1e3, 0) + ' k€' : '€' + numFmt(v / 1e3, 0) + 'k');
        return (state.lang === 'es' ? numFmt(v, 0) + ' €' : '€' + numFmt(v, 0));
    }
    if (unit === 'people') {
        const a = Math.abs(v);
        if (a >= 1e6) return numFmt(v / 1e6, 1) + ' M';
        if (a >= 1e3) return numFmt(v / 1e3, 0) + ' k';
        if (a >= 100) return numFmt(v, 0);
        if (a >= 10) return numFmt(v, 1);
        return numFmt(v, 2);
    }
    return numFmt(v, 1);
}

function niceTicks(lo, hi, count) {
    const raw = (hi - lo) / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const ladder = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
    const step = (ladder.find(x => norm <= x) || 10) * mag;
    const ticks = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + step * 0.001; v += step) {
        ticks.push(Number(v.toFixed(6)));
    }
    if (ticks.length < 3) {
        for (let v = Math.floor(lo / step) * step; v <= hi + step * 0.001 && ticks.length < 3; v += step) ticks.push(Number(v.toFixed(6)));
    }
    return { ticks, step };
}

function xTickIndices(pts, maxTicks, geom) {
    const n = pts.length;
    const first = pts[0][0];
    const isQuarter = first.includes('-Q');
    const isMonth = /^\d{4}-\d{2}$/.test(first);
    const plotW = (geom && geom.plotW) || 600;
    const padL = (geom && geom.padL) || 0;
    // separación mínima entre etiquetas, en índices
    const minGap = Math.max(Math.ceil(n / (maxTicks + 1)), 1);
    let idxs;

    if (isQuarter || isMonth) {
        idxs = [];
        let year = null;
        const yearStep = Math.max(1, Math.ceil(Math.max(1, Math.round(n / (isQuarter ? 4 : 12))) / maxTicks));
        for (let i = 0; i < n; i++) {
            const y = Number(pts[i][0].slice(0, 4));
            if (y !== year) {
                year = y;
                if (idxs.length === 0 || y % yearStep === 0) idxs.push(i);
            }
        }
    } else {
        const step = Math.max(1, Math.ceil(n / (maxTicks + 1)));
        idxs = [];
        for (let i = 0; i < n; i += step) idxs.push(i);
    }

    // el punto final solo si no pisa al anterior
    if (idxs[idxs.length - 1] !== n - 1) {
        if (n - 1 - idxs[idxs.length - 1] >= minGap) {
            idxs.push(n - 1);
        } else if (idxs.length > 1) {
            idxs[idxs.length - 1] = n - 1;
        }
    }
    // elimina cualquier etiqueta que siga demasiado cerca de la siguiente
    // (comparación en píxeles: en series largas un paso de índice es muy pequeño)
    const posOf = (i) => padL + plotW * i / (n - 1);
    const pxMin = Math.max(46, Math.round((plotW || 600) / 11));
    const kept = idxs.filter((v, k) => k === idxs.length - 1 || posOf(idxs[k + 1]) - posOf(v) >= pxMin);
    return kept.length >= 2 ? kept : idxs;
}

function tickLabel(period, step) {
    const parts = period.split('-');
    if (parts.length === 2 && parts[1].startsWith('Q')) {
        return step >= 4 ? parts[0] : `${parts[0]}-${parts[1]}`;
    }
    if (parts.length === 2) {
        return step >= 12 ? parts[0] : `${t('months')[+parts[1] - 1]} ${parts[0].slice(2)}`;
    }
    return period;
}

function renderChart(spec) {
    const W = 680, H = 275, padL = 62, padR = 18, padT = 28, padB = 36;
    const norm = (arr) => arr ? arr.map(r => [String(r[0]), r[1]]) : null;
    const pts = norm(spec.series);
    const pts2 = norm(spec.series2);
    const pts3 = norm(spec.series3);
    const allValues = pts.map(p => p[1])
        .concat(pts2 ? pts2.map(p => p[1]) : [])
        .concat(pts3 ? pts3.map(p => p[1]) : [])
        .concat(spec.reference ? [spec.reference.value] : []);
    const vmin = Math.min(...allValues), vmax = Math.max(...allValues);
    const span = (vmax - vmin) || 1;
    let lo = spec.type === 'bars' ? Math.min(0, vmin) : vmin - span * 0.08;
    let hi = vmax + span * 0.16;
    const { ticks } = niceTicks(lo, hi, spec.type === 'bars' ? 4 : 5);

    const periods = Array.from(new Set(
        pts.map(p => p[0])
            .concat(pts2 ? pts2.map(p => p[0]) : [])
            .concat(pts3 ? pts3.map(p => p[0]) : [])
    ));
    const numericX = periods.every(p => /^\d+$/.test(p));
    periods.sort(numericX ? (a, b) => Number(a) - Number(b) : undefined);
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const x = (period) => {
        const i = periods.indexOf(period);
        return padL + (periods.length === 1 ? plotW / 2 : plotW * i / (periods.length - 1));
    };
    const y = (v) => padT + plotH * (1 - (v - lo) / (hi - lo));
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const line = (series, color, dashed) => {
        const path = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
        const dash = dashed ? ' stroke-dasharray="7 5" stroke-width="2.2"' : ' stroke-width="2.6"';
        return `<path d="${path}" fill="none" stroke="${color}"${dash} stroke-linejoin="round"/>`;
    };

    let svg = '';
    ticks.forEach(tv => {
        const gy = y(tv);
        svg += `<line x1="${padL}" y1="${gy.toFixed(0)}" x2="${W - padR}" y2="${gy.toFixed(0)}" stroke="rgba(120,150,255,0.12)" stroke-width="1"/>`;
        svg += `<text x="${padL - 9}" y="${(gy + 4).toFixed(0)}" text-anchor="end" font-size="12" fill="var(--text-dim)">${esc(chartValue(tv, spec.unit))}</text>`;
    });

    if (spec.band) {
        const i0 = periods.findIndex(p => p >= spec.band.from);
        let i1 = -1;
        periods.forEach((p, i) => { if (p <= spec.band.to) i1 = i; });
        if (i0 >= 0 && i1 > i0) {
            const bx = x(periods[i0]), bw = Math.max(2, x(periods[i1]) - x(periods[i0]));
            svg += `<rect x="${bx.toFixed(1)}" y="${padT}" width="${bw.toFixed(1)}" height="${plotH}" fill="rgba(255,90,95,0.10)"/>`;
            if (bw > 64) {
                svg += `<text x="${(bx + bw / 2).toFixed(1)}" y="${padT + 13}" text-anchor="middle" font-size="12" fill="rgba(255,90,95,0.85)">${esc(t('chart.crisis'))}</text>`;
            }
        }
    }

    if (spec.markers) {
        spec.markers.forEach(mk => {
            const key = String(mk.period);
            if (periods.indexOf(key) < 0) return;
            const mx = x(key);
            svg += `<line x1="${mx.toFixed(0)}" y1="${padT}" x2="${mx.toFixed(0)}" y2="${(padT + plotH).toFixed(0)}" stroke="rgba(77,139,255,0.55)" stroke-width="1.4" stroke-dasharray="5 4"/>`;
            const label = esc(t('chart.' + spec.id + '.marker.' + mk.key));
            const anchor = mx > W * 0.6 ? 'end' : 'start';
            const lx = anchor === 'end' ? mx - 6 : mx + 6;
            svg += `<text x="${lx.toFixed(0)}" y="${(padT + 32).toFixed(0)}" text-anchor="${anchor}" font-size="11" fill="rgba(120,170,255,0.95)">${label}</text>`;
        });
    }

    if (spec.type === 'bars') {
        const bw = Math.max(1.5, plotW / periods.length * 0.7);
        pts.forEach(p => {
            const vy = y(p[1]);
            svg += `<rect x="${(x(p[0]) - bw / 2).toFixed(0)}" y="${vy.toFixed(0)}" width="${bw.toFixed(1)}" height="${Math.max(1, y(lo) - vy).toFixed(0)}" fill="url(#barGrad)"/>`;
        });
    } else {
        if (pts2) {
            const dashed2 = Boolean(spec.projectionFrom);
            svg += line(pts2, dashed2 ? '#8fa8d8' : '#4d8bff', dashed2);
        } else {
            const area = `${pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ')} L${x(pts[pts.length - 1][0]).toFixed(1)},${y(lo).toFixed(1)} L${x(pts[0][0]).toFixed(1)},${y(lo).toFixed(1)} Z`;
            svg += `<path d="${area}" fill="url(#areaGrad)" stroke="none"/>`;
        }
        svg += line(pts, '#ffcc00');
        if (pts3) svg += line(pts3, '#3fd0c9');
    }

    if (spec.reference) {
        const ry = y(spec.reference.value);
        svg += `<line x1="${padL}" y1="${ry.toFixed(1)}" x2="${W - padR}" y2="${ry.toFixed(1)}" stroke="rgba(255,90,95,0.75)" stroke-width="1.6" stroke-dasharray="6 4"/>`;
        const rlabel = esc(t('chart.' + spec.id + '.ref'));
        svg += `<text x="${padL}" y="${(ry - 6).toFixed(1)}" text-anchor="start" font-size="11" fill="rgba(255,120,125,0.95)">${rlabel}</text>`;
    }

    if (spec.peak) {
        const idx = pts.findIndex(p => p[0] === spec.peak.period);
        if (idx >= 0) {
            const px = x(spec.peak.period), py = y(spec.peak.value);
            const label = esc(tmpl('chart.peak', { year: yearOf(spec.peak.period) }));
            const lx = Math.min(Math.max(px, padL + 30), W - padR - 30);
            svg += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="#ff5a5f"/>`;
            svg += `<text x="${lx.toFixed(1)}" y="${(py - 10).toFixed(1)}" text-anchor="middle" font-size="12" fill="rgba(255,120,125,0.95)">${label}</text>`;
        }
    }

    const maxTicks = 6;
    const step = Math.max(1, Math.ceil(periods.length / maxTicks));
    const idxs = xTickIndices(periods.map(p => [p, 0]), maxTicks, { padL, plotW });
    idxs.forEach((i, k) => {
        const tx = x(periods[i]);
        const anchor = k === 0 ? 'start' : (i === periods.length - 1 ? 'end' : 'middle');
        svg += `<line x1="${tx.toFixed(1)}" y1="${padT + plotH}" x2="${tx.toFixed(1)}" y2="${padT + plotH + 5}" stroke="rgba(120,150,255,0.3)" stroke-width="1"/>`;
        svg += `<text x="${tx.toFixed(1)}" y="${H - 11}" text-anchor="${anchor}" font-size="12" fill="var(--text-dim)">${esc(tickLabel(periods[i], step))}</text>`;
    });

    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('chart.' + spec.id + '.title'))}">
        <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(255,204,0,0.28)"/><stop offset="100%" stop-color="rgba(255,204,0,0)"/>
            </linearGradient>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(255,204,0,0.75)"/><stop offset="100%" stop-color="rgba(255,204,0,0.18)"/>
            </linearGradient>
        </defs>
        ${svg}
    </svg>`;
}

// ── Sección vivienda ──
const METRIC_VALUE = {
    hpi: (v) => numFmt(v, 1),
    gdp_pc_es: (v) => (state.lang === 'es' ? numFmt(v, 0) + ' €' : '€' + numFmt(v, 0)),
    basket_eur: (v) => numFmt(v, 0) + (state.lang === 'es' ? ' €' : ''),
    basket_gold: (v) => (v > 0 ? '+' : '') + numFmt(v, 0) + '%',
    pension_spend: (v) => numFmt(v, 2) + '%',
    pension_spend_2050: (v) => numFmt(v, 1) + '%',
    edu_spend: (v) => numFmt(v, 1) + '%',
    sim_capital_low: (v) => fmtEuroCompact(v),
    sim_capital_mid: (v) => fmtEuroCompact(v),
    sim_capital_high: (v) => fmtEuroCompact(v),
    sim_income_mid: (v) => fmtEuroCompact(v) + (state.lang === 'es' ? '/año' : '/yr'),
    sim_pension: (v) => fmtEuroCompact(v) + (state.lang === 'es' ? '/año' : '/yr'),
    sim_system_total: (v) => fmtEuroCompact(v),
    old_dep: (v) => numFmt(v, 1),
    old_dep_2050: (v) => numFmt(v, 1),
    pensioners_2050: (v) => numFmt(v, 1) + ' M',
    hpi_yoy: (v) => (v > 0 ? '+' : '') + numFmt(v, 1) + '%',
    visados: (v) => numFmt(v, 0) + (state.lang === 'es' ? ' mil' : 'k'),
    hogares: (v) => numFmt(v / 1e6, 2) + ' M',
    tamano_hogar: (v) => numFmt(v, 2),
    inmigracion: (v) => numFmt(v / 1e6, 2) + ' M',
    poblacion: (v) => numFmt(v / 1e6, 1) + ' M'
};

function renderMetricCards(sel, metrics) {
    const wrap = $(sel);
    if (!wrap) return;
    wrap.innerHTML = '';
    metrics.forEach(m => {
        if (m.value === null || m.value === undefined) return;
        const label = tmpl('metric.' + m.id + '.label', { ref: m.period ? yearOf(m.period) : '' });
        let extra = '';
        if (m.extra !== null && m.extra !== undefined && m.extraRef) {
            const ref = yearOf(m.extraRef);
            if (m.id === 'hogares' || m.id === 'poblacion') {
                extra = '+' + numFmt(Math.abs(m.extra), 2) + tmpl('metric.' + m.id + '.extra', { ref });
            } else {
                extra = (m.extra > 0 ? '+' : '') + numFmt(m.extra, 1) + tmpl('metric.' + m.id + '.extra', { ref });
            }
        }
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.innerHTML = `<div class="metric-label"></div><div class="metric-value"></div><div class="metric-extra"></div><div class="metric-foot"><span class="metric-source"></span></div>`;
        card.querySelector('.metric-label').textContent = label;
        card.querySelector('.metric-value').textContent = METRIC_VALUE[m.id] ? METRIC_VALUE[m.id](m.value) : String(m.value);
        card.querySelector('.metric-extra').textContent = extra;
        card.querySelector('.metric-source').textContent = m.source + (m.period ? ' · ' + fmtPeriodShort(m.period) : '');
        wrap.appendChild(card);
    });
}

function renderMythList(sel, items) {
    const wrap = $(sel);
    if (!wrap) return;
    wrap.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'myth-item';
        div.innerHTML = '<div class="myth-q"></div><p class="myth-a"></p>';
        div.querySelector('.myth-q').textContent = item.q;
        div.querySelector('.myth-a').textContent = item.a;
        wrap.appendChild(div);
    });
}

function renderClaimList(sel, items) {
    const ul = $(sel);
    if (!ul) return;
    ul.innerHTML = '';
    items.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        ul.appendChild(li);
    });
}

function renderSources(sel, sources) {
    const ul = $(sel);
    if (!ul) return;
    ul.innerHTML = '';
    sources.forEach(src => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = src.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = src.label;
        li.appendChild(a);
        ul.appendChild(li);
    });
}

function renderHousingMetrics(metrics) {
    renderMetricCards('#housingMetrics', metrics);
}

const chartSpecs = new Map();
let chartObserver = null;

function ensureChartObserver() {
    if (chartObserver || typeof IntersectionObserver === 'undefined') return chartObserver;
    chartObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const body = entry.target;
            const spec = chartSpecs.get(body.dataset.chartId);
            if (spec) body.innerHTML = renderChart(spec);
            obs.unobserve(body);
        });
    }, { rootMargin: '250px 0px' });
    return chartObserver;
}

function renderChartsInto(containerSel, charts) {
    const wrap = $(containerSel);
    if (!wrap) return;
    wrap.innerHTML = '';
    const observer = ensureChartObserver();
    charts.forEach(spec => {
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.innerHTML = `
            <div class="chart-head">
                <h4 class="chart-title"></h4>
                <span class="chart-source"></span>
            </div>
            <div class="chart-legend"></div>
            <div class="chart-body"></div>`;
        card.querySelector('.chart-title').textContent = t('chart.' + spec.id + '.title');
        card.querySelector('.chart-source').textContent = t('chart.source') + ': ' + (CHART_SOURCES[spec.id] || '');
        const legend = card.querySelector('.chart-legend');
        if (spec.series2) {
            const items = [
                ['gold', 'a'], ['blue', 'b']
            ];
            if (spec.series3) items.push(['teal', 'c']);
            legend.innerHTML = items.map(([cls, key]) =>
                `<span class="legend-item"><i class="dot ${cls}"></i><span class="lg-${key}"></span></span>`).join('');
            items.forEach(([, key]) => {
                legend.querySelector('.lg-' + key).textContent = t('chart.' + spec.id + '.' + key);
            });
        }
        const body = card.querySelector('.chart-body');
        body.dataset.chartId = spec.id;
        chartSpecs.set(spec.id, spec);
        if (observer) observer.observe(body);
        else body.innerHTML = renderChart(spec);
        if (spec.estimate) {
            const note = document.createElement('p');
            note.className = 'chart-note';
            note.textContent = t('chart.estimateNote');
            card.appendChild(note);
        }
        wrap.appendChild(card);
    });
}

function renderHousingCharts(charts) {
    renderChartsInto('#housingCharts', charts);
}

function renderHousingLists() {
    renderMythList('#housingMyths', I18N[state.lang].housingMyths);
    renderClaimList('#housingCauses', I18N[state.lang].housingCauses);
    renderClaimList('#housingSolutions', I18N[state.lang].housingSolutions);
    renderSources('#housingSources', state.data.problems.housing.sources);
}

function renderHousing() {
    const housing = state.data.problems.housing;
    renderHousingMetrics(housing.metrics);
    renderHousingCharts(housing.charts);
    renderHousingLists();
}

// ── Slider de precios (dinero) ──
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
    const years = state.data.meta.sliderYears;
    const isNow = idx >= years.length;
    $('#sliderYear').textContent = isNow ? t('infl.nowBadge') : years[idx];

    cardRefs.forEach(ref => {
        const changeEl = ref.el.querySelector('.price-card-change');
        const thenEl = ref.el.querySelector('.price-then-val');
        const nowEl = ref.el.querySelector('.price-now-val');
        const barEl = ref.el.querySelector('.price-card-bar-fill');

        let nowVal, thenStr;
        if (ref.type === 'hicp') {
            const series = ref.cat.index;
            const nowIdx = series[series.length - 1][1];
            const baseRow = valueAtYear(series, years[idx]);
            nowVal = 100 * nowIdx / baseRow[1];
            const baseYear = Number(yearOf(baseRow[0]));
            const base100 = numFmt(100, 0);
            const yearTag = baseYear !== years[idx] ? ` · ${baseYear}` : '';
            thenStr = state.lang === 'es' ? `${base100} €${yearTag}` : `€${base100}${yearTag}`;
        } else {
            const prices = ref.item.prices;
            const thenVal = prices[idx];
            nowVal = prices[prices.length - 1];
            thenStr = (ref.item.approx ? '≈ ' : '') + fmtMoney(thenVal, thenVal >= 1000 ? 0 : 2);
        }

        const base = ref.type === 'hicp' ? 100 : ref.item.prices[idx];
        const pct = (nowVal / base - 1) * 100;
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
            changeEl.style.background = 'rgba(255, 90, 95, 0.1)';
            changeEl.style.borderColor = 'rgba(255, 90, 95, 0.25)';
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
        div.innerHTML = `<div class="faq-tag"></div><h3 class="faq-q"></h3><p class="faq-a"></p>`;
        div.querySelector('.faq-tag').textContent = t('faq.tag.' + item.tag);
        div.querySelector('.faq-tag').classList.add('tag-' + item.tag);
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

function renderPensionsAssumptions(assumptions) {
    const ul = $('#pensionsAssumptions');
    if (!ul) return;
    ul.innerHTML = '';
    const fmt = {
        salary: (a) => numFmt(a.value, 0) + ' €',
        rate: (a) => numFmt(a.value, 1) + ' %',
        contribution: (a) => numFmt(a.value, 0) + ' €',
        replacement: (a) => numFmt(a.value, 0) + ' %',
        life: (a) => numFmt(a.value, 1) + (state.lang === 'es' ? ' años' : ' years'),
        returns: (a) => a.value.map(v => numFmt(v, 0) + ' %').join(' / '),
        withdrawal: (a) => numFmt(a.value, 0) + ' %'
    };
    assumptions.forEach(a => {
        const li = document.createElement('li');
        const label = tmpl('sim.assumption.' + a.key, { period: a.period || '' });
        const value = fmt[a.key] ? fmt[a.key](a) : String(a.value);
        li.innerHTML = '<strong></strong> · <span></span>';
        li.querySelector('strong').textContent = value;
        li.querySelector('span').textContent = label;
        ul.appendChild(li);
    });
}

function renderReferenceCards(sel, refs) {
    const wrap = $(sel);
    if (!wrap) return;
    wrap.innerHTML = '';
    refs.forEach(r => {
        const card = document.createElement('div');
        card.className = 'metric-card' + (r.value < 0 ? ' ref-negative' : '');
        card.innerHTML = `<div class="metric-label"></div><div class="metric-value"></div><div class="metric-extra"></div><div class="metric-foot"><span class="metric-source"></span></div>`;
        card.querySelector('.metric-label').textContent = t('sim.ref.' + r.key + '.label');
        card.querySelector('.metric-value').textContent = (r.value > 0 ? '+' : '') + numFmt(r.value, 2) + '%';
        card.querySelector('.metric-extra').textContent = tmpl('sim.ref.' + r.key + '.note', { period: r.period });
        card.querySelector('.metric-source').textContent = r.source;
        wrap.appendChild(card);
    });
}

function renderPensions() {
    const p = state.data.problems.pensions;
    renderMetricCards('#pensionsMetrics', p.metrics);
    renderChartsInto('#pensionsCharts', p.charts);
    renderMythList('#pensionsMythsList', I18N[state.lang].pensionsMyths);
    renderClaimList('#pensionsCausesList', I18N[state.lang].pensionsCauses);
    renderClaimList('#pensionsSolutionsList', I18N[state.lang].pensionsSolutions);
    renderSources('#pensionsSources', p.sources);
    $('#pensionsSub').innerHTML = I18N[state.lang]['pensions.lede'];
    if (p.simulator) {
        $('#pensionsSimLede').textContent = I18N[state.lang]['pensions.simLede'];
        renderMetricCards('#pensionsSimMetrics', p.simulator.metrics);
        renderChartsInto('#pensionsSimCharts', p.simulator.charts);
        renderPensionsAssumptions(p.simulator.assumptions);
        renderReferenceCards('#pensionsRefs', p.simulator.references || []);
    }
}

function renderAll() {
    renderSite();
    renderInflation();
    buildMoneyChart();
    renderHousing();
    buildCards();
    buildFaq();
    updatePrices(+$('#yearSlider').value);
}

function setLang(lang) {
    if (state.lang === lang) return;
    state.lang = lang;
    localStorage.setItem('esproblemas-lang', lang);
    applyI18n();
    renderAll();
    tick();
}

async function fetchJson(src) {
    const res = await fetch(src, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
}

async function loadData() {
    // El snapshot estatico (mismo origen, cacheable y precargado) permite pintar
    // de inmediato; despues se revalida contra la API sin bloquear el primer render.
    try {
        const snapshot = await fetchJson('data/data.json');
        fetchJson('api/data').then(fresh => {
            if (fresh.meta.generatedAt !== snapshot.meta.generatedAt) {
                state.data = fresh;
                renderAll();
                setupReveal();
            }
        }).catch(() => {});
        return snapshot;
    } catch (err) {
        // sin snapshot: se usa la API directamente
        try { return await fetchJson('api/data'); } catch (err2) { return null; }
    }
}

async function init() {
    state.lang = detectLang();
    bindEvents();

    state.data = await loadData();
    if (!state.data) {
        applyI18n();
        $('#moneySub').textContent = t('error.load');
        return;
    }

    const years = state.data.meta.sliderYears;
    const slider = $('#yearSlider');
    slider.max = years.length;
    slider.value = 0;

    applyI18n();
    renderAll();
    setupReveal();

    tick();
    setInterval(tick, 500);
}

init();
