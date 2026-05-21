import { NIFTY, BSE, GLOBAL, COMMODITIES, FOREX, BONDS, RBI, NEWS, BLOGS, ECO } from '../data';
import IndexRow from './IndexRow';
import SectionDivider from './SectionDivider';
import RateRow from './RateRow';
import NewsItem from './NewsItem';
import EcoRow from './EcoRow';
import useNiftyData from '../hooks/useNiftyData';
import useGlobalData from '../hooks/useGlobalData';
import useForexData from '../hooks/useForexData';
import useBondsData from '../hooks/useBondsData';
import useRbiData from '../hooks/useRbiData';
import useBseData from '../hooks/useBseData';
import useCommoditiesData from '../hooks/useCommoditiesData';

export default function Overview({ period, watchlist, onToggleWatch }) {
  const allItems = [...NIFTY, ...BSE, ...GLOBAL, ...COMMODITIES];
  const watchedItems = allItems.filter(x => watchlist.includes(x.id));

  // Live NIFTY data — merged with static fallback + historical periods
  const { data: niftyData, loading, marketOpen, isLive, error } = useNiftyData(NIFTY);
  const sortedNifty = [...niftyData].sort((a, b) => (b.chg[period] || 0) - (a.chg[period] || 0));

  // Live global indices from Yahoo Finance
  const { data: globalData, isLive: globalLive, error: globalError } = useGlobalData(GLOBAL);
  const sortedGlobal = [...globalData].sort((a, b) => (b.chg[period] || 0) - (a.chg[period] || 0));

  // Live BSE / Sensex data (via NSE — same endpoint as NIFTY)
  const { data: bseData, isLive: bseLive, marketOpen: bseOpen, error: bseError } = useBseData(BSE);
  const sortedBSE = [...bseData].sort((a, b) => (b.chg[period] || 0) - (a.chg[period] || 0));

  // Live commodities data (Yahoo Finance + static fallback for MCX metals)
  const { data: commodData, isLive: commodLive, error: commodError } = useCommoditiesData(COMMODITIES);
  const sortedComm = [...commodData].sort((a, b) => (b.chg[period] || 0) - (a.chg[period] || 0));

  // Live forex, bonds, RBI data
  const { data: forexData, isLive: forexLive } = useForexData(FOREX);
  const { data: bondsData } = useBondsData(BONDS);
  const { data: rbiData } = useRbiData(RBI);

  return (
    <div className="overview-grid body">
      {/* COL 1 */}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">NIFTY — broad & sectoral</span>
            <span className="panel-badge" style={{background: error ? 'var(--red-bg)' : marketOpen ? 'var(--green-bg)' : 'var(--bg3)', color: error ? 'var(--red-text)' : marketOpen ? 'var(--green-text)' : 'var(--text3)'}}>
              {loading ? 'loading…' : error ? 'offline' : isLive ? (marketOpen ? '● LIVE' : 'cached') : 'demo'}
            </span>
          </div>
          <div className="panel-scroll" style={{maxHeight:440}}>
            {sortedNifty.map((item, i) => (
              <IndexRow key={item.id} item={item} period={period} showRank rank={i+1} isWatched={watchlist.includes(item.id)} onToggleWatch={onToggleWatch} />
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">BSE / Sensex indices</span>
            <span className="panel-badge" style={{background: bseError ? 'var(--red-bg)' : bseOpen ? 'var(--green-bg)' : 'var(--bg3)', color: bseError ? 'var(--red-text)' : bseOpen ? 'var(--green-text)' : 'var(--text3)'}}>
              {bseError ? 'offline' : bseLive ? (bseOpen ? '● LIVE' : 'cached') : 'demo'}
            </span>
          </div>
          <div className="panel-scroll" style={{maxHeight:200}}>
            {sortedBSE.map((item, i) => (
              <IndexRow key={item.id} item={item} period={period} showRank rank={i+1} isWatched={watchlist.includes(item.id)} onToggleWatch={onToggleWatch} />
            ))}
          </div>
        </div>
      </div>

      {/* COL 2 */}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">Global indices</span>
            <span className="panel-badge" style={{background: globalError ? 'var(--red-bg)' : globalLive ? 'var(--green-bg)' : 'var(--bg3)', color: globalError ? 'var(--red-text)' : globalLive ? 'var(--green-text)' : 'var(--text3)'}}>
              {globalError ? 'offline' : globalLive ? '● LIVE' : 'demo'}
            </span>
          </div>
          <div className="panel-scroll" style={{maxHeight:270}}>
            {sortedGlobal.map((item, i) => (
              <IndexRow key={item.id} item={item} period={period} showRank rank={i+1} isWatched={watchlist.includes(item.id)} onToggleWatch={onToggleWatch} />
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">Commodities & MCX</span>
            <span className="panel-badge" style={{background: commodError ? 'var(--red-bg)' : commodLive ? 'var(--green-bg)' : 'var(--bg3)', color: commodError ? 'var(--red-text)' : commodLive ? 'var(--green-text)' : 'var(--text3)'}}>
              {commodError ? 'offline' : commodLive ? '● LIVE' : 'demo'}
            </span>
          </div>
          <div className="panel-scroll" style={{maxHeight:190}}>
            {sortedComm.map((item, i) => (
              <IndexRow key={item.id} item={item} period={period} showRank rank={i+1} isWatched={watchlist.includes(item.id)} onToggleWatch={onToggleWatch} />
            ))}
          </div>
        </div>
      </div>

      {/* COL 3 */}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">Forex / Bonds / Policy rates</span>
            <span className="panel-badge" style={{background: forexLive ? 'var(--green-bg)' : 'var(--bg3)', color: forexLive ? 'var(--green-text)' : 'var(--text3)'}}>
              {forexLive ? '● FX Live' : 'cached'}
            </span>
          </div>
          <div id="forex-panel">
            <ForexPanel period={period} forexData={forexData} bondsData={bondsData} rbiData={rbiData} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">★ My watchlist</span>
            <span className="panel-badge">{watchlist.length} pinned</span>
          </div>
          <div id="watch-mini">
            {watchedItems.length === 0 ? (
              <div className="watch-empty">Click ☆ on any index row to pin here.</div>
            ) : (
              watchedItems.map((item, i) => (
                <IndexRow key={item.id} item={item} period={period} showRank={false} isWatched onToggleWatch={onToggleWatch} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* COL 4 */}
      <div className="right-col">
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">Market news</span>
            <span className="panel-badge" style={{background:'#fef3c7',color:'#92400e'}}>Live</span>
          </div>
          <div>
            {NEWS.slice(0,6).map((n, i) => <NewsItem key={i} item={n} />)}
          </div>
        </div>
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">Blog & insights</span>
            <span className="panel-badge" style={{background:'var(--purple-bg)',color:'var(--purple-text)'}}>SEO</span>
          </div>
          <div>
            {BLOGS.slice(0,5).map((b, i) => <NewsItem key={i} item={b} blog />)}
          </div>
        </div>
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">Eco calendar</span>
            <span className="panel-badge" style={{background:'var(--green-bg)',color:'var(--green-text)'}}>This week</span>
          </div>
          <div>
            {ECO.slice(0,4).map((e, i) => <EcoRow key={i} item={e} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ForexPanel({ period, forexData, bondsData, rbiData }) {
  const mult = {today:1, yesterday:-0.7, '5days':2.2, '1month':5.0}[period] || 1;
  return (
    <>
      <SectionDivider text="INR forex pairs" />
      {forexData.map((f, i) => {
        const adj = (f.chg * mult).toFixed(2);
        const up = +adj >= 0;
        return (
          <RateRow key={i}>
            <span className="rate-label">{f.pair}</span>
            <span className="rate-val">₹{f.val.toFixed(4)}</span>
            <span className={`idx-chg ${up ? 'chg-up' : 'chg-dn'}`}>{up ? '▲ +' : '▼ '}{Math.abs(adj)}%</span>
          </RateRow>
        );
      })}
      <SectionDivider text="Bonds & yields" />
      {bondsData.map((b, i) => (
        <RateRow key={i}>
          <span className="rate-label">{b.name}</span>
          <span className="rate-val">{b.val}</span>
          <span className="rate-note">{b.note}</span>
        </RateRow>
      ))}
      <SectionDivider text="RBI & policy rates" />
      {rbiData.map((r, i) => (
        <RateRow key={i}>
          <span className="rate-label">{r.name}</span>
          <span className="rate-val">{r.val}</span>
          <span className="rate-note">{r.note}</span>
        </RateRow>
      ))}
    </>
  );
}
