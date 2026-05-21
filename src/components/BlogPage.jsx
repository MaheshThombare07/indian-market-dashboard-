import { BLOGS } from '../data';

export default function BlogPage() {
  return (
    <div className="full-page">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
        {BLOGS.map((b, i) => (
          <div className="panel" key={i} style={{cursor:'pointer'}}>
            <div style={{padding:'12px 14px'}}>
              <div className="news-tag blog" style={{marginBottom:6}}>{b.cat}</div>
              <div style={{fontSize:13,fontWeight:500,color:'var(--text)',lineHeight:1.4,marginBottom:6}}>{b.text}</div>
              <div className="news-meta">{b.mins} min read · {b.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
