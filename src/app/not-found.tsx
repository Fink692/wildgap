import { MapPinned } from "lucide-react";

export default function NotFound() {
  return <main className="empty-state"><div><MapPinned size={44} /><h1>That trail ends here</h1><p>The page does not exist, but there are plenty of habitats left to scout.</p><a className="button button-primary" href="/explore">Scout an area</a></div></main>;
}
