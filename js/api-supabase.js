// Real backend: Supabase Postgres RPC functions (see supabase/schema.sql).
// Plain fetch to PostgREST, no SDK needed. Every call sends the group password.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { ApiError } from './errors.js';

const KNOWN = ['bad_password', 'invalid', 'reserved_name', 'not_found'];

async function rpc(fn, args) {
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY };
  // Legacy anon keys are JWTs and go in Authorization too; new "sb_publishable_" keys don't.
  if (SUPABASE_ANON_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  let res;
  try {
    res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, {
      method: 'POST', headers, body: JSON.stringify(args),
    });
  } catch {
    throw new ApiError('network');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = String(body?.message || '');
    const m = msg.match(/^(\w+)(?::\s*(.*))?$/);
    if (m && KNOWN.includes(m[1])) throw new ApiError(m[1], m[2] ? `(${m[2]})` : undefined);
    console.error('RPC error', fn, res.status, body);
    throw new ApiError(res.status >= 500 ? 'network' : 'unknown');
  }
  return body;
}

export async function checkPassword(pw) {
  return (await rpc('check_password', { pw })) === true;
}
export const getAll = (pw) => rpc('get_all', { pw });
export const addParticipant = (pw, name) => rpc('add_participant', { pw, p_name: name });
export const upsertResponse = (pw, name, fields) => rpc('upsert_response', { pw, p_name: name, p_fields: fields });
export const addGite = (pw, fields, addedBy) => rpc('add_gite', { pw, p_fields: fields, p_added_by: addedBy });
export const toggleVote = (pw, giteId, voter) => rpc('toggle_vote', { pw, p_gite_id: giteId, p_voter: voter });
export const addComment = (pw, giteId, author, body) => rpc('add_comment', { pw, p_gite_id: giteId, p_author: author, p_body: body });

export async function adminCheck(adminPw) {
  return (await rpc('admin_check', { admin_pw: adminPw })) === true;
}
export const adminDelete = (adminPw, table, id, voter) =>
  rpc('admin_delete', { admin_pw: adminPw, p_table: table, p_id: id, p_voter: voter ?? null });
