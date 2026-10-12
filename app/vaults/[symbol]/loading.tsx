import { Footer, Header } from "@/components/layout-parts";
import { GridBg } from "@/components/primitives";
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <>
      <Header overlay />
      <main aria-busy="true">
        <p role="status" className="sr-only">Loading vault</p>
        <header className="phead">
          <GridBg />
          <div className="wrap" style={{ display: "grid", gap: 18 }}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full max-w-md" />
            <Skeleton className="h-12 w-56" />
          </div>
        </header>
        <div className="wrap">
          <div className="split" style={{ paddingTop: 60 }}>
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
