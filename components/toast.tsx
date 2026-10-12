"use client";
import { useEffect, useState } from "react";

// Toast global (#toast di annona.html). Panggil toast("...") dari komponen klien mana pun; <ToastHost /> dipasang sekali di layout.
const EVT = "app:toast";
export function toast(msg: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<string>(EVT, { detail: msg }));
}
export function ToastHost() {
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);
  useEffect(() => {
    let h: ReturnType<typeof setTimeout> | undefined;
    const fn = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      setOn(true);
      clearTimeout(h);
      h = setTimeout(() => setOn(false), 2800);
    };
    window.addEventListener(EVT, fn);
    return () => { window.removeEventListener(EVT, fn); clearTimeout(h); };
  }, []);
  return <div id="toast" role="status" aria-live="polite" className={on ? "on" : undefined}>{msg}</div>;
}
