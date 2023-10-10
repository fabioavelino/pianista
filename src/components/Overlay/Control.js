import { useEffect, useState } from "react";

function Button({ children, id, onClick }) {
  return (
    <button onClick={onClick} id={id} className="button-control">
      {children}
    </button>
  );
}

const BASE_SIZE = 50;

export default function Control({setPositionX, setPositionY, setFontSize, setLineHeight, setOpacity}) {
  const [positionControlX, setPositionControlX] = useState(0);
  const [positionControlY, setPositionControlY] = useState(0);
  const [scale, setScale] = useState(1);

  const setPositionControl = () => {
    setPositionControlX(window.visualViewport.offsetLeft);
    setPositionControlY(
      window.innerHeight -
        (window.visualViewport.height + window.visualViewport.offsetTop)
    );
    setScale(window.visualViewport.scale);
  };

  useEffect(() => {
    window.visualViewport.addEventListener("scroll", setPositionControl);
    window.visualViewport.addEventListener("resize", setPositionControl);

    return () => {
      window.visualViewport.removeEventListener("scroll", setPositionControl);
      window.visualViewport.removeEventListener("resize", setPositionControl);
    };
  });

  const calcSize = Math.floor(BASE_SIZE / scale);

  return (
    <div
        className="flex flex-row items-center content-center justify-center"
      style={{ left: positionControlX, bottom: positionControlY, fontSize: calcSize + "px", lineHeight: calcSize + "px" }}
      id="control"
    >
      <div style={{marginRight:calcSize + "px" }} className="four-control">
        <Button id="up" onClick={() => setPositionY(-1)}>⬆️</Button>
        <Button id="down" onClick={() => setPositionY(+1)}>⬇️</Button>
        <Button id="left" onClick={() => setPositionX(-1)}>⬅️</Button>
        <Button id="right" onClick={() => setPositionX(+1)}>➡️</Button>
      </div>
      <div style={{marginRight:calcSize + "px" }} className="two-control">
        <Button id="up" onClick={() => setFontSize(+0.1)}>⬆️</Button>
        <Button id="down" onClick={() => setFontSize(-0.1)}>⬇️</Button>
      </div>
      <div style={{marginRight:calcSize + "px" }} className="two-control">
        <Button id="up" onClick={() => setLineHeight(+0.1)}>⬆️</Button>
        <Button id="down" onClick={() => setLineHeight(-0.1)}>⬇️</Button>
      </div>
      <div style={{marginRight:calcSize + "px" }} className="two-control">
        <Button id="up" onClick={() => setOpacity(+0.1)}>⬆️</Button>
        <Button id="down" onClick={() => setOpacity(-0.1)}>⬇️</Button>
      </div>
    </div>
  );
}
