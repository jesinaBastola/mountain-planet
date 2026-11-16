import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Loader2, MapPin, Star, Trash2, X } from 'lucide-react';
import { tours } from '../data/tours';
import { useStore } from '../lib/store';
import { MAX_PHOTOS, notifyStoriesChanged, removeLocalStory, sharedStorage, submitStory, type Story } from '../lib/stories';

function useLockScroll(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [on]);
}

function Stars({ n, className = 'h-4 w-4' }: { n: number; className?: string }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= n ? 'fill-gold text-gold' : 'text-line'}`} />
      ))}
    </span>
  );
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

/* ------------------------------------------------------------------ card */

export function StoryCard({ story, onOpen, index = 0 }: { story: Story; onOpen: () => void; index?: number }) {
  const pending = story.mine && sharedStorage;
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-3xl bg-paper text-left ring-1 ring-line transition hover:shadow-xl sm:mb-5"
    >
      {story.photos[0] ? (
        <div className="relative overflow-hidden">
          <img src={story.photos[0]} alt={`${story.name} on ${story.trip}`} loading="lazy" className="w-full object-cover transition duration-500 group-hover:scale-105" />
          {story.photos.length > 1 && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-night/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
              <Camera className="h-3.5 w-3.5" /> {story.photos.length}
            </span>
          )}
          {pending && <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-night">Awaiting approval</span>}
        </div>
      ) : null}
      <div className="p-4">
        <Stars n={story.rating} />
        <p className="mt-2 line-clamp-4 text-[15px] leading-relaxed text-ink-soft">{story.text}</p>
        <div className="mt-3 flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest font-display text-sm font-bold text-gold">
            {story.name.trim().charAt(0).toUpperCase() || '?'}
          </span>
          <span className="min-w-0 text-sm leading-tight">
            <b className="block truncate">{story.name}</b>
            <span className="block truncate text-muted">{story.country}</span>
          </span>
        </div>
        {story.trip && <span className="mt-3 inline-block rounded-full bg-chip px-3 py-1 text-xs font-semibold text-forest">{story.trip}</span>}
      </div>
    </motion.button>
  );
}

export function StoryMasonry({ children }: { children: React.ReactNode }) {
  return <div className="columns-1 gap-4 sm:columns-2 sm:gap-5 lg:columns-3 xl:columns-4">{children}</div>;
}

/* -------------------------------------------------------------- lightbox */

export function StoryLightbox({ story, onClose }: { story: Story | null; onClose: () => void }) {
  const [i, setI] = useState(0);
  const { toast } = useStore();
  useLockScroll(!!story);
  useEffect(() => setI(0), [story]);
  useEffect(() => {
    if (!story) return;
    const n = story.photos.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && n) setI((x) => (x + 1) % n);
      if (e.key === 'ArrowLeft' && n) setI((x) => (x - 1 + n) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [story, onClose]);

  return (
    <AnimatePresence>
      {story && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-night/85 p-3 backdrop-blur-sm sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} role="dialog" aria-modal="true" aria-label={`Story by ${story.name}`}>
          <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-paper md:grid-cols-[1.4fr_1fr]">
            <div className="relative flex min-h-[260px] items-center justify-center bg-night">
              {story.photos.length > 0 ? (
                <img src={story.photos[i]} alt={`Photo ${i + 1} of ${story.photos.length} from ${story.name}`} className="max-h-[55vh] w-full object-contain md:max-h-[92vh]" />
              ) : (
                <Camera className="h-12 w-12 text-white/30" />
              )}
              {story.photos.length > 1 && (
                <>
                  <button onClick={() => setI((x) => (x - 1 + story.photos.length) % story.photos.length)} className="absolute left-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white" aria-label="Previous photo"><ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={() => setI((x) => (x + 1) % story.photos.length)} className="absolute right-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white" aria-label="Next photo"><ChevronRight className="h-5 w-5" /></button>
                  <div className="absolute bottom-3 flex gap-1.5">
                    {story.photos.map((_, k) => (
                      <button key={k} onClick={() => setI(k)} className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-gold' : 'w-2 bg-white/60'}`} aria-label={`Photo ${k + 1}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-col overflow-y-auto p-6 sm:p-8">
              <button onClick={onClose} className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-chip hover:bg-line" aria-label="Close"><X className="h-5 w-5" /></button>
              <div className="mt-2 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-forest font-display text-lg font-bold text-gold">{story.name.trim().charAt(0).toUpperCase()}</span>
                <div>
                  <b className="block font-display text-xl">{story.name}</b>
                  <span className="flex items-center gap-1 text-sm text-muted"><MapPin className="h-3.5 w-3.5" /> {story.country}{fmtDate(story.createdAt) && ` · ${fmtDate(story.createdAt)}`}</span>
                </div>
              </div>
              <div className="mt-4"><Stars n={story.rating} className="h-5 w-5" /></div>
              {story.trip && <span className="mt-3 self-start rounded-full bg-chip px-3 py-1 text-xs font-semibold text-forest">{story.trip}</span>}
              <p className="mt-5 whitespace-pre-line font-display text-lg leading-relaxed text-ink">{story.text}</p>
              {story.photos.length > 1 && (
                <div className="mt-6 grid grid-cols-4 gap-2">
                  {story.photos.map((p, k) => (
                    <button key={k} onClick={() => setI(k)} className={`overflow-hidden rounded-xl ring-2 ${k === i ? 'ring-gold' : 'ring-transparent'}`}>
                      <img src={p} alt="" className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {story.mine && (
                <button
                  onClick={() => { removeLocalStory(story.id); notifyStoriesChanged(); toast(sharedStorage ? 'Removed from this device' : 'Story deleted'); onClose(); }}
                  className="mt-auto flex items-center gap-2 self-start pt-6 text-sm font-semibold text-ember hover:underline"
                >
                  <Trash2 className="h-4 w-4" /> {sharedStorage ? 'Hide from this device' : 'Delete my story'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------- share modal */

const tripOptions = [...tours.map((t) => t.title), 'Custom / tailor-made trip', 'Other'];

export function ShareStoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useStore();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [trip, setTrip] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [honey, setHoney] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | 'published' | 'pending'>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useLockScroll(open);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  const reset = () => {
    setName(''); setCountry(''); setTrip(''); setRating(5); setText(''); setFiles([]); setConsent(false); setError(''); setDone(null);
  };
  const close = () => { if (busy) return; onClose(); if (done) reset(); };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/'));
    const tooBig = imgs.find((f) => f.size > 20 * 1024 * 1024);
    if (tooBig) { setError(`“${tooBig.name}” is over 20 MB.`); return; }
    setError('');
    setFiles((cur) => {
      const next = [...cur, ...imgs].slice(0, MAX_PHOTOS);
      if (cur.length + imgs.length > MAX_PHOTOS) setError(`You can add up to ${MAX_PHOTOS} photos.`);
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honey) return; // bot
    if (!name.trim() || !text.trim()) { setError('Please add your name and a few words about your trip.'); return; }
    if (files.length === 0) { setError('Please add at least one photo.'); return; }
    if (!consent) { setError('Please confirm you took these photos and are happy for us to share them.'); return; }
    setBusy(true); setError('');
    try {
      const status = await submitStory({ name: name.trim().slice(0, 60), country: country.trim().slice(0, 60), trip, rating, text: text.trim().slice(0, 2000) }, files);
      setDone(status);
      notifyStoriesChanged();
      toast(status === 'published' ? 'Your story is live — thank you!' : 'Thank you! Your story is with our team.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const field = 'mt-1.5 h-12 w-full rounded-xl border border-line bg-canvas px-4 text-[15px] outline-none transition focus:border-forest focus:bg-paper focus:ring-4 focus:ring-gold/25';

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center bg-night/80 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} role="dialog" aria-modal="true" aria-labelledby="share-title">
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-paper p-6 sm:rounded-[28px] sm:p-8">
            <div className="relative -mx-6 -mt-6 flex flex-col items-center rounded-t-[28px] bg-forest px-6 pb-6 pt-5 text-center text-white sm:-mx-8 sm:-mt-8 sm:px-8">
              <button onClick={close} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close"><X className="h-5 w-5" /></button>
              <img src="/logo-full.webp" alt="Mountain Planet — Heaven is a myth, Himalayas are real" className="h-28 w-auto sm:h-32" />
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-gold">Traveller stories</p>
              <h2 id="share-title" className="mt-1 font-display text-3xl font-semibold tracking-tight">Share your MP story</h2>
            </div>

            {done ? (
              <div className="py-10 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest text-3xl">🏔️</div>
                <h3 className="mt-5 font-display text-2xl font-semibold">Dhanyabad, {name.split(' ')[0]}!</h3>
                <p className="mx-auto mt-2 max-w-md text-muted">
                  {done === 'published'
                    ? 'Your story and photos are now on the Traveller Stories wall.'
                    : 'Your story and photos have reached our team. They will appear on the Traveller Stories wall once approved, usually within a day.'}
                </p>
                <div className="mt-7 flex justify-center gap-3">
                  <button onClick={() => { onClose(); reset(); }} className="rounded-full bg-forest px-6 py-3 font-bold text-white hover:bg-forest-deep">View stories</button>
                  <button onClick={reset} className="rounded-full bg-chip px-6 py-3 font-bold hover:bg-line">Share another</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-5">
                {/* photos */}
                <div>
                  <span className="text-sm font-semibold">Your photos <span className="font-normal text-muted">(up to {MAX_PHOTOS})</span></span>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
                    className={`mt-1.5 rounded-2xl border-2 border-dashed p-4 transition ${drag ? 'border-gold bg-gold/10' : 'border-line bg-canvas'}`}
                  >
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {previews.map((p, k) => (
                        <div key={p} className="group relative aspect-square overflow-hidden rounded-xl">
                          <img src={p} alt={`Selected photo ${k + 1}`} className="h-full w-full object-cover" />
                          <button type="button" onClick={() => setFiles((f) => f.filter((_, j) => j !== k))} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-night/75 text-white" aria-label={`Remove photo ${k + 1}`}><X className="h-4 w-4" /></button>
                          {k === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-night">Cover</span>}
                        </div>
                      ))}
                      {files.length < MAX_PHOTOS && (
                        <button type="button" onClick={() => inputRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl bg-paper text-xs font-semibold text-forest ring-1 ring-line transition hover:ring-forest">
                          <ImagePlus className="h-6 w-6" /> Add
                        </button>
                      )}
                    </div>
                    {files.length === 0 && <p className="mt-3 text-center text-sm text-muted">Drag photos here or tap <b>Add</b>. JPG or PNG work best.</p>}
                    <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">Your name
                    <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required placeholder="e.g. Sophie L." className={field} />
                  </label>
                  <label className="block text-sm font-semibold">Where are you from?
                    <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={60} placeholder="e.g. Lyon, France" className={field} />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
                  <label className="block text-sm font-semibold">Which trip?
                    <select value={trip} onChange={(e) => setTrip(e.target.value)} className={field}>
                      <option value="">Select your trip</option>
                      {tripOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <div className="text-sm font-semibold">Your rating
                    <div className="mt-1.5 flex h-12 items-center gap-1" role="radiogroup" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="p-0.5">
                          <Star className={`h-8 w-8 transition ${n <= rating ? 'fill-gold text-gold' : 'text-line hover:text-gold/60'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="block text-sm font-semibold">Your experience
                  <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} required rows={5} placeholder="The moment that stayed with you, your guide, the teahouses, the view from the top…" className={`${field} h-auto py-3 leading-relaxed`} />
                  <span className="mt-1 block text-right text-xs font-normal text-muted">{text.length}/2000</span>
                </label>

                {/* honeypot: hidden from people, bots fill it */}
                <input value={honey} onChange={(e) => setHoney(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" name="website" />

                <label className="flex items-start gap-3 text-sm text-ink-soft">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#13233a]" />
                  I took these photos (or have permission) and I’m happy for Mountain Planet Nepal to show them with my story on this website.
                </label>

                {error && <p className="rounded-xl bg-ember/10 px-4 py-3 text-sm font-semibold text-ember-deep" role="alert">{error}</p>}

                <button type="submit" disabled={busy} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gold font-bold text-night transition hover:bg-forest hover:text-white disabled:opacity-60">
                  {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Uploading photos…</> : 'Share my story'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
