'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BRAND } from './brand';
import { MarketChip } from './header-market';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
import { WalletButton } from './wallet-button';

// Nav, menu layar penuh, dan footer bergaya Annona (Fase 1). Setiap halaman memanggil <Header /> dan <Footer /> sendiri.
// Rute dan label produk tidak berubah (K5). Tautan akun diisi lewat env: NEXT_PUBLIC_X_URL, NEXT_PUBLIC_GITHUB_URL (opsional).
const links: [string, string][] = [
  ['/cordons', 'Cordons'],
  ['/vaults', 'Spurs & Grafts'],
  ['/harvest', 'Harvest'],
  ['/wall', 'The Wall'],
  ['/docs', 'Docs'],
];
const menuLinks: [string, string][] = [['/', 'Home'], ...links.slice(0, 4), ['/docs', 'Docs & Risk']];
const X_URL = process.env.NEXT_PUBLIC_X_URL || 'https://x.com/';
const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || '';
const xPath = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';

// overlay: halaman yang sudah punya header sendiri dengan padding atas (phead, Fase 4+) tidak perlu spacer.
export function Header({ overlay = false }: { overlay?: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  // Nav solid + blur setelah 40px; sembunyi saat gulir turun (di atas 300px), muncul lagi saat gulir naik.
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    let last = scrollY, queued = false;
    const run = () => {
      queued = false;
      const y = scrollY;
      el.classList.toggle('solid', y > 40);
      if (!document.body.classList.contains('menu-open')) el.classList.toggle('hide', y > last && y > 300);
      last = y;
    };
    const on = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
    run();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);

  // Menu terbuka: kunci gulir (body.lock), nav tetap terlihat, ESC menutup, melebarkan layar ke desktop menutup menu.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('menu-open', 'lock');
    nav.current?.classList.remove('hide');
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    const mq = matchMedia('(min-width: 1000px)');
    const wide = () => { if (mq.matches) setOpen(false); };
    addEventListener('keydown', key);
    mq.addEventListener('change', wide);
    return () => {
      document.body.classList.remove('menu-open', 'lock');
      removeEventListener('keydown', key);
      mq.removeEventListener('change', wide);
    };
  }, [open]);

  const isCurrent = (href: string) => path === href || path.startsWith(href + '/');
  return (
    <>
      <header ref={nav} className="nav" id="nav">
        <div className="wrap">
          <Link className="brand" href="/" aria-label={`${BRAND} home`} onClick={() => setOpen(false)}>
            <Logo />
            {BRAND}
          </Link>
          <nav className="links" aria-label="Primary">
            {links.map(([href, label]) => (
              <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined} className={isCurrent(href) ? 'on' : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-r">
            <a className="icon-btn hide-sm" href={X_URL} target="_blank" rel="noopener noreferrer" aria-label={`${BRAND} on X (opens in a new tab)`}>
              <svg aria-hidden viewBox="0 0 24 24" fill="currentColor"><path d={xPath} /></svg>
            </a>
            <ThemeToggle />
            <WalletButton className="mag hide-sm" />
            <button ref={btn} type="button" className="menu-btn" id="menuBtn" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>
              <span className="bars" aria-hidden><i /><i /></span>
              Menu
            </button>
          </div>
        </div>
      </header>
      {/* Menu di luar <header>: transform pada .nav (saat disembunyikan) akan memutus position:fixed anaknya. */}
      <div id="menu" role="dialog" aria-label="Menu" aria-hidden={!open} inert={!open}>
        <nav aria-label="Menu">
          {menuLinks.map(([href, label], i) => (
            <Link key={href + label} href={href} onClick={() => setOpen(false)} style={{ transitionDelay: `${0.15 + i * 0.05}s` }}>
              <small>{String(i).padStart(2, '0')}</small>
              {label}
            </Link>
          ))}
        </nav>
        <div className="mfoot">
          <WalletButton />
          <Link href="/terms" onClick={() => setOpen(false)}>Terms</Link>
          <Link href="/privacy" onClick={() => setOpen(false)}>Privacy</Link>
          <Link href="/restricted" onClick={() => setOpen(false)}>Where {BRAND} is restricted</Link>
          <a href={X_URL} target="_blank" rel="noopener noreferrer">Follow on X</a>
        </div>
      </div>
      {!overlay && <div className="nav-spacer" aria-hidden />}
    </>
  );
}

// Jam New York di kolom Status. Server tidak tahu jam: snapshot server null, jadi tampil "NY —" sampai hidrasi lalu berdetak tiap detik.
const nyFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const tickEverySecond = (cb: () => void) => { const id = setInterval(cb, 1000); return () => clearInterval(id); };
function NyClock() {
  const t = useSyncExternalStore(tickEverySecond, () => nyFmt.format(new Date()), () => null);
  return <div className="fnote">{t ? `NY ${t} ET` : 'NY —'}</div>;
}

// Wordmark besar yang terisi gradien seiring gulir (--wp). Ukuran font = 144vw / jumlah huruf merek (24vw untuk "Annona").
function Wordmark() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.style.setProperty('--wp', '100%'); return; }
    let queued = false;
    const run = () => {
      queued = false;
      const vh = innerHeight, r = el.getBoundingClientRect();
      el.style.setProperty('--wp', `${Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh * 0.4))) * 100}%`);
    };
    const on = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
    run();
    addEventListener('scroll', on, { passive: true });
    addEventListener('resize', on);
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, []);
  return <div ref={ref} className="wordmark" aria-hidden style={{ '--n': BRAND.length } as React.CSSProperties}>{BRAND}</div>;
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="fgrid">
          <div className="fbrand">
            <Link className="brand" href="/">{BRAND}</Link>
            <p>Bind stocks. Reap on Fridays. Spurs cap your upside. That is the trade. Stock Tokens carry risk of loss.</p>
          </div>
          <div>
            <h4>Explore</h4>
            {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
          </div>
          <div>
            <h4>Legal</h4>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/restricted">Where {BRAND} is restricted</Link>
          </div>
          <div>
            <h4>Follow</h4>
            <a href={X_URL} target="_blank" rel="noopener noreferrer" aria-label={`${BRAND} on X (opens in a new tab)`}>X</a>
            {GITHUB_URL && <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub (opens in a new tab)">GitHub</a>}
          </div>
          <div>
            <h4>Status</h4>
            <span className="building"><i />Building in public</span>
            <NyClock />
            <MarketChip />
          </div>
        </div>
        <Wordmark />
        <div className="fbottom">
          <span>© 2026 {BRAND}</span>
          <span>Not offered to US persons. Other regions are restricted.</span>
        </div>
      </div>
    </footer>
  );
}
