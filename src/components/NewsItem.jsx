export default function NewsItem({ item, blog }) {
  return (
    <div className="news-item">
      <div className={`news-tag${blog ? ' blog' : ''}`}>{blog ? item.cat : item.tag}</div>
      <div className="news-text">{item.text}</div>
      <div className="news-meta">
        {blog ? `${item.mins} min read · ${item.date}` : `${item.src} · ${item.ago}`}
      </div>
    </div>
  );
}
