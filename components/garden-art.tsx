import { useId } from "react";
import { SheafPaths, SunDisc } from "./sheaf-art";

// Ilustrasi garis untuk halaman sistem (404 dan error): cakram matahari + cincin + berkas. Dekoratif (aria-hidden).
// "bare": satu tangkai tanpa bulir; lingkaran putus-putus menandai bulir yang tidak ada (404).
// "cut": berkas dengan satu tangkai patah dan satu helai jatuh (error).
export function GardenArt({ variant, className = "" }: { variant: "bare" | "cut"; className?: string }) {
  const id = "ga" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg aria-hidden viewBox="0 0 320 200" className={`mx-auto h-auto w-full max-w-xs ${className}`} fill="none">
      <SunDisc cx={206} cy={84} r={52} id={id} hatch="var(--bg)" />
      <g className="ill-spin" style={{ transformOrigin: "206px 84px" }}>
        <circle cx={206} cy={84} r={72} stroke="var(--fg)" strokeOpacity={0.2} strokeDasharray="1 6" />
        <circle cx={278} cy={84} r={3} fill="var(--wheat)" />
      </g>
      <g stroke="var(--fg)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 188H290" strokeOpacity={0.35} />
        {variant === "bare" ? (
          <>
            <path d="M120 188 Q121 120 118 44" />
            <path d="M118 44 q-6 10 -2 16 M118 44 q6 10 2 16" opacity={0.6} />
            <circle cx={118} cy={30} r={8} strokeDasharray="3 4" strokeWidth={1} />
            <path d="M100 188 q6 -22 -4 -40 M140 188 q-6 -22 4 -40" opacity={0.45} />
          </>
        ) : (
          <>
            <SheafPaths cx={120} baseY={186} h={120} n={5} stroke="var(--fg)" sw={1.2} />
            <path d="M190 178 l56 -14" strokeWidth={1.6} />
            <path d="M208 173 l3 -11 M224 169 l4 10" strokeWidth={1} />
            <path d="M246 164 l-6 -8" strokeWidth={1.6} strokeDasharray="2 4" />
          </>
        )}
      </g>
    </svg>
  );
}
