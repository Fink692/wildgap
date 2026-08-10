"use client";

import { AlertCircle } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="empty-state"><div><AlertCircle size={44} /><h1>Something went off trail</h1><p>The error was contained. Your saved missions on this device were not changed.</p><button className="button button-primary" onClick={reset}>Try again</button></div></main>;
}
