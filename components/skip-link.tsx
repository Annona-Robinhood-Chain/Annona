"use client";

// Tautan "Skip to content" untuk pengguna keyboard: nav tetap berisi banyak tautan di setiap halaman.
// Tidak butuh id di tiap <main>: tautan memindahkan fokus ke elemen <main> pertama (diberi tabindex -1 sementara).
export function SkipLink() {
  return (
    <a
      href="#main"
      className="skip"
      onClick={(e) => {
        const main = document.querySelector<HTMLElement>("main");
        if (!main) return;
        e.preventDefault();
        main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: false });
        main.addEventListener("blur", () => main.removeAttribute("tabindex"), { once: true });
      }}
    >
      Skip to content
    </a>
  );
}
