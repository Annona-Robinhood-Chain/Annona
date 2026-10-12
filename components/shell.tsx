import { CustomCursor } from "./custom-cursor";
import { Loader } from "./loader";
import { PageCurtain } from "./page-curtain";
import { ScrollProgress } from "./scroll-progress";
import { ToastHost } from "./toast";

// Lapisan global di semua halaman (Fase 1): loader, tirai transisi, progres gulir, kursor, toast. Dipasang sekali di app/layout.tsx.
export function Shell() {
  return (
    <>
      <Loader />
      <PageCurtain />
      <ScrollProgress />
      <CustomCursor />
      <ToastHost />
    </>
  );
}
