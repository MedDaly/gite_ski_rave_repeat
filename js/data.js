// Derived views over the raw data returned by api.getAll().
import { DAYS } from './config.js';

/** Participants joined with their response (or null), sorted by name. */
export function people(data) {
  const byId = new Map(data.responses.map((r) => [r.participant_id, r]));
  return data.participants
    .map((p) => ({ ...p, response: byId.get(p.id) || null }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export function responseFor(data, name) {
  const p = data.participants.find((x) => x.name === name);
  return p ? data.responses.find((r) => r.participant_id === p.id) || null : null;
}

export function effectiveDays(r) {
  if (!r) return [];
  return r.all_days ? DAYS.map((d) => d.iso) : r.days || [];
}

export function statusCounts(data) {
  const c = { in: 0, maybe: 0, out: 0 };
  for (const r of data.responses) if (r.status) c[r.status] += 1;
  return c;
}

/** Gîtes with votes + comments attached, sorted by votes desc, then oldest first. */
export function gitesWithVotes(data) {
  return data.gites
    .map((g) => ({
      ...g,
      voters: data.votes.filter((v) => v.gite_id === g.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)).map((v) => v.voter),
      comments: data.comments.filter((c) => c.gite_id === g.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    }))
    .sort((a, b) => b.voters.length - a.voters.length || a.created_at.localeCompare(b.created_at));
}
