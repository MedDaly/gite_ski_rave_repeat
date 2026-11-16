// Public configuration. The Supabase URL and anon key are public by design.
// NEVER put passwords in this file.
export const SUPABASE_URL = 'https://puvnnqwvgkvztjabmcdd.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_yTAWvvGYQjpzOnmqEae2UQ_imig0B5K'; // public by design

export const GUEST = 'Invité';

export const TRIP = {
  name: 'Gîte Happens',
  start: '2026-12-26',
  end: '2027-01-03',
  nye: '2026-12-31',
  // Countdown target: arrival day, midnight in Savoie (CET = UTC+1).
  countdownTarget: '2026-12-26T00:00:00+01:00',
  endTarget: '2027-01-04T00:00:00+01:00',
};

export const DAYS = [
  { iso: '2026-12-26', dow: 'Sam', label: '26/12' },
  { iso: '2026-12-27', dow: 'Dim', label: '27/12' },
  { iso: '2026-12-28', dow: 'Lun', label: '28/12' },
  { iso: '2026-12-29', dow: 'Mar', label: '29/12' },
  { iso: '2026-12-30', dow: 'Mer', label: '30/12' },
  { iso: '2026-12-31', dow: 'Jeu', label: '31/12', nye: true },
  { iso: '2027-01-01', dow: 'Ven', label: '01/01' },
  { iso: '2027-01-02', dow: 'Sam', label: '02/01' },
  { iso: '2027-01-03', dow: 'Dim', label: '03/01' },
];

export const STATUS = [
  { value: 'in', label: 'Partant·e', emoji: '🔥' },
  { value: 'maybe', label: 'Peut-être', emoji: '🤔' },
  { value: 'out', label: 'Pas dispo', emoji: '😢' },
];

// Preference questions (Q3–Q6). 'peu_importe' is always shown separately in the recap.
export const PREFS = [
  {
    key: 'ski', title: 'Ski ?', emoji: '⛷️',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'peu_importe', label: 'Peu importe' },
    ],
  },
  {
    key: 'teletravail', title: 'Télétravail ?', emoji: '💻',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'peu_importe', label: 'Peu importe' },
    ],
  },
  {
    key: 'lieu', title: 'Où loger ?', emoji: '📍',
    options: [
      { value: 'chambery', label: 'Chambéry' },
      { value: 'aix', label: 'Aix-les-Bains' },
      { value: 'nature', label: 'En pleine nature' },
      { value: 'peu_importe', label: 'Peu importe' },
    ],
  },
  {
    key: 'voiture', title: 'Louer une voiture ?', emoji: '🚗',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'peu_importe', label: 'Peu importe' },
    ],
  },
];

export const AREAS = [
  { value: 'chambery', label: 'Chambéry' },
  { value: 'aix', label: 'Aix-les-Bains' },
  { value: 'nature', label: 'Nature' },
  { value: 'autre', label: 'Autre' },
];

export const LIMITS = {
  name: 40,
  note: 500,
  giteName: 120,
  url: 500,
  price: 40,
  description: 500,
  comment: 1000,
  capacityMax: 50,
};

export const GITES_DE_FRANCE_URL = 'https://www.gites-de-france.com/fr';
