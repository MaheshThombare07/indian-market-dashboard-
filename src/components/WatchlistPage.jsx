import { NIFTY, BSE, GLOBAL, COMMODITIES } from '../data';
import IndexRow from './IndexRow';

export default function WatchlistPage({ period, watchlist, onToggleWatch }) {
  const all = [...NIFTY, ...BSE, ...GLOBAL, ...COMMODITIES];
  const items = all.filter(x => watchlist.includes(x.id));

  return (
    <div className="full-page">
      <div className="panel" style={{maxWidth:700}}>
        <div className="panel-hdr">
          <span className="panel-title">★ My watchlist</span>
          <span className="panel-badge">{watchlist.length} items</span>
        </div>
        <div>
          {items.length === 0 ? (
            <div className="watch-empty">
              No items pinned yet.<br />
              Click the ☆ star on any index row to add it here.
            </div>
          ) : (
            items.map((item, i) => (
              <IndexRow key={item.id} item={item} period={period} showRank rank={i+1} isWatched onToggleWatch={onToggleWatch} />
            ))
          )}
        </div>
      </div>
      <p style={{fontSize:11,color:'var(--text3)',marginTop:10}}>Click the ☆ star on any index row in the Overview to pin it here.</p>
    </div>
  );
}
