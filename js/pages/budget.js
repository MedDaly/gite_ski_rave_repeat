// P5. Budget: static research report comparing the cost per person of each gîte option
// (gîte + train from Paris + 3-day ski pass + car). Data gathered by the organizer on 22 Nov 2026.
// Static content: no API call. To update, edit the arrays below.
import { h } from '../dom.js';

const RESEARCH_DATE = '22 nov. 2026';

// Cost per person in euros. gi = gîte (4 nights), tr = average return train, ski = 3-day pass, car = car share.
const OPTIONS = [
  { name: 'Maisonnette d’Aix', station: 'Aix-les-Bains', domain: 'Aillons-Margériaz', gi: 189, tr: 165, ski: 84, car: 100, tag: '6 places' },
  { name: 'Grenoble (hypothétique)', station: 'Grenoble', domain: 'Lans-en-Vercors', gi: 201, tr: 159, ski: 81, car: 100, tag: 'pas d’annonce' },
  { name: 'Chalet la Chaîne d’Or', station: 'Annemasse', domain: 'Les Brasses', gi: 150, tr: 209, ski: 85, car: 100, tag: 'sur demande' },
  { name: 'Le Domoizik', station: 'Albertville', domain: 'Espace Diamant', gi: 147, tr: 154, ski: 146, car: 100, tag: 'sur demande', best: true },
  { name: 'Grand Chalet Annecy', station: 'Annecy', domain: 'La Clusaz', gi: 223, tr: 174, ski: 155, car: 100, tag: 'non réservable', warn: true },
  { name: 'Niveales', station: 'Aime-la-Plagne', domain: 'La Plagne', gi: 193, tr: 165, ski: 210, car: 100, tag: '6 places' },
  { name: 'Marmorine', station: 'Aime-la-Plagne', domain: 'La Plagne', gi: 302, tr: 165, ski: 210, car: 100 },
];

const PARTS = [
  { key: 'gi', label: 'Gîte (4 nuits)', short: 'Gîte' },
  { key: 'tr', label: 'Train aller-retour (moyenne)', short: 'Train' },
  { key: 'ski', label: 'Forfait ski 3 jours', short: 'Ski' },
  { key: 'car', label: 'Voiture', short: 'Voiture' },
];

// Return train from Paris, min / average / max, per station and date pair.
const TRAINS = [
  ['Aime-la-Plagne', '208 / 262 / 288', '68 / 165 / 246'],
  ['Albertville', '201 / 254 / 288', '68 / 154 / 225'],
  ['Aix-les-Bains', '197 / 246 / 285', '79 / 165 / 280'],
  ['Annecy', '222 / 267 / 300', '87 / 174 / 293'],
  ['Annemasse', '235 / 242 / 248', '157 / 209 / 236'],
  ['Grenoble', 'non recherché', '61 / 159 / 253'],
];

const BEST_TRAINS = [
  ['Aime-la-Plagne', 'OUIGO 10h42, direct, 39 €', 'OUIGO 17h49, direct, 29 €', '68 €'],
  ['Albertville', 'OUIGO 10h42, direct, 39 €', 'OUIGO 18h49, direct, 29 €', '68 €'],
  ['Aix-les-Bains', 'TGV 17h46, direct, 32 €', '18h27, 1 corresp., 46,80 €', '79 €'],
  ['Annecy', 'TGV 17h46, direct, 32 €', '17h43, 1 corresp., 54,60 €', '87 €'],
  ['Annemasse', '16h18, 1 corresp., 70 €', '14h50, 2 corresp., 86,80 €', '157 €'],
  ['Grenoble', 'TGV 16h14, direct, 32 €', 'OUIGO 19h59, direct, 29 €', '61 €'],
];

const DOMAINS = [
  ['Espace Diamant (Les Saisies)', 'Le Domoizik', '192 km', '950–2 050 m', '~146 €', 'Tous niveaux ; très bien pour débuter, neige fiable'],
  ['La Plagne', 'Marmorine, Niveales', 'domaine La Plagne', 'haute altitude', '~210 €', 'Grande station, bons skieurs'],
  ['Aillons-Margériaz', 'Maisonnette d’Aix', '~36 km', '1 000–1 900 m', '~84 €', 'Débutants et familles ; 2 sites séparés'],
  ['La Clusaz', 'Chalet d’Annecy', 'Aravis', '25 min en voiture', '~155 €', 'Tous niveaux ; voiture nécessaire'],
  ['Les Brasses', 'Chaîne d’Or', 'petit domaine', 'petite station', '~85 €', 'Familles, courts séjours'],
  ['Lans-en-Vercors', 'Grenoble', '23 pistes', '30–40 min de Grenoble', '~81 €', 'Petit et pas cher ; Autrans-Méaudre est plus grand'],
];

const CHECKS = [
  ['Capacité', 'la Maisonnette d’Aix et Niveales n’accueillent que 6 personnes. Pour 10, il faudrait un deuxième logement.'],
  ['Disponibilité', 'Le Domoizik et la Chaîne d’Or sont « sur demande », le propriétaire doit confirmer. Le chalet d’Annecy n’est pas réservable du 31 au 4 (nuit du 3 au 4 janv. prise). Son prix = tarif à la nuit × 4.'],
  ['Grenoble', 'option hypothétique, sans annonce. Le prix du gîte est la moyenne des autres.'],
  ['Forfaits', 'estimés à environ 3 × le prix journée adulte 2026-27, sauf Évasion Mont-Blanc (prix publié). L’Espace Diamant fait −10 % aux groupes de 4 personnes ou plus qui achètent ensemble.'],
  ['Sans voiture (Hauteluce)', 'la ligne 22 depuis Albertville n’a pas de bus le matin vers les pistes en semaine. Mieux vaut loger aux Saisies ou à Hauteluce, où les navettes gratuites passent toutes les 20 à 30 min.'],
  ['Non inclus', 'taxe de séjour (~1 à 2 € par nuit), location de skis, repas, bus locaux. Les prix des trains bougent vite et il ne reste souvent que 1 à 7 places au prix affiché.'],
];

const SOURCES = 'SNCF Connect (22 nov. 2026) ; annonces gites-de-france.com et airbnb.fr ; dossier de presse Les Saisies 2027 ; skiinfo.fr ; alti-mag.com ; forfait.megeve.com ; guide-ski.fr.';

const eur = (n) => `${n} €`;
const total = (o) => PARTS.reduce((s, p) => s + o[p.key], 0);

/**
 * Table that turns into labelled stacked rows on phones (see .rtable in styles.css).
 * cols: [{ label, num? }]; rows: arrays of cell contents; rowClass(i) optional.
 */
function rtable(cols, rows, { rowClass, caption } = {}) {
  return h('div', { class: 'rtable-wrap' },
    h('table', { class: 'rtable' },
      caption && h('caption', { class: 'sr-only' }, caption),
      h('thead', {}, h('tr', {}, cols.map((c) => h('th', { scope: 'col', class: c.num ? 'n' : null }, c.label)))),
      h('tbody', {}, rows.map((r, i) => h('tr', { class: rowClass?.(i) || null },
        r.map((cell, j) => h('td', { class: cols[j].num ? 'n' : null, 'data-l': cols[j].short || cols[j].label }, cell)),
      ))),
    ),
  );
}

function hero(sorted) {
  const cheapest = sorted[0];
  const best = sorted.find((o) => o.best);
  return h('header', { class: 'budget-hero' },
    h('p', { class: 'budget-kicker' }, '💶 Étude budget · scénario 31 déc. → 4 janv.'),
    h('h1', {}, `Hauteluce offre le plus de ski pour environ ${eur(total(best))} par personne`),
    h('p', { class: 'budget-sub' },
      'Séjour ski du Nouvel An, 31 déc. 2026 → 4 janv. 2027, groupe de 10. Coût par personne = gîte + aller-retour en train depuis Paris (prix moyen) + forfait ski adulte 3 jours + 100 € de voiture. ',
      `Prix relevés sur SNCF Connect, Gîtes de France et Airbnb le ${RESEARCH_DATE}.`),
    h('div', { class: 'kpis' },
      h('div', { class: 'kpi' }, h('b', {}, `~${eur(total(cheapest))}`), h('span', {}, `Le moins cher : ${cheapest.station} (${cheapest.tag || ''})`.replace(' ()', ''))),
      h('div', { class: 'kpi' }, h('b', {}, `~${eur(total(best))}`), h('span', {}, `Meilleur rapport : ${best.name}, 192 km de pistes`)),
      h('div', { class: 'kpi' }, h('b', {}, 'jusqu’à 3×'), h('span', {}, 'moins cher en train pour le 31→4 que pour le 27→3 (meilleurs prix)')),
      h('div', { class: 'kpi' }, h('b', {}, 'Complet'), h('span', {}, 'la plupart des trains retour vers Paris le dim. 3 janv.')),
    ),
  );
}

function bars(sorted) {
  const max = Math.max(...sorted.map(total));
  return h('section', { class: 'card' },
    h('h2', {}, 'Coût par personne, du moins cher au plus cher'),
    h('div', { class: 'budget-legend' },
      PARTS.map((p) => h('span', {}, h('i', { class: `seg-${p.key}`, 'aria-hidden': 'true' }), p.label))),
    h('div', { class: 'cost-bars' }, sorted.map((o) => h('div', {
      class: `cost-row${o.best ? ' best' : ''}`,
      role: 'img',
      'aria-label': `${o.name} : ${eur(total(o))} (${PARTS.map((p) => `${p.short} ${eur(o[p.key])}`).join(', ')})`,
    },
    h('div', { class: 'cost-name' }, o.name, o.best && ' ⭐', h('small', {}, o.domain)),
    h('div', { class: 'cost-track', 'aria-hidden': 'true' },
      PARTS.map((p) => h('span', {
        class: `seg-${p.key}`,
        style: { width: `${((o[p.key] / max) * 100).toFixed(2)}%` },
        title: `${p.short} ${eur(o[p.key])}`,
      }))),
    h('div', { class: 'cost-total', 'aria-hidden': 'true' }, eur(total(o))),
    ))),
  );
}

function budgetTable(sorted) {
  const cols = [
    { label: 'Gîte' }, { label: 'Gare' }, { label: 'Domaine skiable', short: 'Domaine' },
    ...PARTS.map((p) => ({ label: p.short, num: true })), { label: 'Total', num: true },
  ];
  const rows = sorted.map((o) => [
    [o.name, o.tag && h('span', { class: `tag${o.warn ? ' tag-warn' : ''}` }, o.tag)],
    o.station, o.domain,
    ...PARTS.map((p) => eur(o[p.key])),
    h('b', {}, eur(total(o))),
  ]);
  return h('section', { class: 'card' },
    h('h2', {}, 'Budget complet par personne'),
    rtable(cols, rows, { rowClass: (i) => (sorted[i].best ? 'best' : null), caption: 'Budget complet par personne' }),
  );
}

function trains() {
  return h('section', { class: 'card' },
    h('h2', {}, '🚄 Trains depuis Paris, aller-retour'),
    rtable([
      { label: 'Gare' },
      { label: '27→3 min / moy. / max', short: '27→3', num: true },
      { label: '31→4 min / moy. / max', short: '31→4', num: true },
    ], TRAINS.map((r) => r.map((x, i) => (i ? `${x}${x.includes('/') ? ' €' : ''}` : x)))),
    h('p', { class: 'budget-foot' }, '1 adulte, 2de classe, sans carte de réduction. Moyenne sur tous les trains qui avaient encore des places en 2de classe.'),
    h('h3', {}, 'Meilleurs trains, 31 déc. → 4 janv.'),
    rtable([
      { label: 'Gare' }, { label: 'Aller 31 déc.' }, { label: 'Retour 4 janv.' }, { label: 'Total', num: true },
    ], BEST_TRAINS),
  );
}

function domains() {
  return h('section', { class: 'card' },
    h('h2', {}, '⛷️ Domaines skiables comparés'),
    rtable([
      { label: 'Domaine' }, { label: 'Pour le gîte' }, { label: 'Pistes' }, { label: 'Altitude' },
      { label: 'Forfait 3 j', num: true }, { label: 'Idéal pour' },
    ], DOMAINS),
  );
}

function checks() {
  return h('section', { class: 'card' },
    h('h2', {}, '🔎 À vérifier avant de réserver'),
    h('ul', { class: 'budget-notes' }, CHECKS.map(([k, v]) => h('li', {}, h('b', {}, `${k} : `), v))),
    h('p', { class: 'budget-foot' }, `Sources : ${SOURCES}`),
  );
}

export function render(root) {
  const sorted = [...OPTIONS].sort((a, b) => total(a) - total(b));
  root.append(
    hero(sorted),
    bars(sorted),
    budgetTable(sorted),
    trains(),
    domains(),
    checks(),
    h('div', { class: 'cta-row' },
      h('a', { href: '#/wishlist', class: 'btn btn-primary' }, 'Voir la wishlist des gîtes 🏡'),
      h('a', { href: '#/formulaire', class: 'btn btn-secondary' }, 'Donner mon avis 📝'),
    ),
  );
}
