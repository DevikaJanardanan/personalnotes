export const NOTE_COLORS = [
  { id: 'default', label: 'Paper' },
  { id: 'yellow', label: 'Yellow' },
  { id: 'green', label: 'Sage' },
  { id: 'blue', label: 'Sky' },
  { id: 'pink', label: 'Rose' },
  { id: 'purple', label: 'Lilac' },
];

export const SORT_OPTIONS = [
  { id: 'updated', label: 'Last edited' },
  { id: 'created', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'title', label: 'Title A–Z' },
];

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "just now", "5 mins ago", "2 hrs ago" (only used for things less than a day old) */
export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${plural(Math.floor(diff / MINUTE), 'min')} ago`;
  return `${plural(Math.floor(diff / HOUR), 'hr')} ago`;
}

/** 14/10/2026 */
export function formatDate(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** 14/10/2026, 09:12 */
export function formatDateTime(date) {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(d)}, ${hh}:${min}`;
}

/**
 * The date line shown on each note card:
 *   - new note, less than a day old        → "Created 2 hrs ago"
 *   - new note, older than a day           → "14/10/2026"
 *   - edited on the same day it was made   → "Edited 2 hrs ago"
 *   - edited more than a day after creation
 *     (or the edit itself is over a day old) → "15/10/2026 (edited)"
 * Pinning or locking a note does not count as editing it.
 */
export function noteDateLabel(note) {
  const now = Date.now();
  const created = new Date(note.createdAt).getTime();
  const edited = new Date(note.editedAt || note.createdAt).getTime();
  const wasEdited = edited - created > MINUTE;

  if (!wasEdited) {
    return now - created < DAY ? `Created ${timeAgo(created)}` : formatDate(created);
  }
  if (edited - created > DAY || now - edited >= DAY) {
    return `${formatDate(edited)} (edited)`;
  }
  return `Edited ${timeAgo(edited)}`;
}

export const wordCount = (text = '') => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** Splits text into parts so the search term can be wrapped in <mark>. */
export function splitForHighlight(text, query) {
  if (!query) return [{ text, match: false }];
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text
    .split(new RegExp(`(${escaped})`, 'gi'))
    .filter(Boolean)
    .map((part) => ({ text: part, match: part.toLowerCase() === query.toLowerCase() }));
}

/** Turns "Work, #ideas ,  work" into ["work", "ideas"] */
export function normaliseTag(tag) {
  return tag.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-').slice(0, 30);
}
