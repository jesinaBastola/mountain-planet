import { useEffect, useState } from 'react';
import Intro, { introSeen } from './components/Intro';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import Header from './components/Header';
import Footer from './components/Footer';
import SherpaAI from './components/SherpaAI';
import Home from './pages/Home';
import Explore from './pages/Explore';
import TourDetail from './pages/TourDetail';
import GuideDetail from './pages/GuideDetail';
import Saved from './pages/Saved';
import About from './pages/About';
import Destinations from './pages/Destinations';
import Place from './pages/Place';
import Stories from './pages/Stories';
import Plan from './pages/Plan';
import NotFound from './pages/NotFound';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!pathname.startsWith('/tour') && !pathname.startsWith('/guide')) document.title = 'Mountain Planet Nepal · Treks, Tours & Himalayan Adventures';
  }, [pathname]);
  return null;
}

/** On a full page load / refresh, always start from the home page (behind the intro). */
function StartAtHome() {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.location.pathname !== '/' || window.location.search || window.location.hash) {
      navigate('/', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function App() {
  const [ready, setReady] = useState(introSeen);
  return (
    <BrowserRouter>
      <StoreProvider>
        <StartAtHome />
        <Intro ready={ready} setReady={setReady} />
        <ScrollTop />
        <Header />
        <main className="min-h-[60vh]">
          {ready && <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/destinations/:slug" element={<Place />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/tour/:slug" element={<TourDetail />} />
            <Route path="/guide/:slug" element={<GuideDetail />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/about" element={<About />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="*" element={<NotFound />} />
          </Routes>}
        </main>
        <Footer />
        <SherpaAI />
      </StoreProvider>
    </BrowserRouter>
  );
}
