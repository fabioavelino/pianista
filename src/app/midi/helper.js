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

const createNote = (event, accumulatorDelta, quarterNoteTimeDivision, midiNotes) => {
  let note = {
    startEvent: event,
    start: accumulatorDelta,
    isFinish: false
  }
  let handleFinishNote = (finishEvent, finishAccumulatorDelta) => {
    note.endEvent = finishEvent;
    note.isFinish = true;
    note.end = finishAccumulatorDelta;
    note.durationTime = note.end - note.start;
    note.note = [midiNotes[finishEvent.data[0]]];
    const estimatedDuration = getDuration(
      quarterNoteTimeDivision,
      note.durationTime,
      false
    );
    note.duration = estimatedDuration;
  }
  let getNotation = () => {
    if (note.note.length === 1) {
      return `${note.note[0]}/${note.duration.durationLetter}`
    }
    return `(${note.note.join(" ")})/${note.duration.durationLetter}`;
  }
  let getNoteAndDuration = () => {
    let simplifedNote = {
      note: [note.note],
      duration: note.duration.durationLetter
    };
    let getNotation = () => { if (simplifedNote.note.length === 1) {
      return `${simplifedNote.note[0]}/${note.duration}`
    }
    return `(${simplifedNote.note.join(" ")})/${note.duration}`;}
    simplifedNote.getNotation = getNotation;
    return simplifedNote;
  }
  note.handleFinishNote = handleFinishNote;
  note.getNotation = getNotation;
  note.getNoteAndDuration = getNoteAndDuration;
  return note;
}

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
        notes.push(createNote(event, accumulatorDelta, quarterNoteTimeDivision, midiNotes));
      } else {
        const noteEquivalent = notes.findIndex(note => 
          note.startEvent.data[0] === event.data[0] && note.isFinish === false
        );
        notes[noteEquivalent].handleFinishNote(event, accumulatorDelta);
      }
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
  const notes = measure[0];
  let notesMerged = [];
  for (let note of notes) {
    let simplified = note.getNoteAndDuration();
    if (notesMerged.length === 0) {
      notesMerged.push(simplified);
    } else {
      let lastNote = notesMerged[notesMerged.length - 1];
      if (lastNote.duration === simplified.duration && lastNote.note.length < 4) {
        lastNote.note = [...lastNote.note, ...simplified.note];
      } else {
        notesMerged.push(simplified);
      }
    }
  }
  notesMerged = notesMerged.map(noteMerged => {
      const stringifedNotation = noteMerged.note.reduce((accu, subNote, index) => {
        let noteStringified = subNote[0];
        if (subNote.length > 1) {
          noteStringified = `(${subNote.join(" ")})`;
        }
        if (index === 0) {
          return `${noteStringified}/${noteMerged.duration}`;
        }
        return `${accu}, ${noteStringified}/${noteMerged.duration}`;
      }, "");
    console.log(stringifedNotation);
    if (["8", "16"].includes(noteMerged.duration)) {
      return score.beam(score.notes(stringifedNotation, options));
    }
    return score.notes(stringifedNotation, options);
  }).reduce((accu, scoreNotes, index) => {
    // .concat is method from score.notes element
    return accu.concat(scoreNotes);
  });
  return notesMerged;
}

export { parseMidi, parseEventToMeasures, getKeySignature, prepareMeasureNotes };
