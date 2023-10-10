"use client";

import { useState } from "react";
import ImageSelector from "./ImageSelector";
import Overlay from "../components/Overlay";
import Library from "./Library";

export default function Home() {
  const [currentImage, setCurrentImage] = useState(null);

  return (
    <main className="flex items-center content-center justify-center p-4">
      <Library />
      {currentImage ? (
        <>
          <Overlay />
          <img id="music-sheet" src={currentImage} />
        </>
      ) : (
        <ImageSelector setCurrentImage={setCurrentImage} />
      )}
    </main>
  );
}
