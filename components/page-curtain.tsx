'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { BRAND } from './brand';

// Tirai transisi antar halaman (#curtain di annona.html).
// Klik tautan internal ke path lain dicegat: tirai naik (550ms), router.push, lalu tirai turun setelah pathname berganti.
// Tidak dicegat: klik dengan tombol modifier, target/unduhan, tautan luar, /api/*, berkas, perubahan query/hash di halaman yang sama,
// dan semuanya bila prefers-reduced-motion. Back/forward browser tidak memakai tirai. Pengaman 6 detik menurunkan tirai bila navigasi macet.
const EASE = 'cubic-bezier(.7,0,.3,1)';
const NAMES: Record<string, string> = {
  '/cordons': 'Cordons',
  '/vaults': 'Spurs & Grafts',
  '/harvest': 'Harvest',
  '/wall': 'The Wall',
  '/docs': 'Docs & Risk',
  '/terms': 'Terms',
  '/privacy': 'Privacy',
  '/restricted': 'Restricted',
};
function labelFor(path: string) {
  if (path === '/') return BRAND;
  const parts = path.split('/').filter(Boolean);
  if (parts.length > 1 && (parts[0] === 'cordons' || parts[0] === 'vaults')) {
    try {
      return decodeURIComponent(parts[1]).toUpperCase();
    } catch {
      return parts[1].toUpperCase();
    }
  }
  return (
    NAMES['/' + parts[0]] ??
    parts[0].replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
  );
}

export function PageCurtain() {
  const router = useRouter();
  const path = usePathname();
  const box = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const covered = useRef(false);
  const anim = useRef<Animation | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const run = useCallback(
    (frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      anim.current?.cancel();
      const a = box.current!.animate(frames, opts);
      anim.current = a;
      return a.finished.catch(() => undefined);
    },
    [],
  );
  const cover = useCallback(
    async (label: string) => {
      const c = box.current,
        t = text.current;
      if (!c || !t) return;
      t.textContent = label;
      c.style.transformOrigin = 'bottom';
      covered.current = true;
      await run([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], {
        duration: 550,
        easing: EASE,
        fill: 'both',
      });
    },
    [run],
  );
  const uncover = useCallback(async () => {
    const c = box.current;
    if (!c || !covered.current) return;
    covered.current = false;
    clearTimeout(safety.current);
    // Tunggu halaman baru benar-benar tergambar (2 frame) sebelum tirai turun, supaya tidak ada frame kosong/hitam.
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
    );
    c.style.transformOrigin = 'top';
    // fill "both" (bukan "forwards"): selama delay, tirai harus tetap menutup. Dengan "forwards" tirai sempat lenyap 120ms
    // (kembali ke scaleY(0) dari CSS) lalu muncul lagi, dan itu yang terlihat sebagai kedipan hitam.
    await run([{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], {
      duration: 650,
      delay: 120,
      easing: EASE,
      fill: 'both',
    });
  }, [run]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (
        !(a instanceof HTMLAnchorElement) ||
        (a.target && a.target !== '_self') ||
        a.hasAttribute('download') ||
        a.dataset.noCurtain !== undefined
      )
        return;
      let url: URL;
      try {
        url = new URL(a.href, location.href);
      } catch {
        return;
      }
      if (
        url.origin !== location.origin ||
        url.pathname.startsWith('/api/') ||
        /\.[a-z0-9]+$/i.test(url.pathname)
      )
        return;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (url.pathname === location.pathname) {
        // Tautan nav/footer ke halaman yang sedang dibuka: gulir ke atas (perilaku annona.html). Query/hash berbeda dibiarkan ke Next.
        if (
          url.search === location.search &&
          !url.hash &&
          a.closest('.nav, #menu, .site-footer')
        ) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        }
        return;
      }
      if (reduced) return;
      e.preventDefault(); // Link milik Next melewati navigasinya sendiri bila defaultPrevented; onClick lain (mis. tutup menu) tetap jalan.
      const href = url.pathname + url.search + url.hash;
      if (covered.current) {
        router.push(href);
        return;
      }
      void cover(labelFor(url.pathname)).then(() => {
        router.push(href);
        safety.current = setTimeout(() => {
          void uncover();
        }, 6000);
      });
    };
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clearTimeout(safety.current);
    };
  }, [router, cover, uncover]);

  // Pathname berganti = halaman baru sudah dipasang: turunkan tirai.
  useEffect(() => {
    void uncover();
  }, [path, uncover]);

  return (
    <div id="curtain" ref={box} aria-hidden="true">
      <span ref={text} />
    </div>
  );
}
