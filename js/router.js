// Minimal hash router: #/accueil, #/formulaire, #/recap, #/wishlist
import * as accueil from './pages/accueil.js';
import * as formulaire from './pages/formulaire.js';
import * as recap from './pages/recap.js';
import * as wishlist from './pages/wishlist.js';

const routes = { accueil, formulaire, recap, wishlist };
const TITLES = { accueil: 'Accueil', formulaire: 'Formulaire', recap: 'Récap', wishlist: 'Gîtes' };
export const DEFAULT_ROUTE = 'accueil';

let main;
let ctxExtras = {};
let cleanups = [];
let started = false;

export function currentRoute() {
  const m = location.hash.match(/^#\/([\w-]+)/);
  return m && routes[m[1]] ? m[1] : null;
}

export function startRouter(mainEl, extras) {
  main = mainEl;
  ctxExtras = extras;
  if (!started) {
    window.addEventListener('hashchange', () => render());
    started = true;
  }
  render();
}

export function render({ keepScroll = false } = {}) {
  const name = currentRoute();
  if (!name) {
    location.replace(`#/${DEFAULT_ROUTE}`);
    return;
  }
  cleanups.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
  cleanups = [];

  document.querySelectorAll('.tabbar a').forEach((a) => {
    if (a.dataset.route === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.title = `${TITLES[name]} · Gîte Happens 🎉`;

  const view = document.createElement('section');
  view.className = `page page-${name}`;
  main.replaceChildren(view);
  if (!keepScroll) window.scrollTo(0, 0);

  const ctx = {
    ...ctxExtras,
    onCleanup: (fn) => cleanups.push(fn),
    rerender: () => render({ keepScroll: true }),
    // true while this view is still on screen (async work can bail out otherwise)
    isActive: () => view.isConnected,
  };
  routes[name].render(view, ctx);
}
