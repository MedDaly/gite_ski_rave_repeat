// P2. Formulaire: my interest & preferences.
import { api } from '../api.js';
import { state } from '../state.js';
import { DAYS, STATUS, PREFS, LIMITS } from '../config.js';
import { h, toast, loading, errorBox, choiceGroup, timeAgo } from '../dom.js';
import { messageFor } from '../errors.js';
import { responseFor } from '../data.js';

const EMPTY = {
  status: null, days: [], all_days: false, dates_note: '',
  ski: null, teletravail: null, lieu: null, voiture: null, note: '',
};

function question(num, title, hint, control) {
  return h('fieldset', { class: 'question' },
    h('legend', {}, h('span', { class: 'q-num' }, num), ' ', title),
    hint && h('p', { class: 'q-hint' }, hint),
    control,
  );
}

function daysPicker(values, locked) {
  const allBtn = h('button', {
    type: 'button', class: 'chip chip-all', 'aria-pressed': 'false', disabled: locked,
  }, '✨ Toute la semaine / tout me va');

  const dayBtns = DAYS.map((d) => h('button', {
    type: 'button',
    class: `chip chip-day${d.nye ? ' chip-nye' : ''}`,
    'aria-pressed': 'false',
    disabled: locked,
    dataset: { iso: d.iso },
  }, h('span', { class: 'day-dow' }, d.dow), h('span', { class: 'day-date' }, d.label), d.nye && h('span', { 'aria-hidden': 'true' }, ' 🎆')));

  function sync() {
    allBtn.setAttribute('aria-pressed', String(values.all_days));
    dayBtns.forEach((b) => {
      const on = values.all_days || values.days.includes(b.dataset.iso);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  allBtn.addEventListener('click', () => {
    values.all_days = !values.all_days;
    values.days = values.all_days ? DAYS.map((d) => d.iso) : [];
    sync();
  });
  dayBtns.forEach((b) => b.addEventListener('click', () => {
    const iso = b.dataset.iso;
    if (values.all_days) {
      // Leaving "all week": keep every day except the one tapped.
      values.all_days = false;
      values.days = DAYS.map((d) => d.iso).filter((x) => x !== iso);
    } else if (values.days.includes(iso)) {
      values.days = values.days.filter((x) => x !== iso);
    } else {
      values.days = [...values.days, iso];
      if (values.days.length === DAYS.length) values.all_days = true;
    }
    sync();
  }));

  sync();
  return h('div', {},
    h('div', { class: 'chips' }, allBtn),
    h('div', { class: 'day-grid' }, dayBtns),
  );
}

function textArea(id, value, placeholder, locked, onInput) {
  return h('textarea', {
    id, rows: 2, maxlength: LIMITS.note, placeholder, disabled: locked, value: value || '',
    oninput: (e) => onInput(e.target.value),
  });
}

function guestBanner(ctx) {
  return h('div', { class: 'banner banner-guest', role: 'note' },
    h('p', {}, h('strong', {}, '👀 Tu es en Invité. '), 'Choisis ton prénom pour répondre !'),
    h('button', { type: 'button', class: 'btn btn-primary', onclick: () => ctx.openIdentityPicker() }, 'Choisir mon prénom'),
  );
}

function drawForm(root, ctx, data) {
  const name = state.identity;
  const locked = !name || state.isGuest;
  const existing = locked ? null : responseFor(data, name);
  const values = { ...EMPTY, ...(existing || {}) };
  values.days = [...(values.days || [])];
  if (values.all_days) values.days = DAYS.map((d) => d.iso);

  const set = (k) => (v) => { values[k] = v; };

  const saveBtn = h('button', { type: 'submit', class: 'btn btn-primary btn-lg btn-block', disabled: locked }, 'Enregistrer 💾');
  const result = h('div', { class: 'save-result', 'aria-live': 'polite' });

  const form = h('form', {
    class: `the-form${locked ? ' is-locked' : ''}`,
    onsubmit: async (e) => {
      e.preventDefault();
      if (locked) return;
      saveBtn.disabled = true;
      saveBtn.textContent = 'Enregistrement…';
      result.replaceChildren();
      try {
        const payload = {
          status: values.status,
          days: values.all_days ? [] : values.days,
          all_days: values.all_days,
          dates_note: values.dates_note,
          ski: values.ski, teletravail: values.teletravail, lieu: values.lieu, voiture: values.voiture,
          note: values.note,
        };
        await api.upsertResponse(name, payload);
        result.replaceChildren(h('div', { class: 'banner banner-ok', role: 'status' },
          h('p', {}, h('strong', {}, '✅ Enregistré !'), ' Tu peux revenir modifier quand tu veux.'),
          h('a', { href: '#/recap', class: 'btn btn-secondary' }, 'Voir le récap 📊'),
        ));
        toast('✅ Enregistré', 'success');
        result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {
        result.replaceChildren(h('p', { class: 'form-error', role: 'alert' }, messageFor(err)));
        toast(messageFor(err), 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Enregistrer 💾';
      }
    },
  },
  h('fieldset', { class: 'form-body', disabled: locked },
    question('1', 'Tu viens ?', null,
      choiceGroup({ name: 'status', label: 'Tu viens ?', options: STATUS, value: values.status, disabled: locked, onChange: set('status') })),
    question('2', 'Tes dispos', 'Coche les jours où tu seras là (même une demi-journée compte).',
      daysPicker(values, locked)),
    question('2b', 'Notes sur les dates', null,
      textArea('dates_note', values.dates_note, 'Ex. : j’arrive dimanche soir, je repars le 2 au matin…', locked, set('dates_note'))),
    PREFS.map((q, i) => question(String(i + 3), `${q.title} ${q.emoji}`, null,
      choiceGroup({ name: q.key, label: q.title, options: q.options, value: values[q.key], disabled: locked, onChange: set(q.key) }))),
    question('7', 'Un mot ?', 'Allergies, envies, menaces de karaoké…',
      textArea('note', values.note, 'Ce que tu veux 🙂', locked, set('note'))),
  ),
  saveBtn,
  result,
  );

  root.replaceChildren(
    h('header', { class: 'page-head' },
      h('h1', {}, '📝 Ton formulaire'),
      h('p', { class: 'muted' }, 'Tout est facultatif. Touche une réponse choisie pour la retirer.'),
    ),
    locked
      ? guestBanner(ctx)
      : h('div', { class: 'banner banner-me' },
        h('p', {}, 'Tu réponds en tant que ', h('strong', {}, name),
          existing ? ` · dernière modif ${timeAgo(existing.updated_at)}` : ' · première fois ici, bienvenue !'),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => ctx.openIdentityPicker() }, 'Ce n’est pas moi'),
      ),
    form,
  );
}

export function render(root, ctx) {
  root.append(loading());
  const load = () => api.getAll().then((data) => {
    if (ctx.isActive()) drawForm(root, ctx, data);
  }).catch((err) => {
    if (ctx.isActive()) root.replaceChildren(errorBox(messageFor(err), () => { root.replaceChildren(loading()); load(); }));
  });
  load();
}
