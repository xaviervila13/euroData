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
    return elm.tagName === sel.toUpperCase();
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
    '#housingSources', '#inflationCards', '#inflationCharts', '#inflMythsList',
    '#inflCausesList', '#inflSolutionsList', '#inflSources', '#pensionsMetrics', '#pensionsCharts', '#pensionsSub',
    '#pensionsMythsList', '#pensionsCausesList', '#pensionsSolutionsList', '#pensionsSources',
    '#pensionsSimMetrics', '#pensionsSimCharts', '#pensionsAssumptions', '#pensionsSimLede', '#pensionsRefs',
    '#debtMetrics', '#debtCharts', '#debtMythsList', '#debtCausesList', '#debtSolutionsList', '#debtSources', '#debtSub',
    '#priceGrid', '#faqList', '#yearSlider', '#sliderYear'
].forEach(sel => {
    const node = el('div');
    if (sel === '#yearSlider') { node.max = '6'; node.value = '0'; node.min = '0'; }
    document.register(sel, node);
});

const langBtns = [el('button'), el('button')];
langBtns[0].dataset.lang = 'es'; langBtns[1].dataset.lang = 'en';
document.registerAll('.lang-btn', langBtns);

const i18nKeys = ['nav.housing', 'nav.inflation', 'nav.pensions', 'nav.debt', 'nav.faq', 'site.eyebrow', 'site.title', 'site.lede',
    'live.label', 'rate.pre', 'rate.post', 'stats.sec', 'stats.min', 'stats.hour', 'stats.day',
    'housing.eyebrow', 'housing.title', 'housing.lede', 'housing.chartsTitle', 'housing.mythsTitle',
    'housing.causesTitle', 'housing.solutionsTitle', 'housing.sourcesTitle', 'housing.disclaimer',
    'infl.eyebrow', 'infl.headline.pre', 'infl.headline.hl', 'infl.chart.title', 'infl.m3note',
    'infl.card.pp.label', 'infl.card.savings.label', 'infl.giftTitle', 'infl.giftNote',
    'metric.basket_eur.label', 'metric.basket_gold.label',
    'pensions.eyebrow', 'pensions.title', 'pensions.lede', 'pensions.mythsTitle',
    'pensions.causesTitle', 'pensions.solutionsTitle', 'pensions.sourcesTitle', 'pensions.disclaimer',
    'metric.pension_spend.label', 'metric.old_dep.label', 'metric.old_dep_2050.label',
    'pensions.simTitle', 'pensions.simLede', 'pensions.assumptionsTitle', 'sim.note',
    'pensions.realTitle', 'pensions.realNote', 'pensions.refTitle', 'pensions.refLede', 'sim.refNote',
    'debt.eyebrow', 'debt.title', 'debt.lede', 'debt.chartsTitle', 'debt.mythsTitle', 'debt.causesTitle',
    'debt.solutionsTitle', 'debt.sourcesTitle', 'debt.disclaimer',
    'metric.debt_gdp.label', 'metric.interest_eur.label', 'chart.debt_gdp.title', 'chart.debt_total.title', 'chart.debt_compare.title',
    'metric.sim_capital_mid.label', 'metric.sim_pension.label',
    'infl.mythsTitle', 'infl.causesTitle', 'infl.solutionsTitle', 'infl.sourcesTitle', 'quote.text', 'quote.cite',
    'infl.title.pre', 'infl.title.red', 'infl.sub', 'infl.sliderLabel', 'infl.hicpNote', 'infl.approxNote',
    'faq.title', 'footer.made', 'footer.license', 'footer.estimate'];
const i18nEls = i18nKeys.map(k => { const n = el('span'); n.dataset.i18n = k; return n; });
document.registerAll('[data-i18n]', i18nEls);
const htmlEl = el('div'); htmlEl.dataset.i18nHtml = 'infl.chart.info';
document.registerAll('[data-i18n-html]', [htmlEl]);
document.registerAll('[data-reveal], #m3Chart', [document._els['#m3Chart']]);

global.document = document;
global.localStorage = { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = v; } };
global.navigator = { language: 'es-ES' };
global.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) { this.cb([{ isIntersecting: true, target: el }], this); }
    unobserve() {}
};
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
    eval(i18nSrc + '\n' + appSrc + '\n;globalThis.EXPOSE = { setLang, updatePrices, I18N, tick, updateOdometer };');
    const { setLang, updatePrices, I18N, tick, updateOdometer } = globalThis.EXPOSE;
    await new Promise(r => setTimeout(r, 50));

    const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else console.log('OK:', msg); };
    const els = document._els;
    const housing = DATA.problems.housing;

    assert(fetched[0] === 'data/data.json', 'pinta primero con el snapshot estatico: ' + fetched[0]);
    assert(fetched.includes('api/data'), 'y revalida en segundo plano contra la API');
    assert(document.documentElement.lang === 'es', 'idioma inicial ES');
    // ninguna etiqueta de navegacion puede quedar sin texto (clave i18n que falte)
    const navKeys = ['nav.housing', 'nav.inflation', 'nav.pensions', 'nav.faq'];
    const navMissing = navKeys.filter(k => {
        const el = i18nEls.find(e => e.dataset.i18n === k);
        return !el || !el.textContent || el.textContent === 'undefined';
    });
    assert(navMissing.length === 0, 'enlaces de navegacion con texto: ' + (navMissing.join(', ') || 'todos OK'));
    // y todas las claves i18n usadas en el HTML deben existir
    const missingKeys = i18nEls.filter(e => !I18N.es[e.dataset.i18n] || !I18N.en[e.dataset.i18n]).map(e => e.dataset.i18n);
    assert(missingKeys.length === 0, 'claves i18n definidas en ES y EN: ' + (missingKeys.join(', ') || 'todas OK'));

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
    assert(chartHtml.includes('Ley de Vivienda'), 'el gráfico de precios marca la Ley de Vivienda de 2023');
    const depProj = housing.charts.find(c => c.id === 'old_dep');
    assert(!depProj, 'la dependencia ya no está en vivienda');
    const solutionsTitle = i18nEls.find(e => e.dataset.i18n === 'housing.solutionsTitle');
    assert(solutionsTitle.textContent === 'Soluciones al problema', 'título de soluciones: ' + solutionsTitle.textContent);
    const popChart = housing.charts.find(c => c.id === 'population');
    assert(popChart.series[0][0] === '2005', 'población arranca en 2005 (horizonte común): ' + popChart.series[0][0]);
    assert(els['#housingMyths'].children.length === 4, 'mitos: 4');
    assert(els['#housingCauses'].children.length === 5, 'causas: 5');
    assert(els['#housingSolutions'].children.length === 5, 'soluciones: 5');
    assert(els['#housingSources'].children.length === housing.sources.length, 'fuentes de vivienda');

    const hpiMetric = els['#housingMetrics'].children[0];
    assert(hpiMetric.querySelector('.metric-label').textContent.includes('2015=100'), 'etiqueta métrica HPI');
    assert(/\+[\d.,]+%/.test(hpiMetric.querySelector('.metric-extra').textContent),
        'extra de la métrica HPI: ' + hpiMetric.querySelector('.metric-extra').textContent);

    assert(els['#inflationCards'].children.length === 2, 'tarjetas de inflación: ' + els['#inflationCards'].children.length);
    const ppCard = els['#inflationCards'].children[0];
    assert(/€/.test(ppCard.querySelector('.metric-value').textContent), 'tarjeta poder de compra: ' + ppCard.querySelector('.metric-value').textContent);
    assert(/\+\d+%/.test(ppCard.querySelector('.metric-extra').textContent), 'nota acumulada: ' + ppCard.querySelector('.metric-extra').textContent);
    const savCard = els['#inflationCards'].children[1];
    assert(/[−-]\d/.test(savCard.querySelector('.metric-value').textContent), 'tarjeta ahorros: ' + savCard.querySelector('.metric-value').textContent);
    assert(els['#moneySub'].innerHTML.includes('15.610 €'), 'lede de inflación con el ritmo');
    const inflCharts = els['#inflationCharts'].children;
    assert(inflCharts.length === DATA.problems.inflation.charts.length, 'gráficos de inflación: ' + inflCharts.length);
    const twoSeries = inflCharts[0];
    assert(twoSeries.querySelector('.chart-legend').children.length === 2, 'leyenda de 2 series en el gráfico dinero/PIB');
    assert(twoSeries.querySelector('.lg-b').textContent.includes('oro'), 'etiqueta de la segunda serie: ' + twoSeries.querySelector('.lg-b').textContent);
    assert(/<svg/.test(twoSeries.querySelector('.chart-body').innerHTML), 'gráfico de 2 series renderiza');
    assert(els['#inflMythsList'].children.length === 3, 'mitos de inflación: 3');
    assert(els['#inflCausesList'].children.length === 4, 'causas de inflación: 4');
    assert(els['#inflSolutionsList'].children.length === 5, 'soluciones de inflación: 5');
    assert(els['#inflSources'].children.length === DATA.problems.inflation.sources.length, 'fuentes de inflación');
    const pens = DATA.problems.pensions;
    assert(els['#pensionsMetrics'].children.length === pens.metrics.length, 'métricas de pensiones: ' + els['#pensionsMetrics'].children.length);
    assert(els['#pensionsCharts'].children.length === pens.charts.length, 'gráficos de pensiones: ' + els['#pensionsCharts'].children.length);
    // la proyección de dependencia debe empalmar con la observada (misma definición)
    const depChartSpec = pens.charts.find(c => c.id === 'old_dep');
    const lastObs = depChartSpec.series[depChartSpec.series.length - 1][1];
    const firstProj = depChartSpec.series2[1][1];
    assert(Math.abs(firstProj - lastObs) <= 1.5, `empalme continuo de la dependencia: ${lastObs} -> ${firstProj}`);
    const dep2050 = pens.metrics.find(m => m.id === 'old_dep_2050').value;
    assert(dep2050 > 50 && dep2050 < 65, 'dependencia 2050 en rango: ' + dep2050);
    const sim = pens.simulator;
    assert(els['#pensionsSimMetrics'].children.length === sim.metrics.length, 'métricas del simulador: ' + els['#pensionsSimMetrics'].children.length);
    assert(els['#pensionsSimCharts'].children.length === sim.charts.length, 'gráfico del simulador');
    assert(els['#pensionsAssumptions'].children.length === sim.assumptions.length, 'supuestos listados: ' + els['#pensionsAssumptions'].children.length);
    assert(els['#pensionsRefs'].children.length === sim.references.length, 'tarjetas de referencia: ' + els['#pensionsRefs'].children.length);
    const stockRef = els['#pensionsRefs'].children[sim.references.length - 1];
    assert(/\+7/.test(stockRef.querySelector('.metric-value').textContent), 'referencia de bolsa ~7%: ' + stockRef.querySelector('.metric-value').textContent);
    const bondRef = els['#pensionsRefs'].children[0];
    assert(/\+0\.95|\+0,95/.test(bondRef.querySelector('.metric-value').textContent), 'deuda española real: ' + bondRef.querySelector('.metric-value').textContent);
    const negativeRef = els['#pensionsRefs'].children[1];
    assert(negativeRef._class.has('ref-negative'), 'la última década de deuda española se marca como negativa');
    const simChart = els['#pensionsSimCharts'].children[0];
    assert(simChart.querySelector('.chart-legend').children.length === 3, 'leyenda con 3 escenarios');
    const simSvg = simChart.querySelector('.chart-body').innerHTML;
    assert(simSvg.includes('stroke-dasharray'), 'el gráfico lleva la línea de referencia');
    assert(/M€|k€/.test(els['#pensionsSimMetrics'].children[1].querySelector('.metric-value').textContent), 'capital formateado en €: ' + els['#pensionsSimMetrics'].children[1].querySelector('.metric-value').textContent);
    const spendChart = els['#pensionsCharts'].children[1];
    assert(spendChart.querySelector('.chart-body').innerHTML.includes('stroke-dasharray'), 'el gasto en pensiones proyecta a trazos');
    assert(spendChart.querySelector('.chart-note') !== null, 'el gráfico de estimación lleva nota metodológica');
    assert(els['#pensionsCharts'].children[2].querySelector('.chart-legend').children.length === 2, 'leyenda del comparativo social/educación');
    assert(els['#pensionsMythsList'].children.length === 5, 'mitos de pensiones: 5');
    assert(els['#pensionsCausesList'].children.length === 5, 'causas de pensiones: 5');
    assert(els['#pensionsSolutionsList'].children.length === 5, 'soluciones de pensiones: 5');
    assert(els['#pensionsSources'].children.length === pens.sources.length, 'fuentes de pensiones');
    const depChart = els['#pensionsCharts'].children[0];
    assert(depChart.querySelector('.chart-legend').children.length === 2, 'leyenda observado/proyección');
    assert(depChart.querySelector('.chart-body').innerHTML.includes('stroke-dasharray'), 'la proyección va a trazos');
    const firstPensMetric = els['#pensionsMetrics'].children[0];
    assert(/%/.test(firstPensMetric.querySelector('.metric-value').textContent), 'métrica de gasto en %: ' + firstPensMetric.querySelector('.metric-value').textContent);
    // render diferido de gráficos: cada cuerpo sabe qué gráfico le corresponde
    assert(firstChart.querySelector('.chart-body').dataset.chartId === 'hpi', 'el gráfico conoce su id para el render diferido');
    // odómetro: cachea los strips y solo anima los dígitos que cambian
    assert(els['#heroCounter']._od && els['#heroCounter']._od.strips.length === els['#heroCounter'].children.length,
        'el odómetro cachea sus strips');
    const t0 = Date.now();
    let n = 17613983000000;
    for (let i = 0; i < 200; i++) {
        n += 12345;
        updateOdometer(els['#heroCounter'], n.toLocaleString('es-ES') + ' €');
    }
    const tickMs = Date.now() - t0;
    assert(tickMs < 300, `200 actualizaciones del odómetro en ${tickMs} ms`);
    const debt = DATA.problems.debt;
    assert(els['#debtMetrics'].children.length === debt.metrics.length, 'métricas de deuda: ' + els['#debtMetrics'].children.length);
    assert(els['#debtCharts'].children.length === debt.charts.length, 'gráficos de deuda: ' + els['#debtCharts'].children.length);
    assert(els['#debtMythsList'].children.length === 3, 'mitos de deuda: 3');
    assert(els['#debtCausesList'].children.length === 5, 'causas de deuda: 5');
    assert(els['#debtSolutionsList'].children.length === 5, 'soluciones de deuda: 5');
    assert(els['#debtSources'].children.length === debt.sources.length, 'fuentes de deuda');
    const debtChart = els['#debtCharts'].children[0];
    assert(debtChart.querySelector('.chart-body').innerHTML.includes('pico 2020'), 'la deuda marca el máximo de 2020');
    const debtTotal = els['#debtCharts'].children[1];
    assert(debtTotal.querySelector('.chart-body').innerHTML.includes('fill="url(#barGradRed)"'), 'la deuda en euros resalta el último año');
    const compare = els['#debtCharts'].children[2];
    assert(compare.querySelector('.chart-body').innerHTML.includes('Intereses'), 'la comparativa traduce las categorías');
    assert(compare.querySelector('.chart-body').innerHTML.includes('fill="url(#barGradRed)"'), 'la barra de intereses va resaltada');
    assert(els['#m3Chart'].children.length === 12, 'gráfico M3: 12 columnas');
    assert(els['#priceGrid'].children.length === DATA.hicp.categories.length + DATA.items.length, 'tarjetas de precios');
    assert(els['#faqList'].children.length === 11, 'FAQ: 11 preguntas');
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
    assert(els['#inflationCards'].children.length === 2, 'tarjetas de inflación en EN');
    assert(els['#pensionsMetrics'].children.length === pens.metrics.length, 'métricas de pensiones en EN');
    assert(els['#pensionsMythsList'].children[0].querySelector('.myth-q').textContent.includes('workers'), 'primer mito de pensiones en EN');
    assert(/\+\d+%/.test(els['#inflationCards'].children[0].querySelector('.metric-extra').textContent),
        'nota de poder de compra en EN');

    console.log(process.exitCode ? 'TESTS FAILED' : 'ALL TESTS PASSED');
})();
