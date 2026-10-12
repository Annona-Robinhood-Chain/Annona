import type { Metadata } from "next";
import { GardenArt } from "@/components/garden-art";
import { Footer, Header } from "@/components/layout-parts";
import { Appear, PageHead } from "@/components/primitives";
import { ButtonLink } from "@/components/ui";
import { BRAND } from "@/components/brand";

export const metadata: Metadata = { title: `Page not found — ${BRAND}` };

// Dipakai untuk URL yang tidak cocok dengan rute mana pun dan untuk notFound() dari halaman detail. Padanan pNotFound() di annona.html.
export default function NotFound() {
  return (
    <>
      <Header overlay />
      <main>
        <PageHead label="404" title={<>An empty <em>field.</em></>} lead="Nothing grows here. The address may have a typo, or the page may have moved."
          meta={<ButtonLink href="/" magnet arrow>Back home</ButtonLink>} />
        <div className="wrap">
          <div className="sys">
            <Appear variant="scale"><GardenArt variant="bare" className="py-2" /></Appear>
            <p className="note">Followed a link to a Cordon or a vault? It may not be planted yet.</p>
            <Appear className="btns" delay={0.1}>
              <ButtonLink href="/docs" variant="ghost">Docs &amp; Risk</ButtonLink>
              <ButtonLink href="/cordons" variant="ghost">See Cordons</ButtonLink>
            </Appear>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
