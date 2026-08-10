import Link from "next/link";
import { Compass, Leaf } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="WildGap home">
          <span className="brand-mark"><Leaf size={18} strokeWidth={2.5} /></span>
          <span>WildGap</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/#method">Method</Link>
          <Link href="/#impact">Impact</Link>
          <Link className="button button-small button-dark" href="/explore">
            <Compass size={16} /> Scout an area
          </Link>
        </nav>
      </div>
    </header>
  );
}
