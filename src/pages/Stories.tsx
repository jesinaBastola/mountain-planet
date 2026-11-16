import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Plus } from 'lucide-react';
import { useStories, type Story } from '../lib/stories';
import { ShareStoryModal, StoryCard, StoryLightbox, StoryMasonry } from '../components/Stories';

export default function Stories() {
  const { stories, loading } = useStories();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState<Story | null>(null);
  const [filter, setFilter] = useState('All');
  const sharing = params.get('share') === '1';

  useEffect(() => {
    document.title = 'Traveller Stories · Mountain Planet Nepal';
  }, []);

  const setSharing = (v: boolean) => {
    const next = new URLSearchParams(params);
    if (v) next.set('share', '1');
    else next.delete('share');
    setParams(next, { replace: true });
  };

  const trips = useMemo(() => ['All', ...Array.from(new Set(stories.map((s) => s.trip).filter(Boolean)))], [stories]);
  const shown = filter === 'All' ? stories : stories.filter((s) => s.trip === filter);
  const photoCount = stories.reduce((n, s) => n + s.photos.length, 0);

  return (
    <div>
      {/* hero */}
      <section className="relative isolate overflow-hidden bg-night text-white">
        <div className="absolute inset-0 -z-10 grid grid-cols-3 gap-1 opacity-40 sm:grid-cols-6">
          {['/img/ebc.jpg', '/img/people.jpg', '/img/annapurna.jpg', '/img/bhaktapur.jpg', '/img/gokyo.jpg', '/img/chitwan.jpg'].map((src) => (
            <img key={src} src={src} alt="" className="h-full w-full object-cover" />
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/80 to-night/40" />
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:py-24 lg:px-10">
          <p className="font-script text-3xl text-gold">Come as a traveller, leave as family</p>
          <h1 className="mt-2 max-w-3xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">Traveller Stories</h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">Real moments and photos from people who walked these trails with us. Been on a trip with Mountain Planet? Add yours to the wall.</p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <button onClick={() => setSharing(true)} className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-4 font-bold text-night transition hover:scale-105 hover:bg-white">
              <Plus className="h-5 w-5" /> Share your story
            </button>
            {!loading && (
              <span className="text-sm text-white/70"><b className="text-white">{stories.length}</b> stories · <b className="text-white">{photoCount}</b> photos</span>
            )}
          </div>
        </div>
        <div className="flags h-1.5" />
      </section>

      <section className="mx-auto max-w-[1600px] px-3 pt-8 sm:px-5">
        {trips.length > 2 && (
          <div className="no-scrollbar -mx-3 mb-6 flex gap-2 overflow-x-auto px-4 py-1 sm:-mx-5 sm:px-6">
            {trips.map((t) => (
              <button key={t} onClick={() => setFilter(t)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${filter === t ? 'bg-forest text-white' : 'bg-chip text-ink hover:bg-line'}`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <StoryMasonry>
            {[260, 340, 220, 300, 280, 360, 240, 320].map((h, i) => (
              <div key={i} className="mb-4 animate-pulse break-inside-avoid rounded-3xl bg-chip sm:mb-5" style={{ height: h }} />
            ))}
          </StoryMasonry>
        ) : (
          <StoryMasonry>
            <button onClick={() => setSharing(true)} className="mb-4 flex w-full break-inside-avoid flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gold/60 bg-gold/5 px-6 py-14 text-center transition hover:border-gold hover:bg-gold/10 sm:mb-5">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-gold text-night"><Camera className="h-6 w-6" /></span>
              <b className="font-display text-xl">Add your photos</b>
              <span className="text-sm text-muted">Share the views, the people and the moments from your trip.</span>
            </button>
            {shown.map((s, i) => (
              <StoryCard key={s.id} story={s} index={i} onOpen={() => setOpen(s)} />
            ))}
          </StoryMasonry>
        )}
      </section>

      <StoryLightbox story={open} onClose={() => setOpen(null)} />
      <ShareStoryModal open={sharing} onClose={() => setSharing(false)} />
    </div>
  );
}
