"use client";

import { useEffect } from "react";
import { BRAND } from "@/components/brand";
import { GardenArt } from "@/components/garden-art";
import "./globals.css";

// Jaring terakhir: menggantikan layout akar, jadi harus membawa <html> dan <body> sendiri.
// Sengaja tanpa Header/Footer/router/Shell: bila layout rusak, jangan bergantung padanya (tautan memakai <a>).
// Font self-host dimuat di layout akar dan tidak ada di sini; --serif/--sans jatuh ke Georgia/font sistem. Gaya Annona (token, .btn, .d-h2) tetap dari globals.css.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{`Something went wrong — ${BRAND}`}</title>
        {/* Sama dengan skrip pemulih tema di layout akar. */}
        <script dangerouslySetInnerHTML={{ __html: 'try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}' }} />
      </head>
      <body className="antialiased" style={{ fontFamily: "var(--sans)" }}>
        <main className="sys-solo">
          <div>
            {/* Sengaja <a>, bukan <Link>: muat ulang penuh agar pulih dari layout yang rusak. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <p><a href="/" className="brand" style={{ justifyContent: "center" }}>{BRAND}</a></p>
            <p className="label" style={{ justifyContent: "center" }}>Error</p>
            <h1 className="d-h2">The whole wall <em>shook.</em></h1>
            <div role="alert">
              <p className="lead">Something broke before the page could load. That is on our side. Try again in a moment.</p>
              {error.digest && <p className="note" style={{ marginTop: 12 }}>Reference: {error.digest}</p>}
            </div>
            <GardenArt variant="cut" />
            <div className="btns" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <button type="button" className="btn btn-sun" onClick={reset}>Try again</button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="btn btn-ghost">Back to the garden</a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
