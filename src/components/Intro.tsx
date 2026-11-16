import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/** Places of Nepal that orbit as little "planets" before everything merges. */
const places = [
  { name: 'Everest', img: '/img/intro/ebc.jpg' },
  { name: 'Annapurna', img: '/img/intro/annapurna.jpg' },
  { name: 'Kathmandu', img: '/img/intro/kathmandu.jpg' },
  { name: 'Pokhara', img: '/img/intro/pokhara.jpg' },
  { name: 'Chitwan', img: '/img/intro/chitwan.jpg' },
  { name: 'Mustang', img: '/img/intro/mustang.jpg' },
  { name: 'Lumbini', img: '/img/intro/lumbini.jpg' },
  { name: 'Bhaktapur', img: '/img/intro/bhaktapur.jpg' },
  { name: 'Langtang', img: '/img/intro/langtang.jpg' },
];

/** Different kinds of planets drifting in the background (x, y as a fraction of the screen from the centre). */
const worlds = [
  { id: 'ringed', x: -0.36, y: -0.3, size: 1.25, ring: true, c: ['#f6d29a', '#c9843a', '#5a3413'] },
  { id: 'ice', x: 0.38, y: -0.27, size: 0.95, c: ['#d6f1ff', '#5fa8d8', '#17406b'] },
  { id: 'mars', x: -0.4, y: 0.28, size: 0.8, c: ['#ffb08a', '#c4522a', '#4d1a0b'] },
  { id: 'violet', x: 0.36, y: 0.3, size: 1.1, ring: true, c: ['#e2c6ff', '#8a54d6', '#2a1252'] },
  { id: 'moon', x: 0.1, y: -0.4, size: 0.55, c: ['#f3f1ec', '#a39f98', '#45423d'] },
  { id: 'jade', x: -0.12, y: 0.41, size: 0.62, c: ['#c9ffe0', '#3fb37f', '#0e3d2a'] },
];

// Logo is cut into a 16-column grid of small squares. Only the squares that contain artwork are listed.
const LOGO_RATIO = 900 / 593;
const COLS = 16;
const VISIBLE = '5,0 6,0 7,0 9,0 10,0 11,0 4,1 5,1 6,1 7,1 8,1 9,1 10,1 11,1 12,1 3,2 4,2 5,2 6,2 7,2 8,2 9,2 10,2 11,2 12,2 3,3 4,3 5,3 7,3 8,3 9,3 10,3 11,3 12,3 13,3 2,4 3,4 4,4 6,4 7,4 8,4 9,4 10,4 11,4 12,4 13,4 1,5 2,5 3,5 5,5 6,5 7,5 8,5 9,5 10,5 11,5 12,5 13,5 1,6 2,6 3,6 4,6 5,6 6,6 7,6 9,6 10,6 11,6 12,6 13,6 0,7 1,7 2,7 3,7 4,7 5,7 6,7 7,7 8,7 9,7 10,7 11,7 12,7 13,7 14,7 15,7 0,8 1,8 2,8 3,8 4,8 5,8 6,8 7,8 8,8 9,8 10,8 11,8 12,8 13,8 14,8 15,8 0,9 1,9 2,9 3,9 4,9 5,9 6,9 7,9 8,9 9,9 10,9 11,9 12,9 13,9 14,9 15,9 7,10 8,10 9,10 10,10 11,10'.split(' ').map((k) => k.split(',').map(Number) as [number, number]);

// Timeline (seconds), about 10 seconds in total
const GATHER = 3.2; // every place has arrived in orbit
const ORBIT_END = 5.4;
const MERGED = 6.2; // places and planets have merged into the glowing core
const TILES_START = 4.4; // squares of the logo start flying in from every side
const TILES_SPREAD = 1.9;
const TILES_FLIGHT = 1.8;
const ASSEMBLED = TILES_START + TILES_SPREAD + TILES_FLIGHT; // 8.1
const WELCOME = 8.5;
const DONE_MS = 10200;

const entryAngles = [200, 290, 30, 110, 335, 160, 245, 70, 5];
const entryDelays = [0, 0.35, 0.7, 0.15, 0.5, 0.9, 0.25, 0.6, 1.0];

export function introSeen() {
  return false; // the intro plays every time the page is loaded or refreshed
}

// deterministic "random" so things don't jump between renders
const rand = (i: number) => {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

function World({ size, ring, c }: { size: number; ring?: boolean; c: string[] }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {ring && (
        <span
          className="absolute rounded-[50%] border-[3px]"
          style={{ left: -size * 0.45, right: -size * 0.45, top: size * 0.3, bottom: size * 0.3, borderColor: c[0] + 'aa', transform: 'rotate(-18deg)', boxShadow: `0 0 16px ${c[1]}66` }}
        />
      )}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 32% 28%, ${c[0]}, ${c[1]} 48%, ${c[2]} 100%)`,
          boxShadow: `inset -${size * 0.16}px -${size * 0.14}px ${size * 0.3}px rgba(0,0,0,.6), 0 0 ${size * 0.55}px ${c[1]}66`,
        }}
      />
      {ring && (
        <span
          className="absolute rounded-[50%] border-[3px]"
          style={{ left: -size * 0.45, right: -size * 0.45, top: size * 0.3, bottom: size * 0.3, borderColor: c[0] + 'cc', transform: 'rotate(-18deg)', clipPath: 'inset(50% 0 0 0)' }}
        />
      )}
    </div>
  );
}

export default function Intro({ ready, setReady }: { ready: boolean; setReady: (v: boolean) => void }) {
  const calm = useReducedMotion();
  const finish = () => setReady(true);

  useEffect(() => {
    if (ready) return;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(finish, calm ? 1800 : DONE_MS);
    return () => { clearTimeout(t); document.body.style.overflow = ''; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, calm]);

  const [dims] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const minSide = Math.min(dims.w, dims.h);
  const maxSide = Math.max(dims.w, dims.h);
  const orbitR = minSide * 0.34;
  const startR = maxSide * 0.58;
  const planetSize = Math.round(Math.max(52, Math.min(92, minSide * 0.12)));
  const worldBase = Math.round(Math.max(46, Math.min(86, minSide * 0.12)));

  // logo geometry
  const logoW = Math.min(dims.w * 0.82, 560);
  const logoH = logoW / LOGO_RATIO;
  const tile = logoW / COLS;

  const stars = useMemo(
    () => Array.from({ length: 90 }, (_, i) => ({ x: rand(i) * 100, y: rand(i + 500) * 100, s: rand(i + 900) * 2 + 0.6, d: 1.5 + rand(i + 1300) * 3, delay: rand(i + 1700) * 3 })),
    [],
  );

  const paths = useMemo(() => places.map((_, i) => {
    const deg = (d: number) => (d * Math.PI) / 180;
    const slot = (i / places.length) * 360;
    const entry = entryAngles[i];
    const d0 = entryDelays[i];
    const far = startR * (1 + rand(i + 77) * 0.12);
    const pts: [number, number, number][] = [
      [d0, far, entry],
      [d0 + 1.1, (far + orbitR) / 2, entry + (i % 2 ? 40 : -40)],
      [GATHER, orbitR, slot],
      [4.3, orbitR, slot + 60],
      [ORBIT_END, orbitR * 0.8, slot + 120],
      [5.9, orbitR * 0.3, slot + 165],
      [MERGED, 0, slot + 190],
    ];
    const dur = MERGED - d0;
    return {
      delay: d0,
      duration: dur,
      times: pts.map(([t]) => (t - d0) / dur),
      x: pts.map(([, r, a]) => Math.cos(deg(a)) * r),
      y: pts.map(([, r, a]) => Math.sin(deg(a)) * r * 0.82),
      labelTimes: [0, (GATHER - 0.4 - d0) / dur, (4.8 - d0) / dur, (5.3 - d0) / dur],
    };
  }), [orbitR, startR]);

  // every square of the logo flies in from its own direction
  const squares = useMemo(() => VISIBLE.map(([c, r], i) => {
    const ang = rand(i + 11) * Math.PI * 2;
    const dist = maxSide * (0.7 + rand(i + 23) * 0.5);
    return {
      c, r,
      sx: Math.cos(ang) * dist,
      sy: Math.sin(ang) * dist,
      rot: (rand(i + 37) - 0.5) * 540,
      delay: TILES_START + rand(i + 51) * TILES_SPREAD,
    };
  }), [maxSide]);

  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          key="intro"
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] h-[100dvh] overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,#1d3557_0%,#13233a_38%,#070d18_75%,#03060c_100%)] text-white"
        >
          {/* starfield */}
          {stars.map((s, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s }}
              initial={{ opacity: 0 }}
              animate={calm ? { opacity: 0.6 } : { opacity: [0.15, 0.9, 0.15] }}
              transition={calm ? { duration: 0.4 } : { duration: s.d, delay: s.delay * 0.3, repeat: Infinity }}
            />
          ))}

          {/* centre stage */}
          <div className="absolute left-1/2 top-1/2 h-0 w-0">
            {!calm && (
              <>
                {/* orbit ring */}
                <motion.div
                  aria-hidden="true"
                  className="absolute rounded-[50%] border border-gold/30 shadow-[0_0_40px_rgba(232,162,74,.15)]"
                  style={{ width: orbitR * 2, height: orbitR * 2 * 0.82, left: -orbitR, top: -orbitR * 0.82 }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.2] }}
                  transition={{ delay: 2.4, duration: MERGED - 2.4, times: [0, 0.25, 0.75, 1], ease: 'easeInOut' }}
                />

                {/* different planets drifting in, then pulled into the centre */}
                {worlds.map((w, i) => {
                  const sx = w.x * dims.w;
                  const sy = w.y * dims.h;
                  const size = worldBase * w.size;
                  return (
                    <motion.div
                      key={w.id}
                      aria-hidden="true"
                      className="absolute"
                      style={{ left: -size / 2, top: -size / 2 }}
                      initial={{ x: sx * 1.5, y: sy * 1.5, opacity: 0, scale: 0.3, rotate: 0 }}
                      animate={{
                        x: [sx * 1.5, sx, sx + (i % 2 ? -14 : 14), sx * 0.5, 0],
                        y: [sy * 1.5, sy, sy + (i % 2 ? 10 : -10), sy * 0.5, 0],
                        opacity: [0, 1, 1, 1, 0],
                        scale: [0.3, 1, 1, 0.7, 0.05],
                        rotate: [0, 8, -8, 120, 220],
                      }}
                      transition={{ duration: MERGED - 0.4 - i * 0.12, delay: 0.3 + i * 0.25, times: [0, 0.22, 0.58, 0.86, 1], ease: 'easeInOut' }}
                    >
                      <World size={size} ring={w.ring} c={w.c} />
                    </motion.div>
                  );
                })}

                {/* the places of Nepal, orbiting then merging */}
                {places.map((p, i) => (
                  <motion.div
                    key={p.name}
                    className="absolute"
                    style={{ width: planetSize, height: planetSize, left: -planetSize / 2, top: -planetSize / 2 }}
                    initial={{ x: paths[i].x[0], y: paths[i].y[0], opacity: 0, scale: 0.5 }}
                    animate={{ x: paths[i].x, y: paths[i].y, opacity: [0, 0.9, 1, 1, 1, 1, 0], scale: [0.4, 0.85, 1, 1, 0.9, 0.5, 0.1] }}
                    transition={{ duration: paths[i].duration, delay: paths[i].delay, times: paths[i].times, ease: 'easeInOut' }}
                  >
                    <img
                      src={p.img}
                      alt=""
                      className="h-full w-full rounded-full object-cover shadow-[inset_-10px_-10px_20px_rgba(0,0,0,.6),0_0_24px_rgba(232,162,74,.55)] ring-2 ring-gold/70"
                    />
                    <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,.45),transparent_45%),radial-gradient(circle_at_70%_75%,rgba(0,0,0,.55),transparent_60%)]" />
                    <motion.span
                      className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.22em] text-gold sm:text-xs"
                      animate={{ opacity: [0, 1, 1, 0] }}
                      transition={{ duration: paths[i].duration, delay: paths[i].delay, times: paths[i].labelTimes }}
                    >
                      {p.name}
                    </motion.span>
                  </motion.div>
                ))}

                {/* glowing core where everything merges; the logo squares gather around it */}
                <motion.div
                  aria-hidden="true"
                  className="absolute rounded-full bg-[radial-gradient(circle,rgba(255,240,210,.95),rgba(232,162,74,.55)_38%,rgba(232,162,74,0)_70%)]"
                  style={{ width: minSide * 0.34, height: minSide * 0.34, left: -minSide * 0.17, top: -minSide * 0.17 }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.1, 0.9, 1.15, 0.9, 1.1], opacity: [0, 1, 0.85, 1, 0.8, 0] }}
                  transition={{ duration: ASSEMBLED - MERGED + 0.1, delay: MERGED - 0.4, times: [0, 0.18, 0.4, 0.62, 0.82, 1], ease: 'easeInOut' }}
                />

                {/* flash + shockwave when the logo is whole */}
                <motion.div
                  aria-hidden="true"
                  className="absolute rounded-full bg-[radial-gradient(circle,rgba(255,232,190,.95),rgba(232,162,74,.4)_40%,transparent_70%)]"
                  style={{ width: minSide, height: minSide, left: -minSide / 2, top: -minSide / 2 }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 0.5, 1.6], opacity: [0, 0.9, 0] }}
                  transition={{ duration: 1.1, delay: ASSEMBLED - 0.25, ease: 'easeOut' }}
                />
                <motion.div
                  aria-hidden="true"
                  className="absolute rounded-full border-2 border-gold/70"
                  style={{ width: minSide * 0.5, height: minSide * 0.5, left: -minSide * 0.25, top: -minSide * 0.25 }}
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: [0.2, 2.6], opacity: [0.9, 0] }}
                  transition={{ duration: 1.3, delay: ASSEMBLED - 0.2, ease: 'easeOut' }}
                />
              </>
            )}
          </div>

          {/* the real logo, built from small squares, + welcome */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <div className="relative" style={{ width: logoW, height: logoH }}>
              {calm ? (
                <img src="/logo-full.webp" alt="Mountain Planet — Heaven is a myth, Himalayas are real" className="absolute inset-0 h-full w-full" />
              ) : (
                <>
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: [1, 1, 0] }}
                    transition={{ delay: ASSEMBLED - 0.1, duration: 0.5, times: [0, 0.2, 1] }}
                    aria-hidden="true"
                  >
                    {squares.map((s, i) => (
                      <motion.span
                        key={i}
                        className="absolute"
                        style={{
                          left: s.c * tile,
                          top: s.r * tile,
                          width: tile + 0.6,
                          height: tile + 0.6,
                          backgroundImage: 'url(/logo-full.webp)',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: `${logoW}px ${logoH}px`,
                          backgroundPosition: `-${s.c * tile}px -${s.r * tile}px`,
                        }}
                        initial={{ x: s.sx, y: s.sy, rotate: s.rot, scale: 0.3, opacity: 0 }}
                        animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
                        transition={{
                          delay: s.delay,
                          duration: TILES_FLIGHT,
                          ease: [0.2, 0.8, 0.2, 1],
                          opacity: { delay: s.delay, duration: 0.35 },
                        }}
                      />
                    ))}
                  </motion.div>
                  {/* seamless full logo takes over once the squares have joined */}
                  <motion.img
                    src="/logo-full.webp"
                    alt="Mountain Planet — Heaven is a myth, Himalayas are real"
                    className="absolute inset-0 h-full w-full drop-shadow-[0_0_40px_rgba(232,162,74,.35)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: ASSEMBLED - 0.1, duration: 0.4 }}
                  />
                </>
              )}
            </div>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: calm ? 0.5 : WELCOME, duration: 0.7 }}
              className="mt-4 font-script text-3xl text-gold sm:text-5xl"
            >
              Welcome to Mountain Planet
            </motion.p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 'min(60vw, 280px)' }}
              transition={{ delay: calm ? 0.6 : WELCOME + 0.2, duration: calm ? 0.6 : 1.2, ease: 'easeInOut' }}
              className="flags mt-6 h-1.5 rounded-full"
            />
          </div>

          <button onClick={finish} className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-white/20 px-5 py-2 text-sm text-white/70 backdrop-blur transition hover:border-gold hover:text-white">
            Skip intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
