'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { Appear, Label, SplitTitle } from './primitives';

// Docs bergaya Annona (Fase 9.1): daftar isi lengket dengan progres "1/N · judul" dan scroll-spy (desktop), bilah progres ringkas (mobile),
// dan DocSec untuk seksi bernomor. Daftar isi dan seksi memakai satu array `groups`, jadi id dan judul tidak bisa menyimpang.
type Group = { label: string; items: readonly (readonly [string, string])[] };

const flat = (groups: readonly Group[]) => groups.flatMap((g) => g.items.map(([id, label]) => ({ id, label, group: g.label })));

/** Seksi Docs: label "NN · Kelompok", judul terpecah (dari daftar isi), isi muncul pelan. */
export function DocSec({ id, groups, children }: { id: string; groups: readonly Group[]; children: ReactNode }) {
  const all = flat(groups);
  const i = all.findIndex((a) => a.id === id);
  const s = all[i];
  return (
    <section id={id} aria-labelledby={`${id}-title`}>
      <Label reveal={false}>{String(i + 1).padStart(2, '0')} · {s.group}</Label>
      <SplitTitle level={2} id={`${id}-title`}>{s.label}</SplitTitle>
      <Appear>{children}</Appear>
    </section>
  );
}

export function DocsNav({ groups }: { groups: readonly Group[] }) {
  const all = flat(groups);
  const [active, setActive] = useState(all[0].id);

  useEffect(() => {
    const els = all.map((a) => document.getElementById(a.id)).filter((e): e is HTMLElement => !!e);
    let queued = false;
    const pick = () => {
      queued = false;
      // Bagian aktif = yang judulnya terakhir melewati garis ~30% dari atas layar; di dasar halaman, bagian terakhir.
      const line = window.innerHeight * 0.3;
      let cur = els[0]?.id ?? all[0].id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) cur = el.id;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = els[els.length - 1].id;
      setActive(cur);
    };
    const on = () => { if (!queued) { queued = true; requestAnimationFrame(pick); } };
    pick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const idx = Math.max(0, all.findIndex((a) => a.id === active));
  const cur = all[idx];
  const progress = `${idx + 1}/${all.length} · ${cur.label}`;

  return (
    <>
      {/* Mobile: bilah progres lengket (tersembunyi di ≥1000px). */}
      <p className="toc-m" aria-live="polite"><span>{idx + 1}/{all.length}</span><b>{cur.label}</b></p>
      <nav className="toc" aria-label="Contents">
        <div className="prog" aria-live="polite">{progress}</div>
        {groups.map((g) => (
          <div key={g.label}>
            <div className="tg">{g.label}</div>
            {g.items.map(([id, label]) => (
              <a key={id} href={`#${id}`} className={id === active ? 'on' : undefined} aria-current={id === active ? 'location' : undefined}>
                <i aria-hidden="true" />{label}
              </a>
            ))}
          </div>
        ))}
      </nav>
    </>
  );
}
