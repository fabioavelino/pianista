import MidiParser from "midi-parser-js";
import * as MidiHelper from "../../utils/midi";
import { scales } from "@/utils/scale";

// https://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies
const getNotes = (keySignature) => {
  const engNotesName = scales[keySignature];
  console.log(engNotesName);
  let notes = [];
  //special cases
  notes[21] = "A0";
  notes[22] = "A#0";
  //notes[23] = "B0";
  const STARTING_NOTE_NUMBER = 23;
  for (let i = STARTING_NOTE_NUMBER; i <= 108; i++) {
    let divider = 0;
    let offsetForNotesName = i - STARTING_NOTE_NUMBER;
    if (offsetForNotesName >= engNotesName.length) {
      // example : offset = 30, 30 - STARTING * x = 4 || x = 1
      divider = Math.floor(offsetForNotesName / engNotesName.length);
    }
    const gamme = divider + 1;
    notes[i] =
      engNotesName[offsetForNotesName - engNotesName.length * divider] +
      gamme.toString();
  }
  return notes;
};

const getDuration = (quarterNoteTimeDivision, delta, withRest = false) => {
  const durations = [
    {
      value: quarterNoteTimeDivision * 4 * 1.5,
      durationLetter: withRest ? "w/r." : "w.",
    },
    {
      value: quarterNoteTimeDivision * 4,
      durationLetter: withRest ? "w/r" : "w",
    },
    {
      value: quarterNoteTimeDivision * 2 * 1.5,
      durationLetter: withRest ? "h/r." : "h.",
    },
    {
      value: quarterNoteTimeDivision * 2,
      durationLetter: withRest ? "h/r" : "h",
    },
    {
      value: quarterNoteTimeDivision * 1.5,
      durationLetter: withRest ? "q/r." : "q.",
    },
    {
      value: quarterNoteTimeDivision,
      durationLetter: withRest ? "q/r" : "q",
    },
    {
      value: (quarterNoteTimeDivision / 2) * 1.5,
      durationLetter: withRest ? "8/r." : "8.",
    },
    {
      value: quarterNoteTimeDivision / 2,
      durationLetter: withRest ? "8/r" : "8",
    },
    {
      value: (quarterNoteTimeDivision / 4) * 1.5,
      durationLetter: withRest ? "16/r." : "16.",
    },
    {
      value: quarterNoteTimeDivision / 4,
      durationLetter: withRest ? "16/r" : "16",
    },
    {
      value: 0,
      durationLetter: null,
    },
  ];
  const result = durations.reduce((prev, curr) =>
    Math.abs(curr.value - delta) < Math.abs(prev.value - delta) ? curr : prev
  );
  return result;
};

const parseMidi = (rawMidi) => {
  var midi = MidiParser.parse(rawMidi);
  return midi;
};

const getKeySignature = (midi) => {
  const quarterNoteTimeDivision = midi.timeDivision;
  const measure = quarterNoteTimeDivision * 4;
  const rawTrebleStaff = midi.track[0].event;
  const bassStaff = midi.track[1].event;
  let trebleStaff = [];
  let trebleStaffEvents = [];
  let currentNotesPlayed = [];
  for (let event of rawTrebleStaff) {
    if (event.metaType === MidiHelper.EventMetaType.keySignature) {
      return MidiHelper.getSignature(event.data);
    }
  }
  return "C";
};

const parseEventToMeasures = (midi) => {
  const quarterNoteTimeDivision = midi.timeDivision;
  const keySignature = getKeySignature(midi);
  const trebleStaff = parseStaffToMeasures(
    midi.track[0].event,
    quarterNoteTimeDivision,
    keySignature,
    "treble"
  );
  const bassStaff = parseStaffToMeasures(
    midi.track[1].event,
    quarterNoteTimeDivision,
    keySignature,
    "bass"
  );
  return { trebleStaff, bassStaff };
};

const createNote = (startEvent, startTime, quarterNoteTimeDivision, midiNote, realNote, isRest = false) => {
  const note = {
    startEvent,
    start: startTime,
    isFinish: false,
    end: 0,
    newEnd: 0,
    midiNote: [midiNote],
    note: [realNote],
    quarterNoteTimeDivision: quarterNoteTimeDivision,
    durationTime: 0,
    duration: {},
    handleFinishNote(endEvent, endTime) {
      this.endEvent = endEvent;
      this.isFinish = true;
      this.end = endTime;
      this.durationTime = this.end - this.start;
      this.duration = getDuration(quarterNoteTimeDivision, this.durationTime, isRest);
      this.newEnd = this.start + this.duration.value;
    },
    getNotation() {
      if (this.note.length === 1) {
        return `${this.note[0]}/${this.duration.durationLetter}`;
      }
      return `(${this.note.join(" ")})/${this.duration.durationLetter}`;
    },
    getNoteAndDuration() {
      return {
        note: [this.note],
        midiNote: [this.midiNote],
        duration: this.duration.durationLetter,
        getNotation: () => {
          if (this.note.length === 1) {
            return `${this.note[0]}/${this.duration}`;
          }
          return `(${this.note.join(" ")})/${this.duration}`;
        },
      };
    },
  };

  return note;
};

const parseStaffToMeasures = (
  rawStaff,
  quarterNoteTimeDivision,
  keySignature,
  clef
) => {
  const midiNotes = getNotes(keySignature);
  const measureTime = quarterNoteTimeDivision * 4;
  let notes = [];
  let accumulatorDelta = 0;

  // loop over midi events
  for (let index = 0; index < rawStaff.length; index++) {
    let event = rawStaff[index];
    event.index = index;
    if (event.deltaTime) {
      accumulatorDelta += event.deltaTime
    }
    if (event.type === MidiHelper.EventType.NOTE) {
      if (event.data[1] !== MidiHelper.EventVelocity.OFF) {
        notes.push(createNote(event, accumulatorDelta, quarterNoteTimeDivision, event.data[0], midiNotes[event.data[0]]));
      } else {
        const noteEquivalent = notes.findIndex(note => 
          note.note[0] === midiNotes[event.data[0]] && note.isFinish === false
        );
        notes[noteEquivalent].handleFinishNote(event, accumulatorDelta);
      }
    }
  }

  // separating second voice
  let secondVoiceNotes = [];
  for (let i = notes.length - 1; i > 0; i--) {
    let noteC = i+1 < notes.length - 1 ? notes[i+1] : undefined;
    let noteB = notes[i];
    let noteA = notes[i-1];
    // 2 notes starts at the same time
    if (noteB.start === noteA.start) {
      // case if they are ending at the same time => we merge them
      if (noteB.end === noteA.end) {
        noteA.midiNote = [...noteA.midiNote, ...noteB.midiNote];
        noteA.note = [...noteA.note, ...noteB.note];
        notes.splice(i, 1);
      } else {
        // case if they are not ending => moving it to second voice
        if (noteB.end > noteA.end) {
          secondVoiceNotes.unshift(noteB);
          notes.splice(i, 1);
        }
      }
    } // previous note is longer than it should be (continuing after the current one)
    else if (noteC?.start < noteB.end) {
      secondVoiceNotes.unshift(noteB);
      notes.splice(i, 1);
    // Case if note is a fake one (starts at the same time than the end)
    }
    if (noteB.start === noteB.end) {
      notes.splice(i, 1);
    } 
    if (i === 1 && noteA.start === noteA.end) {
      notes.splice(i-1, 1);
    }
  }

  // create measures
  let startMeasureTime = 0;
  let endMeasureTime = startMeasureTime + measureTime;
  const firstFiltered = secondVoiceNotes.filter(note => note.start >= startMeasureTime && note.end <= endMeasureTime);
  let staff = [
    [
      []
    ]
  ];
  if (firstFiltered.length > 0) staff[0].push(firstFiltered);
  for (let index = 0; index < notes.length; index++) {
    if (notes[index].start >= endMeasureTime) {
      startMeasureTime += measureTime;
      endMeasureTime += measureTime;
      const filtered = secondVoiceNotes.filter(note => note.start >= startMeasureTime && note.end <= endMeasureTime);
      staff.push([[]]);
      if (filtered.length > 0) staff[staff.length - 1].push(filtered);
    }
    let currentMeasure = staff[staff.length - 1][0];
    currentMeasure.push(notes[index]);
  } 

  console.log("staff ", staff);
  return staff;
};

const prepareMeasureNotes = (notes = [], options, score, isSecondVoice) => {
  const clef = options.clef;

  console.log("measure prepared: ", JSON.parse(JSON.stringify(notes)));

  for (let i = notes.length - 1; i >= 0; i--) {
    if (i === notes.length - 1) {
      const note = notes[i];
      const measureTime = note.quarterNoteTimeDivision * 4;
      let endMeasureTime = (Math.floor(note.start / measureTime) + 1) * measureTime;
      let diffEnd = endMeasureTime - note.newEnd;
      let durationEnd = getDuration(note.quarterNoteTimeDivision, diffEnd, true);
        let startRestEnd = note.newEnd;
        let endRestEnd = endMeasureTime;
        if (durationEnd.value > 0) {
          let restNote = createNote(undefined, startRestEnd, note.quarterNoteTimeDivision, -1, clef === "treble" ? "B4" : "D3", true);
          restNote.handleFinishNote(undefined, endRestEnd);
          notes.splice(i + 1, 0, restNote);
        }
    }
    if (i > 0) {
      const noteB = notes[i];
      const noteA = notes[i-1];
      let diff = noteB.start - noteA.end;
      let duration = getDuration(noteA.quarterNoteTimeDivision, diff, true);
      let startRest = noteB.start - duration.value;
      let endRest =  noteB.start;
      if (duration.value > 0) {
        let restNote = createNote(undefined, startRest, noteA.quarterNoteTimeDivision, -1, clef === "treble" ? "B4" : "D3", true);
        restNote.handleFinishNote(undefined, endRest);
        notes.splice(i === notes.length - 1 ? i : i, 0, restNote);
      }
    }
  }
  let firstNote = notes[0];
  const measureTime = firstNote.quarterNoteTimeDivision * 4;
  let beginMeasureTime = (Math.floor(firstNote.end / measureTime)) * measureTime;
  let diff = firstNote.start - beginMeasureTime;
  let duration = getDuration(firstNote.quarterNoteTimeDivision, diff, true);
  if (duration.value > 0) {
    let startRest = beginMeasureTime;
    let endRest =  firstNote.start;
    let restNote = createNote(undefined, startRest, firstNote.quarterNoteTimeDivision, -1, clef === "treble" ? "B4" : "D3", true);
    restNote.handleFinishNote(undefined, endRest);
    notes.splice(0, 0, restNote);
  }
  


  console.log("measure prepared after rest: ", JSON.parse(JSON.stringify(notes)));

  //merging notes with same duration together
  const notesMerged = notes.reduceRight((acc, note) => {
    const simplified = note.getNoteAndDuration();
    const prevNote = acc[0];
    if (prevNote && prevNote.duration === simplified.duration && prevNote.note.length < 2) {
      prevNote.midiNote.unshift(...simplified.midiNote);
      prevNote.note.unshift(...simplified.note);
    } else {
      acc.unshift(simplified);
    }
    return acc;
  }, []);
  
  return notesMerged.map(noteMerged => {

    const stemPosition = noteMerged.midiNote.reduce((acc, subNote) => {
      let tempStepPos = acc;
      subNote.forEach(n => {
        if (clef === "bass") {
          if (n > 53) {
            tempStepPos = false;
          }
        } else {
          if (n < 65) {
            tempStepPos = true;
          } 
        }
        
      })
      return tempStepPos;
    }, clef === "bass") === true ? "up" : "down";

    const stringifedNotation = noteMerged.note.map(subNote => {
      const noteStringified = subNote.length > 1 ? `(${subNote.join(" ")})` : subNote[0];
      const hidden = isSecondVoice && noteMerged.duration.includes("r") ? `[id="hidden"]` : "";
      console.log(`${noteStringified}${hidden}/${noteMerged.duration}`);
      return `${noteStringified}/${noteMerged.duration}${hidden}`;
    }).join(", ");
    
    const finalNotes = ["8", "16"].includes(noteMerged.duration) && noteMerged.note.length > 1
      ? score.beam(score.notes(stringifedNotation, { ...options, stem: stemPosition}))
      : score.notes(stringifedNotation, { ...options, stem: stemPosition});
    
    return finalNotes;
  }).reduce((accu, scoreNotes) => accu.concat(scoreNotes), []);
};

const prepareNotes = (notes = [], options, score, isSecondVoice) => {
  const clef = options.clef;

  console.log("measure prepared: ", JSON.parse(JSON.stringify(notes)));

  for (let i = notes.length - 1; i >= 0; i--) {
    if (i === notes.length - 1) {
      const note = notes[i];
      const measureTime = note.quarterNoteTimeDivision * 4;
      let endMeasureTime = (Math.floor(note.start / measureTime) + 1) * measureTime;
      let diffEnd = endMeasureTime - note.newEnd;
      let durationEnd = getDuration(note.quarterNoteTimeDivision, diffEnd, true);
        let startRestEnd = note.newEnd;
        let endRestEnd = endMeasureTime;
        if (durationEnd.value > 0) {
          let restNote = createNote(undefined, startRestEnd, note.quarterNoteTimeDivision, -1, clef === "treble" ? "B4" : "D3", true);
          restNote.handleFinishNote(undefined, endRestEnd);
          notes.splice(i + 1, 0, restNote);
        }
    }
    if (i > 0) {
      const noteB = notes[i];
      const noteA = notes[i-1];
      let diff = noteB.start - noteA.end;
      let duration = getDuration(noteA.quarterNoteTimeDivision, diff, true);
      let startRest = noteB.start - duration.value;
      let endRest =  noteB.start;
      if (duration.value > 0) {
        let restNote = createNote(undefined, startRest, noteA.quarterNoteTimeDivision, -1, clef === "treble" ? "B4" : "D3", true);
        restNote.handleFinishNote(undefined, endRest);
        notes.splice(i === notes.length - 1 ? i : i, 0, restNote);
      }
    }
  }
  let firstNote = notes[0];
  const measureTime = firstNote.quarterNoteTimeDivision * 4;
  let beginMeasureTime = (Math.floor(firstNote.end / measureTime)) * measureTime;
  let diff = firstNote.start - beginMeasureTime;
  let duration = getDuration(firstNote.quarterNoteTimeDivision, diff, true);
  if (duration.value > 0) {
    let startRest = beginMeasureTime;
    let endRest =  firstNote.start;
    let restNote = createNote(undefined, startRest, firstNote.quarterNoteTimeDivision, -1, clef === "treble" ? "B4" : "D3", true);
    restNote.handleFinishNote(undefined, endRest);
    notes.splice(0, 0, restNote);
  }
  


  console.log("measure prepared after rest: ", JSON.parse(JSON.stringify(notes)));

  //merging notes with same duration together
  const notesMerged = notes.reduceRight((acc, note) => {
    const simplified = note.getNoteAndDuration();
    const prevNote = acc[0];
    if (prevNote && prevNote.duration === simplified.duration && prevNote.note.length < 2) {
      prevNote.midiNote.unshift(...simplified.midiNote);
      prevNote.note.unshift(...simplified.note);
    } else {
      acc.unshift(simplified);
    }
    return acc;
  }, []);
  
  return notesMerged.map(noteMerged => {

    const stemPosition = noteMerged.midiNote.reduce((acc, subNote) => {
      let tempStepPos = acc;
      subNote.forEach(n => {
        if (clef === "bass") {
          if (n > 53) {
            tempStepPos = false;
          }
        } else {
          if (n < 65) {
            tempStepPos = true;
          } 
        }
        
      })
      return tempStepPos;
    }, clef === "bass") === true ? "up" : "down";

    const stringifedNotation = noteMerged.note.map(subNote => {
      const noteStringified = subNote.length > 1 ? `(${subNote.join(" ")})` : subNote[0];
      const hidden = isSecondVoice && noteMerged.duration.includes("r") ? `[id="hidden"]` : "";
      console.log(`${noteStringified}${hidden}/${noteMerged.duration}`);
      return `${noteStringified}/${noteMerged.duration}${hidden}`;
    }).join(", ");
    
    const finalNotes = ["8", "16"].includes(noteMerged.duration) && noteMerged.note.length > 1
      ? score.beam(score.notes(stringifedNotation, { ...options, stem: stemPosition}))
      : score.notes(stringifedNotation, { ...options, stem: stemPosition});
    
    return finalNotes;
  })
};


export { parseMidi, parseEventToMeasures, getKeySignature, prepareMeasureNotes, prepareNotes };
