import { useState } from 'react';
import Header from './components/Header';
import Ticker from './components/Ticker';
import NavTabs from './components/NavTabs';
import TimeRow from './components/TimeRow';
import Overview from './components/Overview';
import WatchlistPage from './components/WatchlistPage';
import IndianPage from './components/IndianPage';
import GlobalPage from './components/GlobalPage';
import CommoditiesPage from './components/CommoditiesPage';
import ForexPage from './components/ForexPage';
import NewsPage from './components/NewsPage';
import BlogPage from './components/BlogPage';
import CalendarPage from './components/CalendarPage';
import Footer from './components/Footer';
import InstallToast from './components/InstallToast';
import { NIFTY, BSE, GLOBAL, COMMODITIES } from './data';

function loadWatchlist() {
  try {
    return JSON.parse(localStorage.getItem('im_watch') || '[]');
  } catch {
    return [];
  }
}

function App() {
  const [period, setPeriod] = useState('today');
  const [currentPage, setCurrentPage] = useState('overview');
  const [watchlist, setWatchlist] = useState(loadWatchlist);

  const toggleWatch = (id) => {
    const next = watchlist.includes(id)
      ? watchlist.filter(w => w !== id)
      : [...watchlist, id];
    setWatchlist(next);
    localStorage.setItem('im_watch', JSON.stringify(next));
  };

  const allItems = [...NIFTY, ...BSE, ...GLOBAL, ...COMMODITIES];

  return (
    <>
      <Header watchCount={watchlist.length} onWatchClick={() => setCurrentPage('watchlist')} />
      <Ticker />
      <NavTabs currentPage={currentPage} onPageChange={setCurrentPage} />
      <TimeRow period={period} onPeriodChange={setPeriod} />

      <div className={`page${currentPage === 'overview' ? ' act' : ''}`}>
        <Overview period={period} watchlist={watchlist} onToggleWatch={toggleWatch} />
      </div>
      <div className={`page${currentPage === 'watchlist' ? ' act' : ''}`}>
        <WatchlistPage period={period} watchlist={watchlist} onToggleWatch={toggleWatch} />
      </div>
      <div className={`page${currentPage === 'indian' ? ' act' : ''}`}>
        <IndianPage period={period} watchlist={watchlist} onToggleWatch={toggleWatch} />
      </div>
      <div className={`page${currentPage === 'global' ? ' act' : ''}`}>
        <GlobalPage period={period} watchlist={watchlist} onToggleWatch={toggleWatch} />
      </div>
      <div className={`page${currentPage === 'commodities' ? ' act' : ''}`}>
        <CommoditiesPage period={period} watchlist={watchlist} onToggleWatch={toggleWatch} />
      </div>
      <div className={`page${currentPage === 'forex' ? ' act' : ''}`}>
        <ForexPage period={period} />
      </div>
      <div className={`page${currentPage === 'news' ? ' act' : ''}`}>
        <NewsPage />
      </div>
      <div className={`page${currentPage === 'blog' ? ' act' : ''}`}>
        <BlogPage />
      </div>
      <div className={`page${currentPage === 'calendar' ? ' act' : ''}`}>
        <CalendarPage />
      </div>

      <Footer />
      <InstallToast />
    </>
  );
}

export default App;
