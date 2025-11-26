export type ReviewFeedback = 'remember' | 'fuzzy' | 'forgot';

export interface ReviewEntry {
  id: string;
  subject: string;
  text: string;
  stage: number; // 0..n
  nextReviewAt: number;
  lastReviewedAt?: number;
}

const STORAGE_KEY = 'review_entries_v1';

const intervals = [1, 3, 7, 14, 30, 60]; // 天

function loadAll(): ReviewEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
  } catch {}
  return [];
}

function saveAll(entries: ReviewEntry[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function upsertFromItems(items: { id: string; subject: string; text: string; createdAt: string }[]) {
  const now = Date.now();
  const entries = loadAll();
  const map = new Map(entries.map((e) => [e.id, e]));
  let changed = false;
  for (const it of items) {
    if (!map.has(it.id)) {
      const next = now + intervals[0] * 24 * 60 * 60 * 1000;
      map.set(it.id, {
        id: it.id,
        subject: it.subject,
        text: it.text,
        stage: 0,
        nextReviewAt: next,
        lastReviewedAt: new Date(it.createdAt).getTime()
      });
      changed = true;
    }
  }
  if (changed) {
    saveAll(Array.from(map.values()));
  }
  return Array.from(map.values());
}

export function getEntries() {
  return loadAll();
}

export function getDueEntries(reference = Date.now()) {
  return loadAll().filter((e) => e.nextReviewAt <= reference).sort((a, b) => a.nextReviewAt - b.nextReviewAt);
}

export function applyFeedback(id: string, feedback: ReviewFeedback) {
  const entries = loadAll();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return entries;
  const entry = entries[idx];
  let stage = entry.stage;
  if (feedback === 'remember') stage = Math.min(stage + 1, intervals.length - 1);
  else if (feedback === 'fuzzy') stage = Math.max(stage - 1, 0);
  else if (feedback === 'forgot') stage = 0;
  const days = intervals[stage] || intervals[intervals.length - 1];
  const now = Date.now();
  entries[idx] = {
    ...entry,
    stage,
    lastReviewedAt: now,
    nextReviewAt: now + days * 24 * 60 * 60 * 1000
  };
  saveAll(entries);
  return entries;
}
