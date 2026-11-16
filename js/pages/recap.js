// P3. Récap: everyone's answers.
import { api } from '../api.js';
import { DAYS, STATUS, PREFS } from '../config.js';
import { h, loading, errorBox, timeAgo } from '../dom.js';
import { messageFor } from '../errors.js';
import { people, effectiveDays } from '../data.js';
import { state } from '../state.js';
import { deleteButton } from '../admin.js';

const STATUS_BY = Object.fromEntries(STATUS.map((s) => [s.value, s]));

function headcount(list) {
  const groups = [
    ...STATUS.map((s) => ({ ...s, names: list.filter((p) => p.response?.status === s.value).map((p) => p.name) })),
    { value: 'none', label: 'Pas encore répondu', emoji: '🤷', names: list.filter((p) => !p.response?.status).map((p) => p.name) },
  ];
  return h('section', { class: 'card' },
    h('h2', {}, 'Qui vient ?'),
    h('div', { class: 'headcount' },
      groups.map((g) => h('div', { class: `hc hc-${g.value}` },
        h('div', { class: 'hc-top' },
          h('span', { class: 'hc-num' }, g.names.length),
          h('span', { class: 'hc-label' }, g.emoji, ' ', g.label),
        ),
        h('p', { class: 'hc-names' }, g.names.length ? g.names.join(', ') : '—'),
      )),
    ),
  );
}

function dayGrid(list) {
  const rows = list.filter((p) => p.response && p.response.status !== 'out' && (p.response.status || effectiveDays(p.response).length));
  if (!rows.length) {
    return h('section', { class: 'card' }, h('h2', {}, 'Qui est là quel jour ?'), h('p', { class: 'muted' }, 'Personne n’a encore coché de dates.'));
  }
  const totals = DAYS.map((d) => ({
    in: rows.filter((p) => p.response.status === 'in' && effectiveDays(p.response).includes(d.iso)).length,
    maybe: rows.filter((p) => p.response.status !== 'in' && effectiveDays(p.response).includes(d.iso)).length,
  }));
  const max = Math.max(1, ...totals.map((t) => t.in));
  const nyeClass = (d) => (d.nye ? ' nye' : '');

  const table = h('table', { class: 'grid' },
    h('thead', {}, h('tr', {},
      h('th', { scope: 'col', class: 'sticky-col' }, 'Qui'),
      DAYS.map((d) => h('th', { scope: 'col', class: `day-col${nyeClass(d)}` },
        h('span', { class: 'day-dow' }, d.dow), h('span', { class: 'day-date' }, d.label), d.nye && h('span', { class: 'nye-badge', 'aria-label': 'Réveillon' }, '🎆'))),
    )),
    h('tbody', {}, rows.map((p) => {
      const days = effectiveDays(p.response);
      const maybe = p.response.status !== 'in';
      return h('tr', {},
        h('th', { scope: 'row', class: 'sticky-col' }, p.name, maybe && h('span', { class: 'muted small' }, ' (?)')),
        DAYS.map((d) => {
          const here = days.includes(d.iso);
          return h('td', { class: `${nyeClass(d)}${here ? (maybe ? ' here-maybe' : ' here') : ''}` },
            here ? h('span', { 'aria-label': maybe ? 'peut-être' : 'présent·e' }, maybe ? '?' : '✓') : h('span', { class: 'sr-only' }, 'absent·e'));
        }),
      );
    })),
    h('tfoot', {},
      h('tr', { class: 'total-in' },
        h('th', { scope: 'row', class: 'sticky-col' }, 'Partant·es'),
        totals.map((t, i) => h('td', { class: `${nyeClass(DAYS[i])}${t.in === max && t.in > 0 ? ' peak' : ''}` }, t.in))),
      h('tr', { class: 'total-maybe' },
        h('th', { scope: 'row', class: 'sticky-col' }, '+ peut-être'),
        totals.map((t, i) => h('td', { class: nyeClass(DAYS[i]) }, t.maybe ? `+${t.maybe}` : '·'))),
    ),
  );

  return h('section', { class: 'card' },
    h('h2', {}, 'Qui est là quel jour ?'),
    h('p', { class: 'muted small' }, '✓ partant·e · ? peut-être · glisse le tableau sur le côté 👉'),
    h('div', { class: 'grid-scroll', tabindex: '0', role: 'region', 'aria-label': 'Tableau des présences par jour' }, table),
  );
}

function prefBreakdown(list) {
  const answered = list.filter((p) => p.response && p.response.status !== 'out');
  return h('section', { class: 'card' },
    h('h2', {}, 'Les préférences du groupe'),
    h('p', { class: 'muted small' }, `Sur ${answered.length} réponse${answered.length > 1 ? 's' : ''} (hors « pas dispo »).`),
    h('div', { class: 'prefs' }, PREFS.map((q) => {
      const concrete = q.options.filter((o) => o.value !== 'peu_importe');
      const counts = Object.fromEntries(q.options.map((o) => [o.value, answered.filter((p) => p.response[q.key] === o.value)]));
      const noAnswer = answered.filter((p) => !p.response[q.key]).length;
      const max = Math.max(1, ...concrete.map((o) => counts[o.value].length));
      return h('div', { class: 'pref' },
        h('h3', {}, q.emoji, ' ', q.title),
        concrete.map((o) => {
          const n = counts[o.value].length;
          return h('div', { class: 'bar-row', title: counts[o.value].map((p) => p.name).join(', ') },
            h('span', { class: 'bar-label' }, o.label),
            h('span', { class: 'bar-track' }, h('span', { class: 'bar-fill', style: { width: `${(n / max) * 100}%` } })),
            h('span', { class: 'bar-num' }, n),
          );
        }),
        h('p', { class: 'pref-foot' },
          h('span', {}, '🤙 Peu importe : ', h('strong', {}, counts.peu_importe.length)),
          noAnswer ? h('span', { class: 'muted' }, ` · sans réponse : ${noAnswer}`) : null,
        ),
      );
    })),
  );
}

function optionLabel(q, value) {
  return q.options.find((o) => o.value === value)?.label;
}

function daysSummary(r) {
  if (r.all_days) return 'Toute la semaine ✨';
  const days = effectiveDays(r);
  if (!days.length) return 'Pas de dates cochées';
  return DAYS.filter((d) => days.includes(d.iso)).map((d) => `${d.dow} ${d.label}${d.nye ? ' 🎆' : ''}`).join(', ');
}

function answerCards(list, reload) {
  const answered = list.filter((p) => p.response);
  const waiting = list.filter((p) => !p.response);
  const order = { in: 0, maybe: 1, out: 2 };
  answered.sort((a, b) => (order[a.response.status] ?? 3) - (order[b.response.status] ?? 3) || a.name.localeCompare(b.name, 'fr'));

  return h('section', {},
    h('h2', { class: 'section-title' }, 'Les réponses'),
    answered.length ? h('div', { class: 'answers' }, answered.map((p) => {
      const r = p.response;
      const s = STATUS_BY[r.status];
      return h('article', { class: 'card answer' },
        h('header', { class: 'answer-head' },
          h('h3', {}, p.name),
          h('span', { class: `badge badge-${r.status || 'none'}` }, s ? `${s.emoji} ${s.label}` : '🤷 Sans statut'),
        ),
        r.status !== 'out' && h('p', { class: 'answer-days' }, '🗓️ ', daysSummary(r)),
        r.dates_note && h('p', { class: 'answer-note' }, '📝 ', r.dates_note),
        h('div', { class: 'answer-prefs' }, PREFS.map((q) => r[q.key] && h('span', { class: 'pill' }, `${q.emoji} ${optionLabel(q, r[q.key])}`))),
        r.note && h('p', { class: 'answer-quote' }, '💬 « ', r.note, ' »'),
        h('p', { class: 'muted small' }, `Mis à jour ${timeAgo(r.updated_at)}`),
        state.isAdmin && h('div', { class: 'del-row' },
          deleteButton(`les réponses de ${p.name}`, { table: 'response', id: p.id }, reload),
          deleteButton(`${p.name} (la personne et ses réponses)`, { table: 'participant', id: p.id }, reload),
        ),
      );
    })) : h('p', { class: 'muted' }, 'Aucune réponse pour l’instant. Va remplir le formulaire !'),
    waiting.length ? h('p', { class: 'muted small waiting' }, '⏳ Pas encore répondu : ',
      state.isAdmin
        ? waiting.map((p) => h('span', { class: 'person-del' }, p.name,
          deleteButton(p.name, { table: 'participant', id: p.id }, reload), ' '))
        : waiting.map((p) => p.name).join(', ')) : null,
  );
}

function draw(root, data, ctx) {
  const list = people(data);
  root.replaceChildren(
    h('header', { class: 'page-head' },
      h('h1', {}, '📊 Le récap'),
      h('p', { class: 'muted' }, 'Qui vient, quand, et ce que le groupe préfère.'),
    ),
    headcount(list),
    dayGrid(list),
    prefBreakdown(list),
    answerCards(list, () => ctx.rerender()),
    h('div', { class: 'cta-row' }, h('a', { href: '#/formulaire', class: 'btn btn-primary' }, '📝 Remplir / modifier ma réponse')),
  );
}

export function render(root, ctx) {
  root.append(loading());
  const load = () => api.getAll().then((data) => {
    if (ctx.isActive()) draw(root, data, ctx);
  }).catch((err) => {
    if (ctx.isActive()) root.replaceChildren(errorBox(messageFor(err), () => { root.replaceChildren(loading()); load(); }));
  });
  load();
}
