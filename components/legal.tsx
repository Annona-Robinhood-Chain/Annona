import { Footer, Header } from "./layout-parts";
import { Appear, PageHead, SplitTitle } from "./primitives";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

// Kerangka bersama /terms, /privacy, /restricted (Fase 9.2): `phead` + kolom `.legal` 760px seperti legal() di annona.html.
// Tambahan dari html: catatan putus-putus (status draf) dan deretan chip "On this page" supaya tiap bagian punya tautan anchor.
// Id bagian dan chip berasal dari satu array, jadi anchor tidak bisa menyimpang.
export function LegalPage({ id, title, lead, status, updated, notice, sections }: {
  id: string;
  title: React.ReactNode;
  lead: string;
  status: string;
  updated: { iso: string; label: string };
  notice: React.ReactNode;
  sections: readonly LegalSection[];
}) {
  return (
    <>
      <Header overlay />
      <main data-legal={id}>
        <PageHead
          label="Legal"
          title={title}
          lead={lead}
          meta={<><span className="tag">{status}</span><span className="note">Last updated <time dateTime={updated.iso}>{updated.label}</time></span></>}
        />
        <div className="wrap">
          <div className="legal">
            <Appear className="legal-note" role="note">{notice}</Appear>
            <nav aria-label="On this page">
              <div className="chips">
                {sections.map((s) => <a key={s.id} className="chip" href={`#${s.id}`}>{s.title}</a>)}
              </div>
            </nav>
            {sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
                <SplitTitle level={2} id={`${s.id}-title`}>{s.title}</SplitTitle>
                <Appear>{s.body}</Appear>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// Tautan di dalam teks legal (gaya tautan ada di `.legal a`).
export const legalLink = "legal-link";
