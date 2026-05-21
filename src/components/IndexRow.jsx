import { fmtVal, fmtChg, barW, barC } from '../data';

export default function IndexRow({ item, period, showRank, rank, isWatched, onToggleWatch }) {
  const pct = item.chg[period] || 0;
  const { txt, cls } = fmtChg(pct);
  const val = fmtVal(item.base, pct, item.pre || '');

  return (
    <div className="idx-row">
      {showRank && <span className="idx-rank">{rank}</span>}
      <span
        className={`idx-star${isWatched ? ' on' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleWatch(item.id); }}
      >
        {isWatched ? '★' : '☆'}
      </span>
      <span className="idx-name" title={item.name}>{item.name}</span>
      <span className="idx-val">{val}</span>
      <span className={`idx-chg ${cls}`}>{txt}</span>
      <div className="mini-bar">
        <div className="mini-bar-fill" style={{width: `${barW(pct)}%`, background: barC(pct)}}></div>
      </div>
    </div>
  );
}
