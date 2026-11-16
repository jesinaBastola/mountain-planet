// Traveller stories: customers share their experience + photos.
//
// Two storage modes:
//  1. Shared (recommended for production): set VITE_SUPABASE_URL and
//     VITE_SUPABASE_ANON_KEY (Vercel → Project → Settings → Environment Variables)
//     and run supabase/stories.sql once. Photos go to Supabase Storage, stories
//     go to the `stories` table and appear for everyone after you approve them.
//  2. Local fallback (no setup): stories are kept in this browser only, so the
//     person who posted sees it, but other visitors do not.

import { useCallback, useEffect, useState } from 'react';

export interface Story {
  id: string;
  name: string;
  country: string;
  trip: string;
  rating: number;
  text: string;
  photos: string[];
  createdAt: string;
  mine?: boolean;
}

export interface StoryInput {
  name: string;
  country: string;
  trip: string;
  rating: number;
  text: string;
}

const SB_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const BUCKET = 'story-photos';
const LOCAL_KEY = 'mpn-stories';

export const sharedStorage = Boolean(SB_URL && SB_KEY);
export const MAX_PHOTOS = 6;

// The company's existing testimonials, shown alongside customer uploads.
const featured: Story[] = [
  { id: 'f-sophie', name: 'Sophie L.', country: 'Lyon, France', trip: 'Everest Base Camp Trek', rating: 5, photos: ['/img/ebc.jpg', '/img/amadablam.jpg', '/img/bridge.jpg'], createdAt: '2025-10-20', text: 'Our guide Pasang felt like family by Namche. Every detail — permits, flights, lodges — was handled perfectly. Standing at Kala Patthar at sunrise was unreal.' },
  { id: 'f-daniel', name: 'Daniel & Mei', country: 'Singapore', trip: 'Annapurna Base Camp Trek', rating: 5, photos: ['/img/annapurna.jpg', '/img/poonhill.jpg'], createdAt: '2025-04-12', text: 'Tailored the pace for us as first-time trekkers. Hot springs on the way down were the cherry on top. Already planning Manaslu!' },
  { id: 'f-rahul', name: 'Rahul S.', country: 'Mumbai, India', trip: 'Chitwan Jungle Safari', rating: 5, photos: ['/img/chitwan.jpg'], createdAt: '2025-02-02', text: 'Smooth transfer from Kathmandu to Chitwan and a jungle safari we will never forget. Highly professional team.' },
];

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

function sbHeaders(extra: Record<string, string> = {}) {
  return { apikey: SB_KEY as string, Authorization: `Bearer ${SB_KEY}`, ...extra };
}

function readLocal(): Story[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch {
    return [];
  }
}

interface Row { id: string; created_at: string; name: string; country: string | null; trip: string | null; rating: number | null; story: string; photos: string[] | null }

export async function fetchStories(): Promise<Story[]> {
  const mine = readLocal().map((s) => ({ ...s, mine: true }));
  if (!sharedStorage) return [...mine, ...featured];
  try {
    const res = await fetch(`${SB_URL}/rest/v1/stories?select=*&approved=eq.true&order=created_at.desc&limit=200`, { headers: sbHeaders() });
    if (!res.ok) throw new Error(String(res.status));
    const rows: Row[] = await res.json();
    const remote: Story[] = rows.map((r) => ({ id: r.id, name: r.name, country: r.country ?? '', trip: r.trip ?? '', rating: r.rating ?? 5, text: r.story, photos: r.photos ?? [], createdAt: r.created_at }));
    // In shared mode the local list only holds "pending approval" copies of the visitor's own posts.
    const pending = mine.filter((m) => !remote.some((r) => r.id === m.id));
    return [...pending, ...remote, ...featured];
  } catch {
    return [...mine, ...featured];
  }
}

/** Resize + re-encode a photo in the browser so uploads stay small and fast. */
export async function compressImage(file: File, maxSide: number, quality: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error(`Couldn't read “${file.name}”. Please use a JPG or PNG photo.`));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not process this photo.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process photo.'))), 'image/jpeg', quality),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });

/** Returns 'published' (visible now) or 'pending' (waiting for team approval). */
export async function submitStory(input: StoryInput, files: File[]): Promise<'published' | 'pending'> {
  const id = uid();
  const createdAt = new Date().toISOString();

  if (!sharedStorage) {
    const photos: string[] = [];
    for (const f of files) photos.push(await blobToDataUrl(await compressImage(f, 1100, 0.72)));
    const story: Story = { id, createdAt, photos, ...input };
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify([story, ...readLocal()]));
    } catch {
      throw new Error('Your browser storage is full. Try fewer photos.');
    }
    return 'published';
  }

  const photos: string[] = [];
  for (const f of files) {
    const blob = await compressImage(f, 1800, 0.82);
    const path = `${createdAt.slice(0, 10)}/${uid()}.jpg`;
    const up = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: sbHeaders({ 'Content-Type': 'image/jpeg', 'x-upsert': 'false' }),
      body: blob,
    });
    if (!up.ok) throw new Error('Photo upload failed. Please try again.');
    photos.push(`${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`);
  }
  const res = await fetch(`${SB_URL}/rest/v1/stories`, {
    method: 'POST',
    headers: sbHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
    body: JSON.stringify({ id, name: input.name, country: input.country, trip: input.trip, rating: input.rating, story: input.text, photos }),
  });
  if (!res.ok) throw new Error('Could not save your story. Please try again.');
  // Keep a copy so the author sees their post (marked "awaiting approval").
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([{ id, createdAt, photos, ...input }, ...readLocal()].slice(0, 20)));
  } catch { /* not critical */ }
  return 'pending';
}

export function removeLocalStory(id: string) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(readLocal().filter((s) => s.id !== id)));
}

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setStories(await fetchStories());
    setLoading(false);
  }, []);
  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener('mpn-stories-changed', onChange);
    return () => window.removeEventListener('mpn-stories-changed', onChange);
  }, [reload]);
  return { stories, loading, reload };
}

export const notifyStoriesChanged = () => window.dispatchEvent(new Event('mpn-stories-changed'));
