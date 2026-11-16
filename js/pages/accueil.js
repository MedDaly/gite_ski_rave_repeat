// P1. Accueil: the pitch.
import { api } from '../api.js';
import { TRIP } from '../config.js';
import { h, plural } from '../dom.js';
import { statusCounts } from '../data.js';

const PITCH = [
  ['🏔️', 'La montagne', 'Des stations à portée de raquette. Des pistes pour les pros, de la luge pour les autres, du vin chaud pour tout le monde.'],
  ['🌲', 'Le grand air', 'Lacs, forêts, villages perchés. Baignade déconseillée en janvier, balade digestive vivement recommandée.'],
  ['🧀', 'Le fromage', 'Raclette, tartiflette, fondue, croziflette. On a fait le calcul : trois repas sur deux seront au fromage.'],
  ['💻', 'Le télétravail', 'Ton boss voit ta caméra, pas tes chaussettes de ski. Wifi exigé, vue sur les sommets offerte.'],
  ['🎆', 'Le Réveillon', 'Le 31, tout le monde est là. Paillettes, playlist douteuse et bonnes résolutions tenues jusqu’au 2 janvier.'],
];

function countdownParts() {
  const now = Date.now();
  const start = new Date(TRIP.countdownTarget).getTime();
  const end = new Date(TRIP.endTarget).getTime();
  if (now >= end) return { done: 'C’était mythique. On remet ça ? 🔁' };
  if (now >= start) return { done: 'C’est parti, on est au chalet ! 🎉' };
  let s = Math.floor((start - now) / 1000);
  const d = Math.floor(s / 86400); s -= d * 86400;
  const hh = Math.floor(s / 3600); s -= hh * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  return { d, hh, m, s };
}

function countdown(ctx) {
  const box = h('div', { class: 'countdown', 'aria-label': 'Compte à rebours jusqu’au 26 décembre' });
  const unit = (n, label) => h('div', { class: 'cd-unit' }, h('span', { class: 'cd-num' }, String(n).padStart(2, '0')), h('span', { class: 'cd-label' }, label));
  function tick() {
    const p = countdownParts();
    if (p.done) box.replaceChildren(h('p', { class: 'cd-done' }, p.done));
    else box.replaceChildren(unit(p.d, 'jours'), unit(p.hh, 'h'), unit(p.m, 'min'), unit(p.s, 's'));
  }
  tick();
  const id = setInterval(tick, 1000);
  ctx.onCleanup(() => clearInterval(id));
  return box;
}

export function render(root, ctx) {
  const stats = h('p', { class: 'stats', 'aria-live': 'polite' }, h('span', { class: 'skeleton-text' }, 'On compte les troupes…'));

  root.append(
    h('div', { class: 'hero' },
      h('div', { class: 'hero-snow', 'aria-hidden': 'true' }),
      h('p', { class: 'hero-kicker' }, 'Semaine au ski · Réveillon · Télétravail'),
      h('h1', { class: 'hero-title' }, 'Gîte Happens', h('span', { class: 'hero-spark', 'aria-hidden': 'true' }, ' 🎉')),
      h('p', { class: 'hero-dates' }, 'Du samedi 26 décembre 2026 au dimanche 3 janvier 2027'),
      h('p', { class: 'hero-place' }, '📍 Quelque part dans les Alpes : le coin exact se décide ensemble !'),
      countdown(ctx),
      stats,
      h('div', { class: 'cta-row' },
        h('a', { href: '#/formulaire', class: 'btn btn-primary btn-lg' }, 'Je suis chaud·e 🔥 → Formulaire'),
        h('a', { href: '#/wishlist', class: 'btn btn-secondary btn-lg' }, 'Voir les gîtes 🏡 → Wishlist'),
      ),
    ),

    h('section', { class: 'card pitch-intro' },
      h('h2', {}, 'Le pitch'),
      h('p', {}, 'Tu as toujours rêvé de faire tes visios avec vue sur la montagne ? De descendre une rouge avec le style (et la grâce) de Jean-Claude Dusse ? De manger une raclette le midi ET le soir, sans aucun jugement ?'),
      h('p', {}, 'On loue un gîte à la montagne pour la semaine du Nouvel An. Il y aura de la neige (on croise les doigts), du fromage (ça, c’est sûr) et une soirée du 31 dont on parlera encore en 2030.'),
      h('blockquote', {}, '« Sur un malentendu, ça peut marcher. »', h('cite', {}, 'Un grand philosophe savoyard d’adoption')),
    ),

    h('section', { class: 'pitch-grid' },
      PITCH.map(([emoji, title, text]) => h('article', { class: 'card pitch-item' },
        h('div', { class: 'pitch-emoji', 'aria-hidden': 'true' }, emoji),
        h('div', {}, h('h3', {}, title), h('p', {}, text)),
      )),
    ),

    h('section', { class: 'card concept' },
      h('h2', {}, 'Le concept'),
      h('ul', { class: 'concept-list' },
        h('li', {}, '🗓️ Tu viens ', h('strong', {}, 'quand tu veux'), ', pour ', h('strong', {}, 'le temps que tu veux'), ' entre le 26/12 et le 03/01.'),
        h('li', {}, '⛷️ Tu skies… ou tu regardes les autres skier depuis le canapé.'),
        h('li', {}, '💻 Tu télétravailles… ou tu poses tes congés comme un·e pro.'),
        h('li', {}, '🥂 Une seule règle : ', h('strong', {}, 'le 31 au soir, tout le monde est là.')),
      ),
      h('p', { class: 'muted' }, 'Le gîte n’est pas encore choisi : propose, vote et commente dans la wishlist !'),
    ),

    h('div', { class: 'cta-row cta-bottom' },
      h('a', { href: '#/formulaire', class: 'btn btn-primary btn-lg' }, 'Je suis chaud·e 🔥 → Formulaire'),
      h('a', { href: '#/recap', class: 'btn btn-ghost btn-lg' }, 'Qui vient ? 📊 → Récap'),
    ),
  );

  api.getAll().then((data) => {
    if (!ctx.isActive()) return;
    const c = statusCounts(data);
    stats.replaceChildren(
      h('strong', {}, plural(c.in, 'partant·e', 'partant·es')), ' · ',
      h('strong', {}, `${c.maybe} peut-être`), ' · ',
      h('strong', {}, plural(data.gites.length, 'gîte', 'gîtes')), ' dans la wishlist',
    );
  }).catch(() => {
    if (ctx.isActive()) stats.replaceChildren('Les stats font la sieste 😴');
  });
}
