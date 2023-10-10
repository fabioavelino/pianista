import { useEffect, useState } from "react";
import "./overlay.css";
import Control from "./Control";

const notes = ["do", "ré", "mi", "fa", "sol", "la", "si", "do", "ré", "mi", "fa", "sol", "la", "si", "do", "ré", "mi", "fa", "sol", "la", "si"].reverse();

export default function Overlay() {
  let start = { x: 0, y: 0 };
  const [positionX, setPositionX] = useState(20);
  const [positionY, setPositionY] = useState(20);
  const [fontSize, setFontSize] = useState(6);
  const [lineHeight, setLineHeight] = useState(2.2);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const storedFontSize = localStorage.getItem("fontSize");
    if (storedFontSize !== null) {
      setFontSize(parseFloat(storedFontSize));
    }
    const storedLineHeight = localStorage.getItem("lineHeight");
    if (storedLineHeight !== null) {
      setLineHeight(parseFloat(storedLineHeight));
    }
    const storedOpacity = localStorage.getItem("opacity");
    if (storedOpacity !== null) {
      setOpacity(parseFloat(storedOpacity));
    }
  });

  const setAndSaveFontSize = (newVal) => {
    localStorage.setItem("fontSize", newVal);
    setFontSize(newVal);
  }

  const setAndSaveLineHeight = (newVal) => {
    localStorage.setItem("lineHeight", newVal);
    setLineHeight(newVal);
  }

  const setAndSaveOpacity = (newVal) => {
    localStorage.setItem("opacity", newVal);
    setOpacity(newVal);
  }

  const handleOnPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    //Mouse position at startup
    start.x = e.clientX;
    start.y = e.clientY;
    //Listening on documement
    document.documentElement.style.overflowY = "hidden";
    document.documentElement.style.touchAction = "none";
    //document.documentElement.style.height = "100%";
    //document.documentElement.style.position = "fixed";
    document.onpointerup = releaseEvents;
    document.onpointermove = handleOnPointerMove;
  };

  const releaseEvents = () => {
    document.documentElement.style.overflowY = "unset";
    document.documentElement.style.touchAction = "auto";
    //document.documentElement.style.height = "unset";
    //document.documentElement.style.position = "unset";
    document.onpointerup = null;
    document.onpointermove = null;
  };

  const handleOnPointerMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPositionX(positionX + e.clientX - start.x);
    setPositionY(positionY + e.clientY - start.y);
  };

  return (
    <>
      <div
        onPointerDown={handleOnPointerDown}
        style={{ left: positionX, top: positionY, opacity }}
        id="staff"
      >
        {notes.map((note, index) => (
          <div className="pointer-events-none select-none" key={note + index} id="note">
            <p
              className="pointer-events-none select-none"
              style={{
                fontSize: fontSize + "px",
                lineHeight: lineHeight + "px",
              }}
            >
              {note}
            </p>
          </div>
        ))}
      </div>
      <Control
        setPositionX={(v) => setPositionX(positionX + v)}
        setPositionY={(v) => setPositionY(positionY + v)}
        setFontSize={(v) => setAndSaveFontSize(fontSize + v)}
        setLineHeight={(v) => setAndSaveLineHeight(lineHeight + v)}
        setOpacity={(v) => {
          if (opacity + v > 1) { return }
          setAndSaveOpacity(opacity + v)
        }}
      />
    </>
  );
}
