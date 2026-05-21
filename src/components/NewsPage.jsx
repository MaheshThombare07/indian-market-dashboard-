import { NEWS } from '../data';

export default function NewsPage() {
  return (
    <div className="full-page">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
        {NEWS.map((n, i) => (
          <div className="panel" key={i} style={{cursor:'pointer'}}>
            <div style={{padding:'12px 14px'}}>
              <div className="news-tag" style={{marginBottom:6}}>{n.tag}</div>
              <div style={{fontSize:13,fontWeight:500,color:'var(--text)',lineHeight:1.4,marginBottom:6}}>{n.text}</div>
              <div className="news-meta">{n.src} · {n.ago}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
