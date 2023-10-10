export const EventMetaType = {
    tempo: 81, // donnée en microseconds, 500'000 = 120BPM
    keySignature: 89
}

export const EventType = {
    NOTE: 9
}

export const EventVelocity = {
    ON: 127,
    OFF: 0
}

//https://midiprog.com/midi-key-signature/
export const getSignature = (value) => {
    const majorSignature = ["Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#"]
    const minorSignature = ["Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#"]
    const hex = value.toString(16);
    const signatureHex = hex.substring(0, 2);
    const isMajor = hex.substring(2, 4) == "00";
    // convert to int value
    let a = parseInt(signatureHex, 16);
    if ((a & 0x80) > 0) {
        a = a - 0x100;
    }
    const signatureIndex = a + 7 //offset for tabs above
    if (isMajor) {
        return majorSignature[signatureIndex];
    };
    return minorSignature[signatureIndex];
}

export const getTempo = (msPerQuarterNote) => {
    // http://midi.teragonaudio.com/tech/midifile/ppqn.htm
    return Math.floor(60000000 / msPerQuarterNote);
}