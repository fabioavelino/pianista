// Major scales : Root + WS + WS + HS + WS + WS + WS + HS
const originalScale = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ]

const scales = {
    Cb: ["Cb", "Db", "Eb", "Fb", "Gb", "Ab", "Bb"],
    Gb: ["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "Fb"],
    Db: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
    Ab: [
        "C",
        "D",
        "Eb",
        "E",
        "Fb",
        "F",
        "Gb",
        "G",
        "A",
        "Bb",
        "B",
        "Cb",
      ],
    Eb: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
    Bb: ["Bb", "C", "D", "Eb", "F", "G", "A"],
    F: ["F", "G", "A", "Bb", "C", "D", "E"],
    C: ["C", "D", "E", "F", "G", "A", "B"],
    G: ["G", "A", "B", "C", "D", "E", "F#"],
    D: ["D", "E", "F#", "G", "A", "B", "C#"],
    A: ["A", "B", "C#", "D", "E", "F#", "G#"],
    E: ["E", "F#", "G#", "A", "B", "C#", "D#"],
    B: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
    //"F#":
    //"C#":
}

export { scales }