"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { GardenArt } from "@/components/garden-art";
import { Footer, Header } from "@/components/layout-parts";
import { Appear, PageHead } from "@/components/primitives";
import { Button, ButtonLink } from "@/components/ui";

// Menangkap error render di dalam layout. Error di layout akar ditangani global-error.tsx.
export default function GardenError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // Pelaporan ke layanan error (Sentry) menyusul di Fase 5 item 2.
  useEffect(() => { console.error(error); }, [error]);

  // refresh() mengambil ulang bagian server; reset() merender ulang batas error.
  function retry() { start(() => { router.refresh(); reset(); }); }

  return (
    <>
      <Header overlay />
      <main>
        <PageHead label="Error" title={<>A branch <em>came down.</em></>}
          lead="Something broke while loading this page. That is on our side. Try again in a moment."
          meta={error.digest ? <span className="tag">Reference: {error.digest}</span> : undefined} />
        <div className="wrap">
          <div className="sys" role="alert">
            <Appear variant="scale"><GardenArt variant="cut" className="py-2" /></Appear>
            <Appear className="btns" delay={0.1}>
              <Button type="button" onClick={retry} disabled={pending}>{pending ? "Trying again…" : "Try again"}</Button>
              <ButtonLink href="/" variant="ghost">Back to the garden</ButtonLink>
            </Appear>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
