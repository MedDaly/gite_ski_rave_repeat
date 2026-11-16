// Error codes shared by the mock and the real backend.
export class ApiError extends Error {
  constructor(code, detail) {
    super(MESSAGES[code] || MESSAGES.unknown);
    this.code = code;
    this.detail = detail;
  }
}

const MESSAGES = {
  bad_password: 'Mot de passe incorrect.',
  reserved_name: '« Invité » est déjà pris par tout le monde 😅 Choisis un vrai prénom.',
  invalid: 'Il y a un souci dans ce que tu as rempli.',
  not_found: 'Introuvable. Quelqu’un l’a peut-être supprimé.',
  network: 'Problème de connexion. Réessaie dans un instant.',
  not_configured: 'Le serveur n’est pas encore branché (bientôt !).',
  unknown: 'Oups, quelque chose a coincé. Réessaie.',
};

export function messageFor(err) {
  if (err instanceof ApiError) return err.detail ? `${err.message} ${err.detail}` : err.message;
  return MESSAGES.unknown;
}
