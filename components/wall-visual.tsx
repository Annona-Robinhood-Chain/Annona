"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import type { TreeInput } from "@/lib/tree";
import { GardenTree } from "./garden-tree";
import { Tabs } from "./tabs";

// Panggung visual The Wall: mosaic (bawaan, dirender server) atau sheaf 3D/SVG dari data yang sama. Tab hanya ada bila Wall punya posisi;
// selain itu hanya mosaic pratinjau.
const VIEWS = ["mosaic", "sheaf"] as const;
export function WallVisual({ mosaic, tree }: { mosaic: ReactNode; tree?: TreeInput }) {
  const [view, setView] = useState<(typeof VIEWS)[number]>("mosaic");
  if (!tree) return <>{mosaic}</>;
  return (
    <>
      <div className="wall-view"><Tabs value={view} options={VIEWS} onChange={setView} label="Garden view" capitalize /></div>
      {view === "mosaic" ? mosaic : <div className="wall-sheaf"><GardenTree input={tree} className="w-full max-w-md" /></div>}
    </>
  );
}
