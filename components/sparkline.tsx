// Garis tren kecil untuk kartu daftar (espalier.html: ".spark"). Server component, SVG polos.
// Bukan grafik yang bisa dibaca angkanya: ringkasan arah, dengan label teks untuk pembaca layar.
const W = 120, H = 36, PAD = 3;

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return <span className="font-mono text-[1.05rem]">—<span className="sr-only"> not enough history yet</span></span>;
  const mn = Math.min(...values), mx = Math.max(...values), span = mx - mn || 1;
  const x = (i: number) => PAD + (i / (values.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - mn) / span) * (H - PAD * 2);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const last = values.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-9 w-[120px]">
      <path d={d} fill="none" stroke="var(--sun)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(last)} cy={y(values[last])} r="3" fill="var(--wheat)" stroke="var(--sun)" strokeWidth="1" />
    </svg>
  );
}

// Grafik tren lebar untuk kartu daftar (.trend di annona.html): area tipis + garis oranye yang tergambar saat kartu muncul.
// Server component; animasinya CSS (`.in` dari kartu induk). Nilai < 2 titik: pakai <ChartEmpty> di pemanggil.
export function TrendChart({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const W = 400, H = 120, PX = 8, PY = 14;
  const mn = Math.min(...values), mx = Math.max(...values), span = mx - mn || 1;
  const x = (i: number) => PX + (i / (values.length - 1)) * (W - PX * 2);
  const y = (v: number) => H - PY - ((v - mn) / span) * (H - PY * 2);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const area = `${d}L${x(values.length - 1).toFixed(1)} ${H}L${x(0).toFixed(1)} ${H}Z`;
  return (
    <div className="trend" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={area} fill="var(--sun)" fillOpacity=".12" />
        <path className="ln" pathLength={1} d={d} fill="none" stroke="var(--sun)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}
