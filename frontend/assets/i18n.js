'use strict';

const I18N = {
    es: {
        langTag: 'es-ES',
        'nav.housing': 'Vivienda',
        'nav.money': 'Dinero',
        'nav.faq': 'Preguntas',
        'site.eyebrow': 'Datos oficiales · Análisis liberal',
        'site.title': 'Los grandes problemas económicos de España, con datos.',
        'site.lede': 'Vivienda, dinero y Estado. Cada problema con sus gráficos oficiales de INE, Eurostat y BCE, la causa de raíz y las soluciones que funcionan.',
        'live.label': 'En directo · Masa monetaria de la eurozona (M3)',
        'rate.pre': 'Creciendo a',
        'rate.post': '/ segundo (estimado)',
        'stats.sec': 'Por segundo',
        'stats.min': 'Por minuto',
        'stats.hour': 'Por hora',
        'stats.day': 'Por día',
        'chip.lastOfficial': 'Último dato oficial M3:',
        'error.load': 'No se pudieron cargar los datos. Inténtalo de nuevo más tarde.',

        'housing.eyebrow': 'Problema 01 · Vivienda',
        'housing.title': 'El precio de la vivienda supera todos los récords.',
        'housing.lede': 'El índice de precios está un 33% por encima del pico de la burbuja de 2007, mientras la construcción de vivienda sigue muy por debajo de lo que exige la población. No es especulación: es oferta estrangulada.',
        'housing.metricsTitle': 'Las cifras',
        'housing.chartsTitle': 'Los datos',
        'housing.mythsTitle': 'Lo que se dice… y lo que dicen los datos',
        'housing.causesTitle': 'Las causas de raíz',
        'housing.solutionsTitle': 'Soluciones al problema',
        'housing.sourcesTitle': 'Fuentes y referencias',
        'housing.disclaimer': 'Los datos provienen de fuentes oficiales (Eurostat, INE, BCE) y son verificables en los enlaces. La interpretación de sus causas es editorial: parte del marco liberal de la escuela austriaca.',

        'metric.hpi.label': 'Precio de la vivienda (2015=100)',
        'metric.hpi.extra': '% sobre el pico de {ref}',
        'metric.hpi_yoy.label': 'Variación anual del precio',
        'metric.visados.label': 'Visados de obra nueva (miles)',
        'metric.visados.extra': '% frente al máximo de {ref}',
        'metric.hogares.label': 'Hogares en España',
        'metric.hogares.extra': 'millones más que en {ref}',
        'metric.tamano_hogar.label': 'Personas por hogar',
        'metric.inmigracion.label': 'Inmigración en {ref} (personas)',
        'metric.poblacion.label': 'Población',
        'metric.poblacion.extra': 'millones más que en {ref}',
        'metric.loading': 'sin datos',

        'chart.hpi.title': 'Precio de la vivienda (índice, 2015=100)',
        'chart.permits.title': 'Visados de obra nueva de vivienda (miles)',
        'chart.population.title': 'Población de España',
        'chart.hogares.title': 'Hogares (trimestral, desde 2021)',
        'chart.inmigracion.title': 'Inmigración anual',
        'chart.tamano_hogar.title': 'Personas por hogar',
        'chart.peak': 'pico {year}',
        'chart.crisis': 'ajuste 2008-2013',
        'chart.source': 'Fuente',
        'chart.min': 'mín.',

        'money.eyebrow': 'Problema 02 · Dinero',
        'money.pre': 'La masa monetaria de la eurozona supera los',
        'money.post': 'y sigue creciendo.',
        'money.sub': 'Desde la creación del euro en 1999, <strong>M3</strong> —el agregado monetario más amplio— se ha multiplicado por <strong>{ratio}</strong>: de {from} a {to}. Este contador corre en vivo, interpolando los últimos datos oficiales del BCE.',
        'money.chart.title': 'Crecimiento de M3',
        'money.chart.info': '<strong>¿Qué es M3?</strong><br>M3 es la medida más amplia de dinero de la eurozona: efectivo, depósitos a la vista y de ahorro, e instrumentos líquidos del mercado monetario. Cuando el BCE inyecta liquidez (QE, TLTROs) y la banca concede crédito, M3 crece. Una expansión rápida de M3 suele presionar los precios al alza.',
        'money.chart.sub': 'De {from} en 1980 a {to} en 2026. El saldo del QE de 2020-2021 rompió el gráfico.',
        'quote.text': '«La inflación es impuestos sin legislación.»',
        'quote.cite': 'Milton Friedman',
        'infl.title.pre': 'Lo mismo.',
        'infl.title.red': 'Más caro.',
        'infl.sub': 'Elige un año y mira lo que compraba tu euro.',
        'infl.sliderLabel': 'Viaja en el tiempo',
        'infl.nowBadge': 'HOY',
        'infl.hicpNote': 'Tarjetas oficiales: variación del índice HICP de la eurozona (BCE/Eurostat), base 2015=100 encadenada con 2025=100.',
        'infl.approxNote': '≈ Precios orientativos recopilados manualmente; no son datos oficiales.',

        'faq.title': 'Preguntas frecuentes',
        'faq.tag.housing': 'Vivienda',
        'faq.tag.money': 'Dinero',
        'footer.made': 'Datos oficiales de',
        'footer.license': ' · INE, Eurostat y BCE (CC BY 4.0) · Sitio no afiliado a ninguna administración.',
        'footer.estimate': 'El contador de dinero es una estimación lineal a partir de datos mensuales. Nada de esto es asesoramiento financiero.',
        months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],

        housingMyths: [
            { q: '«Los precios suben por la especulación»', a: 'Entre 2008 y 2013, con los mismos o más especuladores, el índice de precios cayó un 35%. Lo que cambió no fue la moral de los inversores, sino el crédito y la obra nueva. Hoy la obra nueva sigue un 73% por debajo del máximo de 2006.' },
            { q: '«Sobran viviendas vacías»', a: 'La vacancia se concentra en provincias donde no hay empleo; en Madrid, Barcelona o Málaga la tasa es mínima y los precios marcan récords. El stock vacío donde no se demanda no alivia donde se demanda.' },
            { q: '«La culpa es de la inmigración»', a: 'La inmigración suma demanda (1,29M personas en 2024), pero el desajuste no viene de ahí: los hogares crecen y la construcción no responde. Donde se construye más, los precios suben menos.' },
            { q: '«Los alquileres suben por los pisos turísticos»', a: 'En los centros turísticos influyen, pero donde el precio explota es donde la oferta nueva no reacciona: licencias, planeamiento y tasas. Prohibir el turístico no crea una sola vivienda.' }
        ],
        housingCauses: [
            'Suelo estrangulado: la clasificación del suelo depende del planeamiento municipal y autonómico. El suelo finalista escasea artificialmente y su coste pesa cada vez más en el precio final.',
            'Costes y trámites: licencias, tasas de construcción, informes sectoriales y reservas obligatorias alargan años cada promoción y encarecen cada vivienda.',
            'Fiscalidad sobre la compra: el ITP y el AJD superan el 10% del precio en muchas comunidades, más IBI y plusvalía municipal. Es un sobrecoste de miles de euros para el comprador.',
            'Oferta que no reacciona: 200.000 visados en 2025 frente a 735.000 en el año 2006, mientras los hogares aumentan en 1,3 millones desde 2021.',
            'Intervención del alquiler: topes de actualización y zonas tensionadas reducen la oferta de alquiler y trasladan presión al mercado de compraventa.'
        ],
        housingSolutions: [
            'Liberalizar suelo: clasificación automática como urbanizable del suelo con acceso a servicios, con silencio administrativo positivo.',
            'Sustituir licencias previas por declaración responsable: construir deja de esperar años a una ventanilla.',
            'Bajar los impuestos a la compra: ITP y AJD cercanos a cero; el IBI, ligado al coste real del servicio.',
            'Eliminar reservas obligatorias de VPO y topes de precio: la vivienda protegida reduce la oferta libre y sube el precio de la libre.',
            'Seguridad jurídica del alquiler: contratos rápidos y desalojo ágil de ocupaciones para que alquilar no dé miedo.'
        ],
        housingRefs: [
            { label: 'Juan Ramón Rallo · análisis económico liberal', url: 'https://juanramonrallo.com' },
            { label: 'Rallo · crisis de la vivienda (vídeos)', url: 'https://www.youtube.com/@juanrallo' },
            { label: 'Instituto Juan de Mariana', url: 'https://www.juandemariana.org' }
        ],

        faq: [
            {
                q: '¿Por qué se han disparado los precios de la vivienda en España?',
                tag: 'housing',
                a: 'Porque la demanda crece y la oferta no responde. Los hogares han aumentado en 1,3 millones desde 2021 y la población ha subido en varios millones, mientras los visados de obra nueva (200.000 en 2025) siguen muy por debajo del máximo de 2006 (735.000). Cuando la oferta está limitada por suelo, licencias y tasas, cualquier aumento de demanda se traslada íntegro al precio.'
            },
            {
                q: '¿No es simplemente un problema de inmigración?',
                tag: 'housing',
                a: 'La inmigración aumenta la demanda: 1,29 millones de personas llegaron en 2024. Pero es una parte de la demanda total, y el precio no sube porque llegue gente, sino porque la oferta no puede responder. Si el suelo estuviera liberalizado y construir fuera rápido y barato, la construcción se adaptaría; lo que convierte la demanda en precios récord es el estrangulamiento de la oferta.'
            },
            {
                q: '¿Qué pasó en 2008-2013, cuando los precios cayeron?',
                tag: 'housing',
                a: 'El índice de precios cayó más de un 35% entre sus máximos de 2007 y el suelo de 2013. Fue el ajuste tras una burbuja de crédito y sobreconstrucción. Hoy el índice está un 33% por encima de aquel pico, pero con una diferencia clave: entonces sobraba oferta; ahora falta.'
            },
            {
                q: '¿No ayudaría construir más vivienda pública?',
                tag: 'housing',
                a: 'La vivienda pública y las reservas obligatorias de VPO reducen el suelo y los recursos destinados a vivienda libre, y no han evitado que el índice marque máximos históricos. La alternativa más rápida y más barata es menos regulación, no más gasto: liberar suelo, eliminar tasas y licencias previas y bajar los impuestos que gravan cada compra.'
            },
            {
                q: '¿Qué es la "impresión de dinero" del BCE?',
                tag: 'money',
                a: 'El BCE no imprime billetes físicos (eso lo hacen los bancos centrales nacionales del Eurosistema), sino dinero digital: cuando compra bonos (quantitative easing) o presta a la banca crea reservas nuevas. Su balance pasó de ~2 a ~8,8 billones de euros entre 2015 y 2022. La mayor parte del dinero nuevo la crea la banca comercial al conceder crédito; el BCE fija las condiciones.'
            },
            {
                q: '¿Qué es M3?',
                tag: 'money',
                a: 'Es el agregado monetario más amplio de la eurozona: M1 (efectivo y depósitos a la vista) + M2 (ahorro a corto plazo) + instrumentos del mercado monetario. El BCE lo publica cada mes. Hoy ronda los 17,6 billones de euros, casi cuatro veces el que había cuando nació el euro en 1999.'
            },
            {
                q: '¿De dónde sale la cifra de euros por segundo?',
                tag: 'money',
                a: 'De los últimos datos mensuales de M3 publicados por el BCE: se toma la variación media de los tres últimos meses y se divide entre los segundos que tiene un mes medio. Es una aproximación lineal; el contador puede ir marcha atrás en meses de contracción, como ocurrió en 2023.'
            },
            {
                q: '¿Qué relación tiene el dinero con la inflación?',
                tag: 'money',
                a: 'Cuando entra más dinero pero los bienes y servicios no aumentan al mismo ritmo, cada euro compra menos. La correlación entre expansión monetaria y precios a largo plazo es de las más robustas de la macroeconomía, con un desfase típico de 12-18 meses. Según el HICP, los precios de la eurozona son hoy ~85% más altos que a finales de 1996.'
            },
            {
                q: '¿Puede el BCE "desimprimir"?',
                tag: 'money',
                a: 'En teoría sí (quantitative tightening): el balance del Eurosistema se ha reducido varios billones desde 2022. En la práctica, M3 apenas se contrae de forma sostenida: hacerlo tiende a provocar recesiones. La impresión funciona como un trinquete: crece rápido en las crisis y casi nunca vuelve a los niveles previos.'
            },
            {
                q: '¿Qué es el efecto Cantillon?',
                tag: 'money',
                a: 'El dinero nuevo no llega a todos por igual: entra primero por el sistema financiero y los estados, que compran activos antes de que suban los precios. Quienes están cerca del grifo se benefician; ahorradores y asalariados ven erosionado su poder de compra después. Por eso los activos se disparan mientras los salarios reales avanzan más despacio.'
            }
        ]
    },

    en: {
        langTag: 'en-US',
        'nav.housing': 'Housing',
        'nav.money': 'Money',
        'nav.faq': 'FAQ',
        'site.eyebrow': 'Official data · Liberal analysis',
        'site.title': "Spain's biggest economic problems, in data.",
        'site.lede': 'Housing, money and the state. Every problem with its official charts from INE, Eurostat and the ECB, the root cause and the policies that work.',
        'live.label': 'Live · Eurozone money supply (M3)',
        'rate.pre': 'Growing at',
        'rate.post': '/ second (estimated)',
        'stats.sec': 'Per second',
        'stats.min': 'Per minute',
        'stats.hour': 'Per hour',
        'stats.day': 'Per day',
        'chip.lastOfficial': 'Last official M3 data:',
        'error.load': 'Could not load data. Please try again later.',

        'housing.eyebrow': 'Problem 01 · Housing',
        'housing.title': 'Housing prices have never been this high.',
        'housing.lede': 'The price index is 33% above the 2007 bubble peak, while housing construction stays far below what the population needs. This is not speculation: it is a strangled supply.',
        'housing.metricsTitle': 'The numbers',
        'housing.chartsTitle': 'The data',
        'housing.mythsTitle': 'What people say… and what the data says',
        'housing.causesTitle': 'Root causes',
        'housing.solutionsTitle': 'Solutions to the problem',
        'housing.sourcesTitle': 'Sources and references',
        'housing.disclaimer': 'Data comes from official sources (Eurostat, INE, ECB) and is verifiable in the links. The interpretation of its causes is editorial: it follows the liberal Austrian-school framework.',

        'metric.hpi.label': 'House price index (2015=100)',
        'metric.hpi.extra': '% over the {ref} peak',
        'metric.hpi_yoy.label': 'Annual price change',
        'metric.visados.label': 'New-build permits (thousands)',
        'metric.visados.extra': '% vs the {ref} peak',
        'metric.hogares.label': 'Households in Spain',
        'metric.hogares.extra': 'million more than in {ref}',
        'metric.tamano_hogar.label': 'People per household',
        'metric.inmigracion.label': 'Immigration in {ref} (people)',
        'metric.poblacion.label': 'Population',
        'metric.poblacion.extra': 'million more than in {ref}',
        'metric.loading': 'no data',

        'chart.hpi.title': 'House price index (2015=100)',
        'chart.permits.title': 'New-build housing permits (thousands)',
        'chart.population.title': 'Population of Spain',
        'chart.hogares.title': 'Households (quarterly, since 2021)',
        'chart.inmigracion.title': 'Annual immigration',
        'chart.tamano_hogar.title': 'People per household',
        'chart.peak': '{year} peak',
        'chart.crisis': '2008-2013 bust',
        'chart.source': 'Source',
        'chart.min': 'min.',

        'money.eyebrow': 'Problem 02 · Money',
        'money.pre': 'The eurozone money supply is past',
        'money.post': 'and still growing.',
        'money.sub': 'Since the euro was created in 1999, <strong>M3</strong> — the broadest money aggregate — has grown <strong>{ratio}×</strong>: from {from} to {to}. This counter runs live, interpolating the latest official ECB data.',
        'money.chart.title': 'M3 Money Supply Growth',
        'money.chart.info': '<strong>What is M3?</strong><br>M3 is the broadest measure of money in the eurozone: cash, sight and savings deposits, and liquid money-market instruments. When the ECB injects liquidity (QE, TLTROs) and banks extend credit, M3 grows. Rapid M3 expansion usually pushes prices up.',
        'money.chart.sub': 'From {from} in 1980 to {to} in 2026. The 2020-2021 QE balance broke the chart.',
        'quote.text': '"Inflation is taxation without legislation."',
        'quote.cite': 'Milton Friedman',
        'infl.title.pre': 'Same stuff.',
        'infl.title.red': 'Higher price.',
        'infl.sub': 'Pick a year. See what your euro used to buy.',
        'infl.sliderLabel': 'Travel through time',
        'infl.nowBadge': 'NOW',
        'infl.hicpNote': 'Official cards: change in the eurozone HICP index (ECB/Eurostat), base 2015=100 chained with 2025=100.',
        'infl.approxNote': '≈ Manually collected indicative prices; not official data.',

        'faq.title': 'Frequently Asked Questions',
        'faq.tag.housing': 'Housing',
        'faq.tag.money': 'Money',
        'footer.made': 'Official data from',
        'footer.license': ' · INE, Eurostat and ECB (CC BY 4.0) · Not affiliated with any government.',
        'footer.estimate': 'The money counter is a linear estimate from monthly data. None of this is financial advice.',
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

        housingMyths: [
            { q: '"High prices are speculation"', a: 'Between 2008 and 2013, with the same or more speculators, the price index fell 35%. What changed was credit and new construction — not investors\' morals. Today new-build permits are still 73% below the 2006 peak.' },
            { q: '"There are plenty of empty homes"', a: 'Vacancies concentrate in provinces with no jobs; in Madrid, Barcelona or Málaga the vacancy rate is minimal and prices hit records. Empty stock where nobody wants to live does not help where everyone wants to live.' },
            { q: '"It is immigration\'s fault"', a: 'Immigration adds demand (1.29M people in 2024), but the mismatch is not caused by it: households keep growing and construction does not respond. Where more is built, prices rise less.' },
            { q: '"Rents rise because of tourist flats"', a: 'They matter in tourist centres, but prices explode where new supply cannot react: licences, zoning and fees. Banning tourist flats does not create a single home.' }
        ],
        housingCauses: [
            'Strangled land: land classification depends on municipal and regional zoning. Buildable land is artificially scarce and its cost weighs ever more on the final price.',
            'Costs and red tape: licences, construction fees, sectoral reports and mandatory reserves add years to every development and money to every home.',
            'Taxes on purchase: transfer tax (ITP) and stamp duty (AJD) exceed 10% of the price in many regions, plus property tax and municipal capital gains. Thousands of euros of extra cost for buyers.',
            'Supply that does not react: 200,000 permits in 2025 versus 735,000 in 2006, while households grew by 1.3 million since 2021.',
            'Rent intervention: caps on rent updates and "stressed areas" reduce rental supply and shift pressure to the purchase market.'
        ],
        housingSolutions: [
            'Liberalise land: automatic buildable status for land with access to services, with positive administrative silence.',
            'Replace prior licences with a responsible declaration: building stops waiting years at a desk.',
            'Cut taxes on purchase: near-zero ITP and stamp duty; property tax tied to the real cost of the service.',
            'Remove mandatory social-housing quotas and price caps: protected housing shrinks the free market and raises free-market prices.',
            'Legal certainty for landlords: fast contracts and swift eviction of squatters so renting is not scary.'
        ],
        housingRefs: [
            { label: 'Juan Ramón Rallo · liberal economic analysis', url: 'https://juanramonrallo.com' },
            { label: 'Rallo · the housing crisis (videos)', url: 'https://www.youtube.com/@juanrallo' },
            { label: 'Instituto Juan de Mariana', url: 'https://www.juandemariana.org' }
        ],

        faq: [
            {
                q: 'Why have housing prices exploded in Spain?',
                tag: 'housing',
                a: 'Because demand grows and supply does not respond. Households increased by 1.3 million since 2021 and the population rose by millions, while new-build permits (200,000 in 2025) remain far below the 2006 peak (735,000). When supply is limited by land, licences and fees, any demand increase goes straight into prices.'
            },
            {
                q: 'Is it not simply an immigration problem?',
                tag: 'housing',
                a: 'Immigration adds demand: 1.29 million people arrived in 2024. But it is one part of total demand, and prices rise not because people arrive but because supply cannot respond. With liberalised land and fast, cheap construction, building would adapt; what turns demand into record prices is the strangled supply.'
            },
            {
                q: 'What happened in 2008-2013, when prices fell?',
                tag: 'housing',
                a: 'The index fell more than 35% from its 2007 peak to the 2013 trough — the correction after a credit and overbuilding bubble. Today the index is 33% above that peak, with one key difference: back then there was excess supply; now there is a shortage.'
            },
            {
                q: 'Would not more public housing help?',
                tag: 'housing',
                a: 'Public housing and mandatory social-housing quotas divert land and resources away from free-market housing, and they have not prevented the index from hitting all-time highs. The faster and cheaper alternative is less regulation, not more spending: free up land, remove fees and prior licences, and cut the taxes on every purchase.'
            },
            {
                q: 'What is ECB money printing?',
                tag: 'money',
                a: 'The ECB does not print physical banknotes (the Eurosystem national central banks do that) — it creates digital money: when it buys bonds (quantitative easing) or lends to banks it creates new reserves. Its balance sheet grew from ~€2 trillion to ~€8.8 trillion between 2015 and 2022. Most new money is created by commercial banks when they extend credit.'
            },
            {
                q: 'What is M3?',
                tag: 'money',
                a: 'M3 is the broadest monetary aggregate of the eurozone: M1 (cash and sight deposits) + M2 (short-term savings deposits) + money-market instruments. The ECB publishes it monthly. It currently stands at about €17.6 trillion, almost four times what existed when the euro was created in 1999.'
            },
            {
                q: 'Where does the euros-per-second figure come from?',
                tag: 'money',
                a: 'From the latest monthly M3 observations published by the ECB: the average change of the last three months is divided by the seconds in an average month. It is a linear approximation; the counter can run backwards in contracting months, as it did in 2023.'
            },
            {
                q: 'What does money have to do with inflation?',
                tag: 'money',
                a: 'When more money enters the economy but goods and services do not grow at the same pace, each euro buys less. The long-run correlation between monetary expansion and prices is one of the most robust in macroeconomics, with a typical 12-18 month lag. Per the official HICP, eurozone prices are now ~85% higher than at the end of 1996.'
            },
            {
                q: 'Can the ECB reverse money printing?',
                tag: 'money',
                a: 'In theory, yes (quantitative tightening): the Eurosystem balance sheet has shrunk by several trillion euros since 2022. In practice, M3 rarely contracts in a sustained way: doing so tends to cause recessions. Money printing works like a ratchet: it grows fast in crises and almost never returns to pre-crisis levels.'
            },
            {
                q: 'What is the Cantillon Effect?',
                tag: 'money',
                a: 'New money does not reach everyone equally: it enters through the financial system and governments first, which can buy assets before prices rise. Those closest to the tap benefit; savers and wage earners see their purchasing power eroded afterwards.'
            }
        ]
    }
};
