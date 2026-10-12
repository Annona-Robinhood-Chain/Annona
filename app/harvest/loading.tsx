import { Footer, Header } from "@/components/layout-parts";
import { GridBg } from "@/components/primitives";
import { Skeleton } from "@/components/ui";

// Skeleton memakai kerangka yang sama dengan halaman asli (header .phead + Header overlay) supaya tidak melompat saat data tiba.
export default function Loading() {
  return (
    <>
      <Header overlay />
      <main aria-busy="true">
        <p role="status" className="sr-only">Loading the current round</p>
        <header className="phead">
          <GridBg />
          <div className="wrap" style={{ display: "grid", gap: 18 }}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full max-w-2xl" />
            <Skeleton className="h-5 w-full max-w-prose" />
          </div>
        </header>
        <div className="wrap sec">
          <div className="grid2">
            <div style={{ display: "grid", gap: 14 }}><Skeleton className="h-4 w-28" /><Skeleton className="h-14 w-full max-w-md" /><Skeleton className="h-5 w-full max-w-sm" /></div>
            <Skeleton className="h-28 rounded-3xl" />
          </div>
        </div>
        <div className="wrap sec">
          <div className="grid2"><Skeleton className="h-96 rounded-3xl" /><Skeleton className="h-96 rounded-3xl" /></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
