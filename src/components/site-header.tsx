import { Compass, Leaf } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="/" aria-label="WildGap home">
          <span className="brand-mark"><Leaf size={18} strokeWidth={2.5} /></span>
          <span>WildGap</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/#method">Method</a>
          <a href="/#impact">Impact</a>
          <a className="button button-small button-dark" href="/explore">
            <Compass size={16} /> Scout an area
          </a>
        </nav>
      </div>
    </header>
  );
}
