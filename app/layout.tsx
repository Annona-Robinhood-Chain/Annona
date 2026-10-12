import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/components/providers';
import { Shell } from '@/components/shell';
import { SkipLink } from '@/components/skip-link';
import { web3Env } from '@/lib/web3/env';
import './globals.css';

// Cormorant (judul/display Annona) dimuat lewat @font-face di app/globals.css (bukan next/font; lihat komentar di sana).
const inter = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
});
const jetbrains = localFont({
  src: './fonts/jetbrains-mono-latin-wght-normal.woff2',
  variable: '--font-jetbrains',
  weight: '100 800',
  display: 'swap',
  preload: false,
});

// URL situs salah ketik tidak boleh menjatuhkan seluruh situs: kembali ke localhost.
function siteBase() {
  try {
    return new URL(web3Env.siteUrl);
  } catch {
    return new URL('http://localhost:3000');
  }
}

export const metadata: Metadata = {
  // metadataBase: tanpa ini URL gambar OG tidak absolut (platform sosial menolaknya). Sama dengan domain situs.
  metadataBase: siteBase(),
  title: 'Annona — Bind stocks. Reap on Fridays.',
  description:
    'Disciplined baskets and weekly covered-call vaults for Stock Tokens.',
  applicationName: 'Annona',
  openGraph: { siteName: 'Annona', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

// Warna bilah alamat/status browser mengikuti tema sistem (krem hangat terang, ink gelap). Bila pengguna memilih tema lewat toggle,
// theme-toggle.tsx dan skrip <head> memperbarui meta ini (media-query tidak bisa tahu pilihan manual).
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3ECDF' },
    { media: '(prefers-color-scheme: dark)', color: '#14110F' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'var h=document.documentElement;h.classList.add("js");try{var t=localStorage.getItem("theme");if(t)h.dataset.theme=t}catch(e){}try{if(sessionStorage.getItem("loaded")||matchMedia("(prefers-reduced-motion: reduce)").matches)h.classList.add("no-loader")}catch(e){}',
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <SkipLink />
        <Shell />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
