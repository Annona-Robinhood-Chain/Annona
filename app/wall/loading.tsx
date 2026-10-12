import { Footer, Header } from "@/components/layout-parts";
import { GridBg } from "@/components/primitives";
import { Skeleton } from "@/components/ui";

// Skeleton memakai kerangka halaman asli (.phead + .split dengan panggung di kiri dan form di kanan) supaya tidak melompat saat data tiba.
export default function Loading() {
  return (
    <>
      <Header overlay />
      <main aria-busy="true">
        <p role="status" className="sr-only">Loading the Wall</p>
        <header className="phead">
          <GridBg />
          <div className="wrap" style={{ display: "grid", gap: 18 }}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-20 w-full max-w-2xl" />
            <Skeleton className="h-5 w-full max-w-prose" />
          </div>
        </header>
        <div className="wrap sec" style={{ paddingTop: 20 }}>
          <div className="split">
            <Skeleton className="h-[26rem] rounded-3xl" />
            <Skeleton className="h-60 rounded-3xl" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
