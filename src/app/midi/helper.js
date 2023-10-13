import MidiParser from "midi-parser-js";
import * as MidiHelper from "../../utils/midi";
import { scales } from "@/utils/scale";

// https://www.inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies
const getNotes = (keySignature) => {
  const engNotesName = scales[keySignature];
  let notes = [];
  //special cases
  notes[21] = "A0";
  notes[22] = "A#0";
  notes[23] = "B0";
  const STARTING_NOTE_NUMBER = 24;
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
    keySignature
  );
  const bassStaff = parseStaffToMeasures(
    midi.track[1].event,
    quarterNoteTimeDivision,
    keySignature
  );
  console.log("trebleStaff :", trebleStaff);
  console.log("bassStaff :", bassStaff);
  return { trebleStaff, bassStaff };
};

const createNote = (startTime, quarterNoteTimeDivision, realNote, isRest = false) => {
  const note = {
    start: startTime,
    isFinish: false,
    end: 0,
    note: [realNote],
    quarterNoteTimeDivision: quarterNoteTimeDivision,
    durationTime: 0,
    duration: '',
    handleFinishNote(endTime) {
      this.isFinish = true;
      this.end = endTime;
      this.durationTime = this.end - this.start;
      this.duration = getDuration(quarterNoteTimeDivision, this.durationTime, isRest);
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
  keySignature
) => {
  const midiNotes = getNotes(keySignature);
  const measureTime = quarterNoteTimeDivision * 4;
  let notes = [];
  let newNotes = [];
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
        notes.push(createNote(accumulatorDelta, quarterNoteTimeDivision, midiNotes[event.data[0]]));
      } else {
        const noteEquivalent = notes.findIndex(note => 
          note.note[0] === midiNotes[event.data[0]] && note.isFinish === false
        );
        notes[noteEquivalent].handleFinishNote(accumulatorDelta);
      }
    }
  }
  
  // loop over notes to create rest
  for (let i = notes.length - 1; i > 0; i--) {
    const noteB = notes[i];
    const noteA = notes[i-1];
    const diff = noteB.start - noteA.end;
    let duration = getDuration(noteA.quarterNoteTimeDivision, diff, true);
    if (duration.value > 0) {
      let restNote = createNote(noteB.start - duration.value, quarterNoteTimeDivision, "F3", true);
      restNote.handleFinishNote(noteB.start);
      notes.splice(i, 0, restNote);
    }
  }

  // create measures
  let startMeasureTime = 0;
  let endMeasureTime = startMeasureTime + measureTime;
  let staff = [
    [
      []
    ]
  ];
  for (let index = 0; index < notes.length; index++) {
    if (notes[index].start >= endMeasureTime) {
      startMeasureTime += measureTime;
      endMeasureTime += measureTime;
      staff.push([[]]);
    }
    let currentMeasure = staff[staff.length - 1][0];
    if (currentMeasure.length > 0) {
      let lastNote = currentMeasure[currentMeasure.length - 1];
      if (lastNote.start === notes[index].start) {
        if (lastNote.end === notes[index].end) {
          lastNote.note = [...lastNote.note, ...notes[index].note];
        } else {
          if (staff[staff.length - 1].length === 1) {
            staff[staff.length - 1].push([]);
          }
          let secondVoice = staff[staff.length - 1][1];
          if (lastNote.end > notes[index].end) {
            currentMeasure[currentMeasure.length - 1] = notes[index];
            secondVoice.push(lastNote.end);
          } else {
            secondVoice.push(notes[index]);
          }
        }
      } else {
        currentMeasure.push(notes[index]);
      }
    } else {
      currentMeasure.push(notes[index]);
    }
  } 

  console.log("staff ", staff);
  return staff;
};

const prepareMeasureNotes = (measure = [], options, score) => {
  let notes = measure[0];

  const notesMerged = notes.reduce((acc, note) => {
    const simplified = note.getNoteAndDuration();
    const lastNote = acc[acc.length - 1];
    if (lastNote && lastNote.duration === simplified.duration && lastNote.note.length < 4) {
      lastNote.note.push(...simplified.note);
    } else {
      acc.push(simplified);
    }
    return acc;
  }, []);
  console.log(notesMerged);
  return notesMerged.map(noteMerged => {
    const stringifedNotation = noteMerged.note.map(subNote => {
      const noteStringified = subNote.length > 1 ? `(${subNote.join(" ")})` : subNote[0];
      return `${noteStringified}/${noteMerged.duration}`;
    }).join(", ");
    
    const finalNotes = ["8", "16"].includes(noteMerged.duration) && noteMerged.note.length > 1
      ? score.beam(score.notes(stringifedNotation, options))
      : score.notes(stringifedNotation, options);
    
    return finalNotes;
  }).reduce((accu, scoreNotes) => accu.concat(scoreNotes), []);
};


export { parseMidi, parseEventToMeasures, getKeySignature, prepareMeasureNotes };
