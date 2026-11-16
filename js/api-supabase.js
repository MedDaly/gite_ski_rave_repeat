// Real backend (Supabase RPCs). Implemented in phase 3.
import { ApiError } from './errors.js';

const notYet = async () => { throw new ApiError('not_configured'); };

export const checkPassword = notYet;
export const getAll = notYet;
export const addParticipant = notYet;
export const upsertResponse = notYet;
export const addGite = notYet;
export const toggleVote = notYet;
export const addComment = notYet;
