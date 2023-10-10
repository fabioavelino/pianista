"use client"
import { useState } from "react";
import SheetsLibrary, { getSheetById } from "../../../sheets";

export default function Page({ params }) {
  const currentMusic = getSheetById(params.id);
  const [currentSheet, SetCurrentSheet] = useState(0);
  const img = currentMusic.sheets[currentSheet];

  return (<main className="flex items-center content-center justify-center p-4">
    <div>My sheet: {}</div>
    <img id="music-sheet" src={img.src} />
    </main>)
}