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
    const re = /<(\/)?([a-z]+)([^>]*)>/g;
    const stack = [];
    let pos = 0;
    const attach = (node) => {
        const target = stack.length ? stack[stack.length - 1] : null;
        if (target) target.children.push(node); else made.push(node);
    };
    let m;
    while ((m = re.exec(html))) {
        const closing = m[1], tag = m[2], attrs = m[3] || '';
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

['#headlineAmount', '#rateValue', '#heroSub', '#lastOfficialChip', '#statSec', '#statMin', '#statHour', '#statDay',
    '#chartSub', '#m3Chart', '#m3Years', '#priceGrid', '#faqList', '#heroCounter', '#yearSlider', '#sliderYear'
].forEach(sel => {
    const node = el('div');
    if (sel === '#yearSlider') { node.max = '6'; node.value = '0'; node.min = '0'; }
    document.register(sel, node);
});

const langBtns = [el('button'), el('button')];
langBtns[0].dataset.lang = 'es'; langBtns[1].dataset.lang = 'en';
const i18nEls = [];
['nav.home', 'hero.eyebrow', 'hero.pre', 'hero.post', 'rate.pre', 'rate.post', 'stats.sec', 'stats.min',
    'stats.hour', 'stats.day', 'chart.title', 'chart.info', 'quote.text', 'quote.cite', 'infl.title.pre',
    'infl.title.red', 'infl.sub', 'infl.sliderLabel', 'infl.hicpNote', 'infl.approxNote', 'faq.title',
    'footer.made', 'footer.license', 'footer.estimate'
].forEach(k => { const n = el('span'); n.dataset.i18n = k; i18nEls.push(n); });
document.registerAll('.lang-btn', langBtns);
document.registerAll('[data-i18n]', i18nEls);
document.registerAll('[data-i18n-html]', []);
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

    assert(fetched[0] === 'api/data', 'la primera fuente es la API');
    assert(document.documentElement.lang === 'es', 'idioma inicial ES');

    const rate = Math.round(DATA.monetary.m3.perSecond).toLocaleString('es-ES');
    assert(els['#rateValue'].textContent === rate + ' €', 'ritmo ES coincide con el dato: ' + els['#rateValue'].textContent);

    const kids = els['#heroCounter'].children;
    assert(kids[kids.length - 1].textContent === '€', 'odómetro termina en € (ES)');
    assert(kids[0]._class.has('odometer-slot'), 'odómetro empieza con dígito');

    assert(els['#lastOfficialChip'].textContent.includes(DATA.meta.lastOfficial.monetary.slice(0, 4)), 'chip último dato oficial');
    assert(els['#m3Chart'].children.length === 12, 'gráfico: 12 columnas');
    assert(els['#m3Years'].children.length === 12, 'gráfico: 12 etiquetas');
    assert(els['#priceGrid'].children.length === DATA.hicp.categories.length + DATA.items.length, 'tarjetas precios');
    assert(els['#faqList'].children.length === 8, 'FAQ: 8 preguntas');

    const card = els['#priceGrid'].children[0];
    assert(card.querySelector('.price-card-name').textContent === 'Índice general', 'nombre tarjeta ES');
    assert(/^\+\d+%$/.test(card.querySelector('.price-card-change').textContent), 'badge de cambio con %');

    updatePrices(6);
    assert(card.querySelector('.price-card-change').textContent === 'HOY', 'badge HOY en el extremo derecho');
    assert(els['#sliderYear'].textContent === 'HOY', 'display del slider = HOY');

    setLang('en');
    assert(document.documentElement.lang === 'en', 'cambio a EN');
    assert(els['#headlineAmount'].textContent.includes('€') && els['#headlineAmount'].textContent.includes('T'), 'headline EN con € y T');
    assert(els['#priceGrid'].children[0].querySelector('.price-card-name').textContent === 'All items', 'nombre tarjeta EN');
    assert(els['#faqList'].children[0].querySelector('.faq-q').textContent.startsWith('What is'), 'FAQ EN');

    console.log(process.exitCode ? 'TESTS FAILED' : 'ALL TESTS PASSED');
})();
