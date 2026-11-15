// API facade. Pages only talk to this module.
// Backend: in-memory mock (?mock=1, or while Supabase isn't configured) or Supabase RPCs (phase 3).
import { SUPABASE_URL } from './config.js';
import { state } from './state.js';
import { ApiError } from './errors.js';

const params = new URLSearchParams(location.search);
export const MOCK = params.has('mock') || !SUPABASE_URL;

let backendPromise;
function backend() {
  backendPromise ??= MOCK ? import('./mock-api.js') : import('./api-supabase.js');
  return backendPromise;
}

let authErrorHandler = () => {};
export function onAuthError(fn) { authErrorHandler = fn; }

async function call(fn, ...args) {
  const b = await backend();
  try {
    return await b[fn](state.password, ...args);
  } catch (err) {
    if (err instanceof ApiError && err.code === 'bad_password') authErrorHandler();
    if (!(err instanceof ApiError)) {
      console.error(err);
      throw new ApiError('network');
    }
    throw err;
  }
}

export const api = {
  /** @returns {Promise<boolean>} */
  async checkPassword(pw) {
    const b = await backend();
    return b.checkPassword(pw);
  },
  /** @returns {Promise<{participants, responses, gites, votes, comments}>} */
  getAll: () => call('getAll'),
  addParticipant: (name) => call('addParticipant', name),
  upsertResponse: (name, fields) => call('upsertResponse', name, fields),
  addGite: (fields, addedBy) => call('addGite', fields, addedBy),
  /** @returns {Promise<{voted: boolean}>} */
  toggleVote: (giteId, voter) => call('toggleVote', giteId, voter),
  addComment: (giteId, author, body) => call('addComment', giteId, author, body),
};
