// Admin mode: unlocked from a discreet footer button, shows 🗑️ buttons everywhere.
import { api } from './api.js';
import { state } from './state.js';
import { h, toast } from './dom.js';
import { messageFor } from './errors.js';

/** A 🗑️ button that asks for confirmation, calls api.adminDelete, then runs `after`. */
export function deleteButton(what, { table, id, voter }, after) {
  const btn = h('button', {
    type: 'button',
    class: 'del-btn',
    'aria-label': `Supprimer ${what}`,
    title: `Supprimer ${what}`,
    onclick: async () => {
      if (!confirm(`Supprimer ${what} ? C’est définitif.`)) return;
      btn.disabled = true;
      try {
        await api.adminDelete(table, id, voter);
        toast('🗑️ Supprimé', 'success');
        after?.();
      } catch (err) {
        toast(messageFor(err), 'error');
        btn.disabled = false;
      }
    },
  }, '🗑️');
  return btn;
}

function openAdminLogin() {
  const root = document.getElementById('modal-root');
  const input = h('input', {
    type: 'password', autocomplete: 'off', placeholder: 'Mot de passe admin', 'aria-label': 'Mot de passe admin',
  });
  const error = h('p', { class: 'form-error', role: 'alert' });
  const submit = h('button', { type: 'submit', class: 'btn btn-primary' }, 'Déverrouiller');
  const close = () => { document.body.classList.remove('no-scroll'); backdrop.remove(); };
  const form = h('form', {
    class: 'add-name',
    onsubmit: async (e) => {
      e.preventDefault();
      const pw = input.value;
      if (!pw) return;
      submit.disabled = true;
      error.textContent = '';
      try {
        if (await api.adminCheck(pw)) {
          state.adminPassword = pw;
          close();
          toast('🔧 Mode admin activé', 'success');
        } else {
          error.textContent = 'Non, ce n’est pas ça 🙃';
          input.select();
        }
      } catch (err) {
        error.textContent = messageFor(err);
      } finally {
        submit.disabled = false;
      }
    },
  }, input, submit);
  const backdrop = h('div', {
    class: 'modal-backdrop',
    onclick: (e) => { if (e.target === backdrop) close(); },
  }, h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Mode admin' },
    h('div', { class: 'modal-head' },
      h('h2', {}, '🔧 Mode admin'),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Fermer', onclick: close }, '✕'),
    ),
    h('p', { class: 'muted' }, 'Réservé à l’organisateur : affiche les boutons de suppression.'),
    form,
    error,
  ));
  document.body.classList.add('no-scroll');
  root.append(backdrop);
  setTimeout(() => input.focus(), 50);
}

/** Renders the footer admin control into `el` (call again when admin state changes). */
export function renderAdminControl(el) {
  document.body.classList.toggle('is-admin', state.isAdmin);
  el.replaceChildren(state.isAdmin
    ? h('button', {
      type: 'button', class: 'admin-link admin-on',
      onclick: () => { state.adminPassword = null; toast('Mode admin désactivé'); },
    }, '🔧 Admin actif · quitter')
    : h('button', { type: 'button', class: 'admin-link', 'aria-label': 'Mode admin', onclick: openAdminLogin }, '🔧'));
}
