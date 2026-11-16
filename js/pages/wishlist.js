// P4. Wishlist: the gîtes.
import { api } from '../api.js';
import { state } from '../state.js';
import { AREAS, LIMITS, GUEST, GITES_DE_FRANCE_URL } from '../config.js';
import { h, toast, loading, errorBox, timeAgo, plural } from '../dom.js';
import { messageFor } from '../errors.js';
import { gitesWithVotes } from '../data.js';
import { deleteButton } from '../admin.js';

const AREA_LABEL = Object.fromEntries(AREAS.map((a) => [a.value, a.label]));
const me = () => state.identity || GUEST;

function safeHttpUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch { return null; }
}

function field(label, input, hint) {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), input, hint && h('span', { class: 'field-hint' }, hint));
}

function addGiteForm(onAdded) {
  const inputs = {
    url: h('input', { type: 'url', name: 'url', required: true, maxlength: LIMITS.url, placeholder: 'https://www.gites-de-france.com/…', inputmode: 'url' }),
    name: h('input', { type: 'text', name: 'name', required: true, maxlength: LIMITS.giteName, placeholder: 'Ex. : Chalet des Bauges' }),
    photo_url: h('input', { type: 'url', name: 'photo_url', maxlength: LIMITS.url, placeholder: 'https://…/photo.jpg', inputmode: 'url' }),
    price: h('input', { type: 'text', name: 'price', maxlength: LIMITS.price, placeholder: 'Ex. : 2 500 € la semaine' }),
    capacity: h('input', { type: 'number', name: 'capacity', min: 1, max: LIMITS.capacityMax, inputmode: 'numeric', placeholder: 'Ex. : 12' }),
    area: h('input', { type: 'text', name: 'area', maxlength: LIMITS.area, placeholder: 'Ex. : Annecy, Les Bauges, Vercors…' }),
    description: h('textarea', { name: 'description', rows: 3, maxlength: LIMITS.description, placeholder: 'Ce qui le rend génial (ou louche)…' }),
  };
  const error = h('p', { class: 'form-error', role: 'alert' });
  const submit = h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Ajouter à la wishlist ➕');

  const form = h('form', {
    class: 'add-gite',
    onsubmit: async (e) => {
      e.preventDefault();
      error.textContent = '';
      const values = Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.value.trim()]));
      if (!safeHttpUrl(values.url)) { error.textContent = 'Le lien doit commencer par https://'; inputs.url.focus(); return; }
      if (values.photo_url && !safeHttpUrl(values.photo_url)) { error.textContent = 'Le lien de la photo doit commencer par https://'; inputs.photo_url.focus(); return; }
      submit.disabled = true;
      submit.textContent = 'Ajout…';
      try {
        const g = await api.addGite(values, me());
        form.reset();
        details.open = false;
        toast(`🏡 « ${g.name} » ajouté !`, 'success');
        onAdded(g);
      } catch (err) {
        error.textContent = messageFor(err);
      } finally {
        submit.disabled = false;
        submit.textContent = 'Ajouter à la wishlist ➕';
      }
    },
  },
  field('Lien de l’annonce *', inputs.url),
  field('Nom *', inputs.name),
  field('Photo (lien d’image)', inputs.photo_url, 'Sur l’annonce : appui long sur la photo → « Copier l’adresse de l’image ».'),
  h('div', { class: 'field-row' }, field('Prix', inputs.price), field('Capacité', inputs.capacity)),
  field('Coin / lieu', inputs.area),
  field('Description', inputs.description),
  error,
  submit,
  h('p', { class: 'hint' }, `Ajouté au nom de ${me()}.`),
  );

  const details = h('details', { class: 'card add-gite-wrap' },
    h('summary', { class: 'btn btn-primary btn-block' }, '+ Ajouter un gîte'),
    form,
  );
  return details;
}

function giteCard(g, handlers, openComments) {
  const voted = g.voters.includes(me());
  const link = safeHttpUrl(g.url);
  const photo = g.photo_url && safeHttpUrl(g.photo_url);

  const media = h('div', { class: 'gite-media' },
    h('span', { class: 'gite-placeholder', 'aria-hidden': 'true' }, '🏡'),
    photo && h('img', {
      src: photo, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer',
      onerror: (e) => e.target.remove(),
    }),
  );

  const commentInput = h('textarea', { rows: 2, maxlength: LIMITS.comment, placeholder: 'Ton commentaire…', 'aria-label': 'Ton commentaire', required: true });
  const commentBtn = h('button', { type: 'submit', class: 'btn btn-secondary btn-sm' }, 'Envoyer');
  const commentForm = h('form', {
    class: 'comment-form',
    onsubmit: async (e) => {
      e.preventDefault();
      const body = commentInput.value.trim();
      if (!body) return;
      commentBtn.disabled = true;
      try {
        await handlers.comment(g.id, body);
        commentInput.value = '';
      } catch { /* toast already shown, keep the text */ } finally {
        commentBtn.disabled = false;
      }
    },
  }, commentInput, h('div', { class: 'comment-form-foot' }, h('span', { class: 'muted small' }, `En tant que ${me()}`), commentBtn));

  const comments = h('details', {
    class: 'comments',
    open: openComments.has(g.id),
    ontoggle: (e) => { if (e.target.open) openComments.add(g.id); else openComments.delete(g.id); },
  },
  h('summary', {}, `💬 ${plural(g.comments.length, 'commentaire', 'commentaires')}`),
  h('ul', { class: 'comment-list' }, g.comments.map((c) => h('li', { class: 'comment' },
    h('div', { class: 'comment-main' },
      h('p', { class: 'comment-meta' }, h('strong', {}, c.author), h('span', { class: 'muted' }, ` · ${timeAgo(c.created_at)}`)),
      h('p', { class: 'comment-body' }, c.body),
    ),
    state.isAdmin && deleteButton(`le commentaire de ${c.author}`, { table: 'comment', id: c.id }, handlers.reload),
  ))),
  commentForm,
  );

  return h('article', { class: 'card gite', dataset: { id: g.id } },
    media,
    h('div', { class: 'gite-body' },
      h('h3', { class: 'gite-name' }, g.name),
      h('div', { class: 'gite-facts' },
        g.area && h('span', { class: 'pill' }, '📍 ', AREA_LABEL[g.area] || g.area),
        g.capacity && h('span', { class: 'pill' }, `👥 ${g.capacity} pers.`),
        g.price && h('span', { class: 'pill' }, '💶 ', g.price),
      ),
      g.description && h('p', { class: 'gite-desc' }, g.description),
      h('p', { class: 'muted small' }, `Ajouté par ${g.added_by} · ${timeAgo(g.created_at)}`),
      h('div', { class: 'gite-actions' },
        h('button', {
          type: 'button',
          class: `vote-btn${voted ? ' voted' : ''}`,
          'aria-pressed': String(voted),
          'aria-label': voted ? `Retirer mon vote (${g.voters.length})` : `Voter pour ce gîte (${g.voters.length})`,
          onclick: () => handlers.vote(g.id),
        }, h('span', { 'aria-hidden': 'true' }, '👍'), h('span', { class: 'vote-count' }, g.voters.length)),
        link && h('a', { href: link, target: '_blank', rel: 'noopener noreferrer', class: 'btn btn-secondary' }, 'Voir l’annonce ↗'),
        state.isAdmin && deleteButton(`le gîte « ${g.name} » (avec ses votes et commentaires)`, { table: 'gite', id: g.id }, handlers.reload),
      ),
      g.voters.length ? h('p', { class: 'voters small' }, '👍 ', g.voters.join(', ')) : h('p', { class: 'voters small muted' }, 'Pas encore de vote. Sois le premier ou la première !'),
      comments,
    ),
  );
}

function draw(root, ctx, initial) {
  const data = initial;
  const openComments = new Set();
  const list = h('div', { class: 'gite-list' });

  function drawList() {
    const gites = gitesWithVotes(data);
    list.replaceChildren(...(gites.length
      ? gites.map((g, i) => {
        const card = giteCard(g, handlers, openComments);
        if (i === 0 && g.voters.length) card.classList.add('leader');
        return card;
      })
      : [h('p', { class: 'muted empty' }, 'La wishlist est vide. Ajoute le premier gîte ! 🏡')]));
  }

  const handlers = {
    reload: () => ctx.rerender(),
    async vote(giteId) {
      const voter = me();
      const idx = data.votes.findIndex((v) => v.gite_id === giteId && v.voter === voter);
      const removed = idx >= 0 ? data.votes.splice(idx, 1)[0] : null;
      if (!removed) data.votes.push({ gite_id: giteId, voter, created_at: new Date().toISOString() });
      drawList(); // optimistic
      try {
        const { voted } = await api.toggleVote(giteId, voter);
        // Re-sync in case the server disagrees (e.g. someone else voted as Invité meanwhile).
        const has = data.votes.some((v) => v.gite_id === giteId && v.voter === voter);
        if (voted !== has) {
          if (voted) data.votes.push({ gite_id: giteId, voter, created_at: new Date().toISOString() });
          else data.votes = data.votes.filter((v) => !(v.gite_id === giteId && v.voter === voter));
          if (ctx.isActive()) drawList();
        }
      } catch (err) {
        if (removed) data.votes.push(removed);
        else data.votes = data.votes.filter((v) => !(v.gite_id === giteId && v.voter === voter));
        if (ctx.isActive()) drawList();
        toast(messageFor(err), 'error');
      }
    },
    async comment(giteId, body) {
      try {
        const c = await api.addComment(giteId, me(), body);
        data.comments.push(c);
        openComments.add(giteId);
        if (ctx.isActive()) drawList();
      } catch (err) {
        toast(messageFor(err), 'error');
        throw err;
      }
    },
  };

  drawList();
  root.replaceChildren(
    h('header', { class: 'page-head' },
      h('h1', {}, '🏡 La wishlist des gîtes'),
      h('p', { class: 'muted' }, 'Propose, vote 👍, commente. Le plus voté est en haut.'),
    ),
    addGiteForm((g) => { data.gites.push(g); drawList(); }),
    h('p', { class: 'helper-link' }, '🔎 En panne d’idées ? ',
      h('a', { href: GITES_DE_FRANCE_URL, target: '_blank', rel: 'noopener noreferrer' }, 'Cherche sur Gîtes de France ↗'),
      ' : Savoie, Haute-Savoie, Isère… on regarde large !'),
    list,
  );
}

export function render(root, ctx) {
  root.append(loading());
  const load = () => api.getAll().then((data) => {
    if (ctx.isActive()) draw(root, ctx, data);
  }).catch((err) => {
    if (ctx.isActive()) root.replaceChildren(errorBox(messageFor(err), () => { root.replaceChildren(loading()); load(); }));
  });
  load();
}
