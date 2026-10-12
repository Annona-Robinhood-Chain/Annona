import { FillList } from "./primitives";

export type TimelineStep = { when: string; title: string; text: string };

// Linimasa bernomor gaya Annona (.timeline, Fase 6.3): garis vertikal yang terisi oranye saat digulir, satu lingkaran bernomor per langkah
// (menyala saat langkah itu terlewati). Selalu vertikal seperti di annona.html; `horizontal` hanya diterima agar pemanggil lama
// (kode lama) tetap valid, tidak lagi mengubah tata letak. Halaman Harvest (Fase 7) sudah memanggilnya tanpa `horizontal`.
export function Timeline({ steps, className = "" }: { steps: TimelineStep[]; horizontal?: boolean; className?: string }) {
  return (
    <FillList className={`timeline${className ? ` ${className}` : ""}`}>
      {steps.map((st, i) => (
        <li key={st.title}>
          <span className="dotn" aria-hidden="true">{i + 1}</span>
          <span className="when">{st.when}</span>
          <b>{st.title}</b>
          <p>{st.text}</p>
        </li>
      ))}
    </FillList>
  );
}
