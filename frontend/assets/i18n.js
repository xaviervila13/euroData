'use strict';

const I18N = {
    es: {
        langTag: 'es-ES',
        'nav.home': 'Inicio',
        'nav.chart': 'Gráfico M3',
        'nav.prices': 'Precios',
        'nav.faq': 'FAQ',
        'hero.eyebrow': 'Rastreador en tiempo real · Zona euro',
        'hero.pre': 'La masa monetaria de la eurozona supera los',
        'hero.post': 'y sigue creciendo.',
        'rate.pre': 'Creciendo a',
        'rate.post': '/ segundo (estimado)',
        'hero.sub': 'Desde la creación del euro en 1999, <strong>M3</strong> —el agregado monetario más amplio— se ha multiplicado por <strong>{ratio}</strong>: de {from} a {to}. Este contador corre en vivo, interpolando los últimos datos oficiales del BCE.',
        'stats.sec': 'Por segundo',
        'stats.min': 'Por minuto',
        'stats.hour': 'Por hora',
        'stats.day': 'Por día',
        'chart.title': 'Crecimiento de M3',
        'chart.info': '<strong>¿Qué es M3?</strong><br>M3 es la medida más amplia de dinero de la eurozona: efectivo, depósitos a la vista y de ahorro, e instrumentos líquidos del mercado monetario. Cuando el BCE inyecta liquidez (QE, TLTROs) y la banca concede crédito, M3 crece. Una expansión rápida de M3 suele presionar los precios al alza.',
        'chart.sub': 'De {from} en 1980 a {to} en 2026. El saldo del QE de 2020-2021 rompió el gráfico.',
        'quote.text': '«La inflación es impuestos sin legislación.»',
        'quote.cite': 'Milton Friedman',
        'infl.title.pre': 'Lo mismo.',
        'infl.title.red': 'Más caro.',
        'infl.sub': 'Elige un año y mira lo que compraba tu euro.',
        'infl.sliderLabel': 'Viaja en el tiempo',
        'infl.nowBadge': 'HOY',
        'infl.hicpNote': 'Tarjetas oficiales: variación del índice HICP de la eurozona (BCE/Eurostat), base 2015=100 encadenada con 2025=100.',
        'infl.approxNote': '≈ Precios orientativos recopilados manualmente; no son datos oficiales.',
        'chip.lastOfficial': 'Último dato oficial M3:',
        'error.load': 'No se pudieron cargar los datos. Inténtalo de nuevo más tarde.',
        'faq.title': 'Preguntas frecuentes',
        'footer.made': 'Datos públicos del',
        'footer.license': ' · Licencia CC BY 4.0 · Sitio no afiliado al Banco Central Europeo.',
        'footer.estimate': 'El contador es una estimación lineal a partir de datos mensuales. No es asesoramiento financiero.',
        months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
        faq: [
            {
                q: '¿Qué es la "impresión de dinero" del BCE?',
                a: 'El BCE no imprime billetes físicos (eso lo hacen los bancos centrales nacionales del Eurosistema), sino dinero digital: cuando compra bonos (quantitative easing) o presta a la banca (refinanciación, TLTROs) crea reservas nuevas que antes no existían. Su balance pasó de ~2 a ~8,8 billones de euros entre 2015 y 2022. Eso sí, la mayor parte del dinero nuevo la crea la banca comercial al conceder crédito; el BCE fija las condiciones y el ritmo.'
            },
            {
                q: '¿Qué es M3?',
                a: 'Es el agregado monetario más amplio de la eurozona: M1 (efectivo y depósitos a la vista) + M2 (depósitos de ahorro a corto plazo) + instrumentos del mercado monetario. El BCE lo publica cada mes. Hoy ronda los 17,6 billones de euros, casi cuatro veces el que había cuando nació el euro en 1999.'
            },
            {
                q: '¿De dónde sale la cifra de euros por segundo?',
                a: 'De los últimos datos mensuales de M3 publicados por el BCE (con unas semanas de retraso): se toma la variación media de los tres últimos meses y se divide entre los segundos que tiene un mes medio. Es una aproximación lineal: el dinero no crece a ritmo constante. El contador puede incluso ir marcha atrás en meses de contracción, como ocurrió en 2023.'
            },
            {
                q: '¿Por qué el contador es una estimación?',
                a: 'El BCE publica M3 una vez al mes. Entre publicación y publicación, este sitio interpola linealmente a partir de la última variación conocida. La etiqueta «último dato oficial» indica hasta dónde llega el dato real.'
            },
            {
                q: '¿Qué relación tiene con la inflación?',
                a: 'Cuando entra más dinero pero los bienes y servicios no aumentan al mismo ritmo, cada euro compra menos. La correlación entre expansión monetaria y precios a largo plazo es de las más robustas de la macroeconomía, con un desfase típico de 12-18 meses. Según el HICP oficial, los precios de la zona euro son hoy ~85 % más altos que a finales de 1996.'
            },
            {
                q: '¿Puede el BCE "desimprimir"?',
                a: 'En teoría sí (quantitative tightening): el balance del Eurosistema se ha reducido varios billones desde su pico de 2022. En la práctica, M3 apenas se contrae de forma sostenida: hacerlo tiende a provocar recesiones y tensión financiera. La impresión funciona como un trinquete: crece rápido en las crisis y casi nunca retrocede hasta los niveles previos.'
            },
            {
                q: '¿Qué es el efecto Cantillon?',
                a: 'El dinero nuevo no llega a todos por igual: entra primero por el sistema financiero y los estados, que pueden comprar activos antes de que suban los precios. Quienes están cerca del grifo se benefician; ahorradores y asalariados ven cómo su poder de compra se erosiona después. Por eso los activos se disparan mientras los salarios reales avanzan más despacio.'
            },
            {
                q: '¿De dónde salen los datos y qué límites tienen?',
                a: 'Todo procede del ECB Data Portal (licencia CC BY 4.0). M3 usa «composición cambiante»: la eurozona de 1999 no es la de hoy (Grecia entró en 2001, Chipre y Malta en 2008…). El HICP cambió de metodología en febrero de 2026 y encadenamos las bases 2015=100 y 2025=100. Las tarjetas marcadas con «≈» son estimaciones manuales, no datos oficiales. Este sitio no está afiliado al BCE.'
            }
        ]
    },
    en: {
        langTag: 'en-US',
        'nav.home': 'Home',
        'nav.chart': 'M3 Chart',
        'nav.prices': 'Prices',
        'nav.faq': 'FAQ',
        'hero.eyebrow': 'Real-time tracker · Eurozone',
        'hero.pre': 'The eurozone money supply is past',
        'hero.post': 'and still growing.',
        'rate.pre': 'Growing at',
        'rate.post': '/ second (estimated)',
        'hero.sub': 'Since the euro was created in 1999, <strong>M3</strong> — the broadest money aggregate — has grown <strong>{ratio}×</strong>: from {from} to {to}. This counter runs live, interpolating the latest official ECB data.',
        'stats.sec': 'Per second',
        'stats.min': 'Per minute',
        'stats.hour': 'Per hour',
        'stats.day': 'Per day',
        'chart.title': 'M3 Money Supply Growth',
        'chart.info': '<strong>What is M3?</strong><br>M3 is the broadest measure of money in the eurozone: cash, sight and savings deposits, and liquid money-market instruments. When the ECB injects liquidity (QE, TLTROs) and banks extend credit, M3 grows. Rapid M3 expansion usually pushes prices up.',
        'chart.sub': 'From {from} in 1980 to {to} in 2026. The 2020-2021 QE balance broke the chart.',
        'quote.text': '"Inflation is taxation without legislation."',
        'quote.cite': 'Milton Friedman',
        'infl.title.pre': 'Same stuff.',
        'infl.title.red': 'Higher price.',
        'infl.sub': 'Pick a year. See what your euro used to buy.',
        'infl.sliderLabel': 'Travel through time',
        'infl.nowBadge': 'NOW',
        'infl.hicpNote': 'Official cards: change in the eurozone HICP index (ECB/Eurostat), base 2015=100 chained with 2025=100.',
        'infl.approxNote': '≈ Manually collected indicative prices; not official data.',
        'chip.lastOfficial': 'Last official M3 data:',
        'error.load': 'Could not load data. Please try again later.',
        'faq.title': 'Frequently Asked Questions',
        'footer.made': 'Public data from the',
        'footer.license': ' · CC BY 4.0 license · Not affiliated with the European Central Bank.',
        'footer.estimate': 'The counter is a linear estimate from monthly data. Not financial advice.',
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        faq: [
            {
                q: 'What is ECB money printing?',
                a: 'The ECB does not print physical banknotes (the Eurosystem national central banks do that) — it creates digital money: when it buys bonds (quantitative easing) or lends to banks (refinancing operations, TLTROs) it creates new reserves that did not exist before. Its balance sheet grew from ~€2 trillion to ~€8.8 trillion between 2015 and 2022. That said, most new money is created by commercial banks when they extend credit; the ECB sets the conditions and the pace.'
            },
            {
                q: 'What is M3?',
                a: 'M3 is the broadest monetary aggregate of the eurozone: M1 (cash and sight deposits) + M2 (short-term savings deposits) + money-market instruments. The ECB publishes it monthly. It currently stands at about €17.6 trillion — almost four times what existed when the euro was created in 1999.'
            },
            {
                q: 'Where does the euros-per-second figure come from?',
                a: 'From the latest monthly M3 observations published by the ECB (with a few weeks lag): the average change of the last three months is divided by the seconds in an average month. It is a linear approximation — money does not grow at a constant rate. The counter can even run backwards in contracting months, as it did in 2023.'
            },
            {
                q: 'Why is the counter an estimate?',
                a: 'The ECB publishes M3 once a month. Between publications, this site interpolates linearly from the last known change. The "last official data" tag shows how far real data goes.'
            },
            {
                q: 'What does this have to do with inflation?',
                a: 'When more money enters the economy but goods and services do not grow at the same pace, each euro buys less. The long-run correlation between monetary expansion and prices is one of the most robust in macroeconomics, with a typical lag of 12-18 months. Per the official HICP, eurozone prices are now ~85% higher than at the end of 1996.'
            },
            {
                q: 'Can the ECB reverse money printing?',
                a: 'In theory, yes (quantitative tightening): the Eurosystem balance sheet has shrunk by several trillion euros since its 2022 peak. In practice, M3 rarely contracts in a sustained way: doing so tends to cause recessions and financial stress. Money printing works like a ratchet: it grows fast in crises and almost never returns to pre-crisis levels.'
            },
            {
                q: 'What is the Cantillon Effect?',
                a: 'New money does not reach everyone equally: it enters through the financial system and governments first, which can buy assets before prices rise. Those closest to the tap benefit; savers and wage earners see their purchasing power eroded afterwards. That is why asset prices soar while real wages lag behind.'
            },
            {
                q: 'Where does the data come from and what are its limits?',
                a: 'Everything comes from the ECB Data Portal (CC BY 4.0 license). M3 uses a "changing composition": the eurozone of 1999 is not today\'s (Greece joined in 2001, Cyprus and Malta in 2008…). The HICP methodology changed in February 2026; we chain the 2015=100 and 2025=100 bases. Cards marked with "≈" are manually collected estimates, not official data. This site is not affiliated with the ECB.'
            }
        ]
    }
};
