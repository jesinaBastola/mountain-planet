import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Heart, Sparkles, Home, Compass, Send, X, MountainSnow, Camera, Info, Plus } from 'lucide-react';
import { useStore } from '../lib/store';

// Pinterest-style pill tabs (replaces the old left side rail)
const tabs = [
  { to: '/', Icon: Home, label: 'Home' },
  { to: '/explore', Icon: Compass, label: 'Explore' },
  { to: '/destinations', Icon: MountainSnow, label: 'Destinations' },
  { to: '/stories', Icon: Camera, label: 'Traveller Stories' },
  { to: '/saved', Icon: Heart, label: 'Saved' },
  { to: '/plan', Icon: Send, label: 'Plan a trip' },
  { to: '/about', Icon: Info, label: 'About' },
];

const tabCls = ({ isActive }: { isActive: boolean }) =>
  `flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[15px] font-semibold transition ${
    isActive ? 'bg-forest text-white shadow-sm' : 'text-ink-soft hover:bg-chip hover:text-forest'
  }`;

export default function Header() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const navigate = useNavigate();
  const { saved, setAgentOpen } = useStore();
  const loc = useLocation();
  // Full-size logo at the top of the page; header slims down once you scroll.
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompact((c) => (c ? window.scrollY > 20 : window.scrollY > 80));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (loc.pathname !== '/explore') setQ('');
    else setQ(params.get('q') ?? '');
  }, [loc.pathname, params]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/explore?q=${encodeURIComponent(q.trim())}` : '/explore');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gold/30 bg-forest text-white shadow-[0_6px_30px_rgba(10,19,34,.45)]">
        <div className={`mx-auto flex max-w-[1600px] items-center gap-2 px-3 transition-[height] duration-300 sm:gap-3 sm:px-5 ${compact ? 'h-[84px]' : 'h-[104px] sm:h-[150px]'}`}>
          <Link to="/" className="flex h-full shrink-0 items-center py-1.5 pr-1 sm:pr-3" aria-label="Mountain Planet home">
            <img
              src="/logo-full.webp"
              alt="Mountain Planet — Heaven is a myth, Himalayas are real"
              className={`w-auto transition-[height] duration-300 ${compact ? 'h-[72px]' : 'h-[90px] sm:h-[136px]'}`}
            />
          </Link>

          <form onSubmit={submit} className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search treks, peaks, safaris, Chitwan…"
              className="h-12 w-full rounded-full bg-white pl-11 pr-10 text-[15px] text-ink outline-none ring-gold/50 transition placeholder:text-muted focus:bg-paper focus:ring-4"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-line" aria-label="Clear">
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          <button
            onClick={() => setAgentOpen(true)}
            className="hidden items-center gap-2 rounded-full border border-white/30 px-4 py-2.5 text-[15px] font-semibold transition hover:border-gold hover:bg-white/10 lg:flex"
          >
            <Sparkles className="h-4 w-4 text-gold" /> Planet AI
          </button>
          <Link to="/stories?share=1" className="hidden shrink-0 items-center gap-1.5 rounded-full border border-gold/60 px-4 py-2.5 text-[15px] font-semibold text-gold transition hover:bg-gold hover:text-forest-deep xl:flex">
            <Plus className="h-4 w-4" /> Share your story
          </Link>
          <Link to="/plan" className="hidden shrink-0 rounded-full bg-gold px-5 py-3 text-[15px] font-bold text-forest-deep transition hover:bg-white sm:block">
            Plan a trip
          </Link>
        </div>
        <nav aria-label="Main menu" className="hidden border-t border-line bg-paper/95 backdrop-blur md:block">
          <div className="no-scrollbar mx-auto flex h-14 max-w-[1600px] items-center gap-1 overflow-x-auto px-3 sm:px-5 [&>*:first-child]:ml-auto [&>*:last-child]:mr-auto">
            {tabs.map(({ to, Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={tabCls}>
                <Icon className="h-[18px] w-[18px]" />
                {label}
                {to === '/saved' && saved.length > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">{saved.length}</span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {/* mobile bottom bar */}
      <nav className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-full bg-forest px-2 py-2 shadow-[0_8px_40px_rgba(0,0,0,.18)] backdrop-blur md:hidden">
        {[
          { to: '/', icon: Home, label: 'Home' },
          { to: '/explore', icon: Compass, label: 'Explore' },
          { to: '/stories', icon: Camera, label: 'Traveller Stories' },
        ].map((it) => (
          <NavLink key={it.to} to={it.to} end className={({ isActive }) => `grid h-11 w-11 place-items-center rounded-full ${isActive ? 'bg-gold text-forest-deep' : 'text-white'}`} aria-label={it.label}>
            <it.icon className="h-5 w-5" />
          </NavLink>
        ))}
        <button onClick={() => setAgentOpen(true)} className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-gold to-ember text-white shadow-lg" aria-label="Planet AI">
          <Sparkles className="h-5 w-5" />
        </button>
        <NavLink to="/saved" className={({ isActive }) => `relative grid h-11 w-11 place-items-center rounded-full ${isActive ? 'bg-gold text-forest-deep' : 'text-white'}`} aria-label="Saved">
          <Heart className="h-5 w-5" />
          {saved.length > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-ember" />}
        </NavLink>
        <NavLink to="/plan" className={({ isActive }) => `grid h-11 w-11 place-items-center rounded-full ${isActive ? 'bg-gold text-forest-deep' : 'text-white'}`} aria-label="Plan a trip">
          <Send className="h-5 w-5" />
        </NavLink>
      </nav>
    </>
  );
}
