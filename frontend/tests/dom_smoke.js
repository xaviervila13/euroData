'use strict';
/*
 * Smoke test del frontend sin navegador.
 * Ejecutar: node frontend/tests/dom_smoke.js
 */
const fs = require('fs');
const path = require('path');

const FRONTEND = path.resolve(__dirname, '..');

function el(tag) {
    return {
        tagName: (tag || 'div').toUpperCase(),
        children: [], dataset: {}, style: {}, _class: new Set(),
        _text: '', _html: '',
        get className() { return Array.from(this._class).join(' '); },
        set className(v) { this._class = new Set(String(v).split(/\s+/).filter(Boolean)); },
        get classList() {
            const self = this;
            return {
                add: (...c) => c.forEach(x => self._class.add(x)),
                remove: (...c) => c.forEach(x => self._class.delete(x)),
                toggle: (c, force) => { const on = force === undefined ? !self._class.has(c) : force; on ? self._class.add(c) : self._class.delete(c); },
                contains: c => self._class.has(c)
            };
        },
        get textContent() { return this._text; },
        set textContent(v) { this._text = String(v); this._html = ''; this.children = []; },
        get innerHTML() { return this._html; },
        set innerHTML(v) { this._html = String(v); this._text = ''; this.children = parseHTML(v); },
        get lang() { return this._lang; },
        set lang(v) { this._lang = v; },
        appendChild(c) { this.children.push(c); return c; },
        querySelector(sel) { return selectIn(this, sel)[0] || null; },
        querySelectorAll(sel) { return selectIn(this, sel); },
        addEventListener() {}, hasAttribute() { return false; }, setAttribute() {}
    };
}

function matches(elm, sel) {
    if (sel.startsWith('#')) return elm.id === sel.slice(1);
    if (sel.startsWith('.')) return elm._class.has(sel.slice(1));
    return false;
}

function selectIn(root, sel) {
    const out = [];
    const walk = (n) => { (n.children || []).forEach(c => { if (matches(c, sel)) out.push(c); walk(c); }); };
    walk(root);
    return out;
}

function parseHTML(html) {
    const made = [];
    const re = /<(\/)?([a-zA-Z]+)([^>]*)>/g;
    const stack = [];
    let pos = 0;
    const attach = (node) => {
        const target = stack.length ? stack[stack.length - 1] : null;
        if (target) target.children.push(node); else made.push(node);
    };
    let m;
    while ((m = re.exec(html))) {
        const closing = m[1], tag = m[2].toLowerCase(), attrs = m[3] || '';
        const between = html.slice(pos, m.index);
        if (between && stack.length) stack[stack.length - 1]._text += between.trim();
        pos = re.lastIndex;
        if (closing) { stack.pop(); continue; }
        const node = el(tag);
        const cls = /class="([^"]*)"/.exec(attrs);
        if (cls) node.className = cls[1];
        const id = /id="([^"]*)"/.exec(attrs);
        if (id) node.id = id[1];
        attach(node);
        if (!/\/>$/.test(m[0].trim()) && !['br', 'input', 'img', 'hr'].includes(tag)) stack.push(node);
    }
    const tail = html.slice(pos);
    if (tail && stack.length) stack[stack.length - 1]._text += tail.trim();
    return made;
}

const documentEl = el('html');
const document = {
    documentElement: documentEl,
    _els: {}, _all: {},
    register(sel, node) { this._els[sel] = node; },
    registerAll(sel, nodes) { this._all[sel] = nodes; },
    querySelector(sel) { return this._els[sel] || null; },
    querySelectorAll(sel) { return this._all[sel] || []; },
    createElement: (tag) => el(tag)
};

['#heroCounter', '#rateValue', '#lastOfficialChip', '#statSec', '#statMin', '#statHour', '#statDay',
    '#moneyAmount', '#moneySub', '#moneyChartSub', '#m3Chart', '#m3Years',
    '#housingMetrics', '#housingCharts', '#housingMyths', '#housingCauses', '#housingSolutions',
    '#housingSources', '#priceGrid', '#faqList', '#yearSlider', '#sliderYear'
].forEach(sel => {
    const node = el('div');
    if (sel === '#yearSlider') { node.max = '6'; node.value = '0'; node.min = '0'; }
    document.register(sel, node);
});

const langBtns = [el('button'), el('button')];
langBtns[0].dataset.lang = 'es'; langBtns[1].dataset.lang = 'en';
document.registerAll('.lang-btn', langBtns);

const i18nKeys = ['nav.housing', 'nav.money', 'nav.faq', 'site.eyebrow', 'site.title', 'site.lede',
    'live.label', 'rate.pre', 'rate.post', 'stats.sec', 'stats.min', 'stats.hour', 'stats.day',
    'housing.eyebrow', 'housing.title', 'housing.lede', 'housing.chartsTitle', 'housing.mythsTitle',
    'housing.causesTitle', 'housing.solutionsTitle', 'housing.sourcesTitle', 'housing.disclaimer',
    'money.eyebrow', 'money.pre', 'money.post', 'money.chart.title', 'quote.text', 'quote.cite',
    'infl.title.pre', 'infl.title.red', 'infl.sub', 'infl.sliderLabel', 'infl.hicpNote', 'infl.approxNote',
    'faq.title', 'footer.made', 'footer.license', 'footer.estimate'];
const i18nEls = i18nKeys.map(k => { const n = el('span'); n.dataset.i18n = k; return n; });
document.registerAll('[data-i18n]', i18nEls);
const htmlEl = el('div'); htmlEl.dataset.i18nHtml = 'money.chart.info';
document.registerAll('[data-i18n-html]', [htmlEl]);
document.registerAll('[data-reveal], #m3Chart', [document._els['#m3Chart']]);

global.document = document;
global.localStorage = { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } };
global.navigator = { language: 'es-ES' };
global.IntersectionObserver = class { observe() {} unobserve() {} };
global.setInterval = () => 0;

const DATA = JSON.parse(fs.readFileSync(path.join(FRONTEND, 'data/data.json'), 'utf8'));
const fetched = [];
global.fetch = async (url) => {
    fetched.push(url);
    if (url === 'api/data' || url === 'data/data.json') return { ok: true, json: async () => DATA };
    return { ok: false, status: 404, json: async () => ({}) };
};

const appSrc = fs.readFileSync(path.join(FRONTEND, 'assets/app.js'), 'utf8');
const i18nSrc = fs.readFileSync(path.join(FRONTEND, 'assets/i18n.js'), 'utf8');

(async () => {
    eval(i18nSrc + '\n' + appSrc + '\n;globalThis.EXPOSE = { setLang, updatePrices };');
    const { setLang, updatePrices } = globalThis.EXPOSE;
    await new Promise(r => setTimeout(r, 50));

    const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else console.log('OK:', msg); };
    const els = document._els;
    const housing = DATA.problems.housing;

    assert(fetched[0] === 'api/data', 'la primera fuente es la API');
    assert(document.documentElement.lang === 'es', 'idioma inicial ES');

    const rate = Math.round(DATA.monetary.m3.perSecond).toLocaleString('es-ES');
    assert(els['#rateValue'].textContent === rate + ' €', 'ritmo ES coincide con el dato: ' + els['#rateValue'].textContent);
    const kids = els['#heroCounter'].children;
    assert(kids[kids.length - 1].textContent === '€', 'odómetro termina en € (ES)');
    assert(els['#moneyAmount'].textContent.includes('bill€'), 'importe dinero: ' + els['#moneyAmount'].textContent);
    assert(els['#lastOfficialChip'].textContent.includes('M3'), 'chip último dato M3');

    assert(els['#housingMetrics'].children.length === housing.metrics.filter(m => m.value != null).length,
        'tarjetas de métricas: ' + els['#housingMetrics'].children.length);
    assert(els['#housingCharts'].children.length === housing.charts.length,
        'gráficos de vivienda: ' + els['#housingCharts'].children.length);

    const firstChart = els['#housingCharts'].children[0];
    assert(firstChart.querySelector('.chart-title').textContent === 'Precio de la vivienda (índice, 2015=100)',
        'título del gráfico HPI: ' + firstChart.querySelector('.chart-title').textContent);
    const chartHtml = firstChart.querySelector('.chart-body').innerHTML;
    assert(chartHtml.includes('<svg'), 'el gráfico renderiza SVG');
    assert((chartHtml.match(/<text/g) || []).length >= 8, 'ejes con etiquetas: ' + (chartHtml.match(/<text/g) || []).length);
    assert(chartHtml.includes('pico 2007'), 'marca del pico 2007');
    const solutionsTitle = i18nEls.find(e => e.dataset.i18n === 'housing.solutionsTitle');
    assert(solutionsTitle.textContent === 'Soluciones al problema', 'título de soluciones: ' + solutionsTitle.textContent);
    const popChart = housing.charts.find(c => c.id === 'population');
    assert(popChart.series[0][0] === '2005', 'población arranca en 2005 (horizonte común): ' + popChart.series[0][0]);
    assert(els['#housingMyths'].children.length === 4, 'mitos: 4');
    assert(els['#housingCauses'].children.length === 5, 'causas: 5');
    assert(els['#housingSolutions'].children.length === 5, 'soluciones: 5');
    assert(els['#housingSources'].children.length === housing.sources.length + 3, 'fuentes: datos + referencias');

    const hpiMetric = els['#housingMetrics'].children[0];
    assert(hpiMetric.querySelector('.metric-label').textContent.includes('2015=100'), 'etiqueta métrica HPI');
    assert(/\+[\d.,]+%/.test(hpiMetric.querySelector('.metric-extra').textContent),
        'extra de la métrica HPI: ' + hpiMetric.querySelector('.metric-extra').textContent);

    assert(els['#m3Chart'].children.length === 12, 'gráfico M3: 12 columnas');
    assert(els['#priceGrid'].children.length === DATA.hicp.categories.length + DATA.items.length, 'tarjetas de precios');
    assert(els['#faqList'].children.length === 10, 'FAQ: 10 preguntas');
    assert(els['#faqList'].children[0].querySelector('.faq-tag').textContent === 'Vivienda', 'tag FAQ vivienda');
    assert(els['#faqList'].children[0].querySelector('.faq-q').textContent.startsWith('¿Por qué'), 'primera FAQ en ES');

    updatePrices(6);
    assert(els['#sliderYear'].textContent === 'HOY', 'slider de precios en HOY');

    setLang('en');
    assert(document.documentElement.lang === 'en', 'cambio a EN');
    assert(els['#moneyAmount'].textContent.includes('T'), 'importe dinero en EN: ' + els['#moneyAmount'].textContent);
    assert(els['#housingCharts'].children[0].querySelector('.chart-title').textContent === 'House price index (2015=100)',
        'título del gráfico en EN');
    assert(els['#housingMyths'].children[0].querySelector('.myth-q').textContent.includes('speculation'), 'mito en EN');
    assert(els['#housingMetrics'].children.length === housing.metrics.filter(m => m.value != null).length,
        'métricas tras cambio de idioma');

    console.log(process.exitCode ? 'TESTS FAILED' : 'ALL TESTS PASSED');
})();
