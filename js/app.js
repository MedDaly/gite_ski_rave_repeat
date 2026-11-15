// Entry point: password gate → identity picker → router.
import { api, MOCK, onAuthError } from './api.js';
import { state, onIdentityChange } from './state.js';
import { GUEST, TRIP } from './config.js';
import { h, toast } from './dom.js';
import { messageFor } from './errors.js';
import { startRouter, render as rerenderRoute } from './router.js';

const gate = document.getElementById('gate');
const shell = document.getElementById('shell');
const main = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');

/* ---------- Theme ---------- */
function applyTheme() {
  const t = state.theme;
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}
function effectiveTheme() {
  return state.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
document.getElementById('theme-toggle').addEventListener('click', () => {
  state.theme = effectiveTheme() === 'dark' ? 'light' : 'dark';
  applyTheme();
});

/* ---------- Password gate ---------- */
function showGate(errorMsg) {
  shell.hidden = true;
  gate.hidden = false;
  const input = h('input', {
    type: 'password', id: 'pw', name: 'password', autocomplete: 'current-password',
    required: true, placeholder: 'Le mot de passe du groupe', 'aria-label': 'Mot de passe',
  });
  const error = h('p', { class: 'form-error', role: 'alert' }, errorMsg || '');
  const submit = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Entrer dans le chalet 🚪');
  const form = h('form', {
    class: 'gate-card',
    onsubmit: async (e) => {
      e.preventDefault();
      const pw = input.value.trim();
      if (!pw) return;
      submit.disabled = true;
      submit.textContent = 'Vérification…';
      error.textContent = '';
      try {
        if (await api.checkPassword(pw)) {
          state.password = pw;
          enterApp();
        } else {
          error.textContent = 'Raté ! Ce n’est pas le bon mot de passe. Demande au groupe 😉';
          input.select();
        }
      } catch (err) {
        error.textContent = messageFor(err);
      } finally {
        submit.disabled = false;
        submit.textContent = 'Entrer dans le chalet 🚪';
      }
    },
  },
  h('div', { class: 'gate-emoji', 'aria-hidden': 'true' }, '🏔️🎉'),
  h('h1', {}, 'Gîte Happens'),
  h('p', { class: 'gate-sub' }, 'Savoie · 26 déc. → 3 janv.'),
  h('p', {}, 'Zone réservée aux copains. Le mot de passe, s’il te plaît :'),
  input,
  error,
  submit,
  MOCK && h('p', { class: 'hint' }, '🧪 Mode démo : le mot de passe est « raclette ».'),
  );
  gate.replaceChildren(form);
  input.focus();
}

/* ---------- Identity ---------- */
function updateIdentityChip() {
  document.getElementById('identity-name').textContent = state.identity || 'Qui es-tu ?';
}

let identityModalOpen = false;

/**
 * Opens the "who are you?" picker.
 * @param {{required?: boolean}} opts required = no close button (first visit)
 */
export function openIdentityPicker({ required = false } = {}) {
  if (identityModalOpen) return;
  identityModalOpen = true;

  const list = h('div', { class: 'name-list' }, h('p', { class: 'muted' }, 'Chargement des prénoms…'));
  const nameInput = h('input', {
    type: 'text', maxlength: 40, autocomplete: 'given-name', placeholder: 'Ton prénom',
    'aria-label': 'Ton prénom', enterkeyhint: 'done',
  });
  const error = h('p', { class: 'form-error', role: 'alert' });
  const addBtn = h('button', { type: 'submit', class: 'btn btn-primary' }, 'C’est moi !');

  function choose(name) {
    state.identity = name;
    close();
    toast(name === GUEST ? 'Tu explores en Invité 👀' : `Salut ${name} ! 👋`, 'success');
  }

  const addForm = h('form', {
    class: 'add-name',
    onsubmit: async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) return;
      if (name.toLowerCase() === GUEST.toLowerCase()) {
        error.textContent = 'Bien tenté 😏 « Invité » est réservé. Choisis ton vrai prénom.';
        return;
      }
      addBtn.disabled = true;
      error.textContent = '';
      try {
        const p = await api.addParticipant(name);
        choose(p.name);
      } catch (err) {
        error.textContent = messageFor(err);
      } finally {
        addBtn.disabled = false;
      }
    },
  }, nameInput, addBtn);

  const dialog = h('div', {
    class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'identity-title',
  },
  h('div', { class: 'modal-head' },
    h('h2', { id: 'identity-title' }, 'Qui es-tu ? 🎿'),
    !required && h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Fermer', onclick: () => close() }, '✕'),
  ),
  h('p', { class: 'muted' }, 'Choisis ton prénom dans la liste, ajoute-le, ou viens juste jeter un œil.'),
  list,
  h('h3', {}, 'Pas dans la liste ?'),
  addForm,
  error,
  h('div', { class: 'divider' }, h('span', {}, 'ou')),
  h('button', {
    type: 'button', class: 'btn btn-ghost btn-block', onclick: () => choose(GUEST),
  }, '👀 Continuer en Invité'),
  h('p', { class: 'hint' }, 'En Invité, tu peux tout voir, voter et proposer des gîtes, mais pas remplir le formulaire.'),
  );

  const backdrop = h('div', {
    class: 'modal-backdrop',
    onclick: (e) => { if (!required && e.target === backdrop) close(); },
  }, dialog);

  function onKey(e) { if (e.key === 'Escape' && !required) close(); }
  function close() {
    identityModalOpen = false;
    document.removeEventListener('keydown', onKey);
    document.body.classList.remove('no-scroll');
    backdrop.remove();
  }
  document.addEventListener('keydown', onKey);
  document.body.classList.add('no-scroll');
  modalRoot.append(backdrop);

  api.getAll().then((data) => {
    const names = data.participants.map((p) => p.name).sort((a, b) => a.localeCompare(b, 'fr'));
    list.replaceChildren(
      names.length
        ? h('div', { class: 'chips' }, names.map((n) => h('button', {
          type: 'button',
          class: 'chip chip-name',
          'aria-pressed': String(n === state.identity),
          onclick: () => choose(n),
        }, n)))
        : h('p', { class: 'muted' }, 'Personne pour l’instant. Sois le ou la premier·e !'),
    );
  }).catch((err) => {
    list.replaceChildren(h('p', { class: 'form-error' }, messageFor(err)));
  });

  if (!required) setTimeout(() => dialog.querySelector('button, input')?.focus(), 50);
}

document.getElementById('identity-chip').addEventListener('click', () => openIdentityPicker());

onIdentityChange(() => {
  updateIdentityChip();
  if (!shell.hidden) rerenderRoute({ keepScroll: true });
});

/* ---------- Boot ---------- */
function enterApp() {
  gate.hidden = true;
  gate.replaceChildren();
  shell.hidden = false;
  updateIdentityChip();
  document.getElementById('footer-extra').textContent = MOCK ? '🧪 mode démo (données fictives)' : `${TRIP.name} 2026`;
  startRouter(main, { openIdentityPicker });
  if (!state.identity) openIdentityPicker({ required: true });
}

onAuthError(() => {
  state.password = null;
  document.querySelectorAll('.modal-backdrop').forEach((m) => m.remove());
  showGate('Le mot de passe a changé. Redemande-le au groupe 🔑');
});

async function boot() {
  applyTheme();
  if (!state.password) return showGate();
  try {
    if (!(await api.checkPassword(state.password))) {
      state.password = null;
      return showGate();
    }
  } catch {
    // Offline or backend hiccup: let the user in, pages will show their own errors.
  }
  enterApp();
}

boot();
