// In-memory mock backend with sample data, used with ?mock=1 (and until Supabase is set up).
// It mirrors the validation the real RPC functions will do server-side.
// Data is kept in localStorage so a reload keeps your test edits. Add ?mock=reset to start over.
import { ApiError } from './errors.js';
import { DAYS, GUEST, PREFS, LIMITS } from './config.js';

export const MOCK_PASSWORD = 'raclette';
export const MOCK_ADMIN_PASSWORD = 'admin';
const STORE_KEY = 'gh_mock_db';

const now = Date.now();
const ago = (h) => new Date(now - h * 3600_000).toISOString();
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

function seed() {
  const p = (name, h) => ({ id: uuid(), name, created_at: ago(h) });
  const participants = [p('Camille', 120), p('Mehdi', 100), p('Léa', 90), p('Thomas', 60), p('Inès', 30), p('Hugo', 5)];
  const [camille, mehdi, lea, thomas, ines] = participants;
  const r = (who, fields, h) => ({
    participant_id: who.id, status: null, days: [], all_days: false, dates_note: null,
    ski: null, teletravail: null, lieu: null, voiture: null, note: null, updated_at: ago(h), ...fields,
  });
  const responses = [
    r(camille, { status: 'in', all_days: true, ski: 'oui', teletravail: 'non', lieu: 'nature', voiture: 'oui', note: 'Je ramène l’appareil à raclette. Et le deuxième, au cas où.' }, 110),
    r(mehdi, { status: 'in', days: ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01'], dates_note: 'J’arrive dimanche soir tard, ou lundi matin', ski: 'peu_importe', teletravail: 'oui', lieu: 'aix', voiture: 'peu_importe' }, 95),
    r(lea, { status: 'maybe', days: ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02'], ski: 'oui', teletravail: 'peu_importe', lieu: 'peu_importe', voiture: 'non', note: 'Si je trouve quelqu’un pour garder le chat 🐈' }, 80),
    r(thomas, { status: 'in', days: ['2026-12-26', '2026-12-27', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31'], ski: 'non', teletravail: 'oui', lieu: 'chambery', voiture: 'oui' }, 50),
    r(ines, { status: 'out', dates_note: 'Réveillon dans la belle-famille cette année 😭' }, 20),
  ];
  const g = (name, fields, h) => ({
    id: uuid(), name, url: 'https://www.gites-de-france.com/fr', photo_url: null, price: null,
    capacity: null, area: null, description: null, added_by: 'Camille', created_at: ago(h), ...fields,
  });
  const gites = [
    g('Chalet du Margériaz', { price: '2 400 € la semaine', capacity: 12, area: 'nature', description: 'Au pied des pistes, poêle à bois, vue sur les Bauges. Le wifi est « correct » d’après l’annonce.', added_by: 'Camille' }, 100),
    g('Grande maison au bord du lac', { price: '3 100 €', capacity: 14, area: 'aix', description: 'À 5 min du lac du Bourget. Grande table pour 14, parfait pour la raclette géante.', added_by: 'Mehdi' }, 70),
    g('Ferme rénovée des Aillons', { capacity: 10, area: 'nature', added_by: GUEST }, 10),
  ];
  const votes = [
    { gite_id: gites[0].id, voter: 'Camille', created_at: ago(99) },
    { gite_id: gites[0].id, voter: 'Thomas', created_at: ago(40) },
    { gite_id: gites[0].id, voter: 'Léa', created_at: ago(30) },
    { gite_id: gites[1].id, voter: 'Mehdi', created_at: ago(69) },
    { gite_id: gites[1].id, voter: GUEST, created_at: ago(8) },
  ];
  const comments = [
    { id: uuid(), gite_id: gites[0].id, author: 'Thomas', body: 'Il y a un vrai bureau pour télétravailler ?', created_at: ago(39) },
    { id: uuid(), gite_id: gites[0].id, author: 'Camille', body: 'Une table + une prise + la vue. C’est un bureau.', created_at: ago(38) },
    { id: uuid(), gite_id: gites[1].id, author: 'Léa', body: 'Le lac en hiver, c’est trop beau 😍', created_at: ago(25) },
  ];
  return { participants, responses, gites, votes, comments };
}

let db;
function load() {
  const params = new URLSearchParams(location.search);
  try {
    if (params.get('mock') !== 'reset') {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return seed();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch { /* ignore */ }
}
db = load();
save();

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const clone = (x) => JSON.parse(JSON.stringify(x));

function auth(pw) {
  if (pw !== MOCK_PASSWORD) throw new ApiError('bad_password');
}

function cleanText(v, max, { required = false, field = '' } = {}) {
  if (v == null) v = '';
  if (typeof v !== 'string') throw new ApiError('invalid', field);
  v = v.trim();
  if (!v) {
    if (required) throw new ApiError('invalid', field ? `(${field} obligatoire)` : '');
    return null;
  }
  if (v.length > max) throw new ApiError('invalid', `(${field} : ${max} caractères max)`);
  return v;
}

function cleanUrl(v, { required = false, field = 'lien' } = {}) {
  const s = cleanText(v, LIMITS.url, { required, field });
  if (s == null) return null;
  if (!/^https?:\/\/\S+$/i.test(s)) throw new ApiError('invalid', `(${field} : doit commencer par https://)`);
  return s;
}

function cleanEnum(v, allowed, field) {
  if (v == null || v === '') return null;
  if (!allowed.includes(v)) throw new ApiError('invalid', `(${field})`);
  return v;
}

function cleanName(name) {
  const n = cleanText(name, LIMITS.name, { required: true, field: 'prénom' });
  if (n.toLowerCase() === GUEST.toLowerCase()) throw new ApiError('reserved_name');
  return n;
}

function cleanActor(name) {
  if (name === GUEST) return GUEST;
  return cleanText(name, LIMITS.name, { required: true, field: 'nom' });
}

function findOrCreateParticipant(name) {
  let p = db.participants.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!p) {
    p = { id: uuid(), name, created_at: new Date().toISOString() };
    db.participants.push(p);
  }
  return p;
}

export async function checkPassword(pw) {
  await wait(300);
  return pw === MOCK_PASSWORD;
}

export async function getAll(pw) {
  await wait();
  auth(pw);
  return clone(db);
}

export async function addParticipant(pw, name) {
  await wait();
  auth(pw);
  const p = findOrCreateParticipant(cleanName(name));
  save();
  return clone(p);
}

export async function upsertResponse(pw, name, f) {
  await wait(400);
  auth(pw);
  const p = findOrCreateParticipant(cleanName(name));
  const validDays = DAYS.map((d) => d.iso);
  const days = Array.isArray(f.days) ? [...new Set(f.days)] : [];
  if (days.some((d) => !validDays.includes(d))) throw new ApiError('invalid', '(dates)');
  const row = {
    participant_id: p.id,
    status: cleanEnum(f.status, ['in', 'maybe', 'out'], 'statut'),
    days: days.sort(),
    all_days: !!f.all_days,
    dates_note: cleanText(f.dates_note, LIMITS.note, { field: 'notes sur les dates' }),
    note: cleanText(f.note, LIMITS.note, { field: 'un mot' }),
    updated_at: new Date().toISOString(),
  };
  for (const q of PREFS) row[q.key] = cleanEnum(f[q.key], q.options.map((o) => o.value), q.title);
  db.responses = db.responses.filter((r) => r.participant_id !== p.id).concat(row);
  save();
  return clone(row);
}

export async function addGite(pw, f, addedBy) {
  await wait(400);
  auth(pw);
  let capacity = null;
  if (f.capacity != null && f.capacity !== '') {
    capacity = Number(f.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > LIMITS.capacityMax) {
      throw new ApiError('invalid', `(capacité : entre 1 et ${LIMITS.capacityMax})`);
    }
  }
  const gite = {
    id: uuid(),
    name: cleanText(f.name, LIMITS.giteName, { required: true, field: 'nom' }),
    url: cleanUrl(f.url, { required: true }),
    photo_url: cleanUrl(f.photo_url, { field: 'photo' }),
    price: cleanText(f.price, LIMITS.price, { field: 'prix' }),
    capacity,
    area: cleanText(f.area, LIMITS.area, { field: 'coin' }),
    description: cleanText(f.description, LIMITS.description, { field: 'description' }),
    added_by: cleanActor(addedBy),
    created_at: new Date().toISOString(),
  };
  db.gites.push(gite);
  save();
  return clone(gite);
}

export async function toggleVote(pw, giteId, voter) {
  await wait(300);
  auth(pw);
  if (!db.gites.some((g) => g.id === giteId)) throw new ApiError('not_found');
  const v = cleanActor(voter);
  const existing = db.votes.findIndex((x) => x.gite_id === giteId && x.voter === v);
  let voted;
  if (existing >= 0) {
    db.votes.splice(existing, 1);
    voted = false;
  } else {
    db.votes.push({ gite_id: giteId, voter: v, created_at: new Date().toISOString() });
    voted = true;
  }
  save();
  return { voted };
}

export async function addComment(pw, giteId, author, body) {
  await wait(300);
  auth(pw);
  if (!db.gites.some((g) => g.id === giteId)) throw new ApiError('not_found');
  const c = {
    id: uuid(),
    gite_id: giteId,
    author: cleanActor(author),
    body: cleanText(body, LIMITS.comment, { required: true, field: 'commentaire' }),
    created_at: new Date().toISOString(),
  };
  db.comments.push(c);
  save();
  return clone(c);
}

export async function adminCheck(adminPw) {
  await wait(300);
  return adminPw === MOCK_ADMIN_PASSWORD;
}

export async function adminDelete(adminPw, table, id, voter) {
  await wait(300);
  if (adminPw !== MOCK_ADMIN_PASSWORD) throw new ApiError('bad_password');
  const before = JSON.stringify(db);
  switch (table) {
    case 'gite':
      db.gites = db.gites.filter((g) => g.id !== id);
      db.votes = db.votes.filter((v) => v.gite_id !== id);
      db.comments = db.comments.filter((c) => c.gite_id !== id);
      break;
    case 'comment': db.comments = db.comments.filter((c) => c.id !== id); break;
    case 'participant':
      db.participants = db.participants.filter((p) => p.id !== id);
      db.responses = db.responses.filter((r) => r.participant_id !== id);
      break;
    case 'response': db.responses = db.responses.filter((r) => r.participant_id !== id); break;
    case 'vote': db.votes = db.votes.filter((v) => !(v.gite_id === id && v.voter === voter)); break;
    default: throw new ApiError('invalid', '(table)');
  }
  save();
  return { deleted: JSON.stringify(db) !== before };
}
