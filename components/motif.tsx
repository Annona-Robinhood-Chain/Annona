import { Appear } from "./primitives";
import { SheafPaths } from "./sheaf-art";

// Latar kisi dekoratif (.gridbg di globals.css, padanan .gridbg annona.html). Nama TrellisBackground dipertahankan supaya pemakai lama tidak berubah.
export function TrellisBackground({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`gridbg ${className}`} />;
}

// Pemisah seksi: garis tipis yang tergambar dari tengah, dengan satu berkas kecil beraksen oranye di tengahnya.
export function CordonDivider() {
  return (
    <Appear className="my-2">
      <svg role="separator" viewBox="0 0 1180 48" className="block h-auto w-full" aria-hidden fill="none">
        <g className="sheaf-grow" stroke="var(--fg-3)" strokeWidth={1} strokeLinecap="round">
          <path d="M556 38H0" style={{ "--len": 560, "--dl": "0s" } as React.CSSProperties} opacity={0.5} />
          <path d="M624 38H1180" style={{ "--len": 560, "--dl": "0s" } as React.CSSProperties} opacity={0.5} />
        </g>
        <g className="sheaf-grow" strokeLinecap="round" strokeLinejoin="round">
          <SheafPaths cx={590} baseY={42} h={34} n={5} stroke="var(--fg)" sw={1} animate />
        </g>
      </svg>
    </Appear>
  );
}
