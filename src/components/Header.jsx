export default function Header({ watchCount, onWatchClick }) {
  return (
    <header className="hdr">
      <a className="hdr-logo" href="#">
        <div className="hdr-icon">IN</div>
        <div>
          <div className="hdr-name">India Market Snapshot</div>
          <div className="hdr-sub">All indices · One page</div>
        </div>
      </a>
      <div className="hdr-spacer"></div>
      <div className="hdr-watch" onClick={onWatchClick}>
        <span style={{fontSize:13}}>★</span>
        <span className="hdr-watch-label">Watchlist</span>
        <span className="hdr-watch-count">{watchCount}</span>
      </div>
      <div className="live-wrap">
        <div className="live-dot"></div>
        <span id="liveTime">Live</span>
      </div>
      <button className="pwa-btn" id="pwaBtn">+ Install</button>
    </header>
  );
}
