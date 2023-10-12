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
  /* const trebleStaff = parseStaffToMeasures(
    midi.track[0].event,
    quarterNoteTimeDivision,
    keySignature
  ); */
  const trebleStaff = parseStaffToMeasures4(
    midi.track[0].event,
    quarterNoteTimeDivision,
    keySignature
  );
  const bassStaff = parseStaffToMeasures4(
    midi.track[1].event,
    quarterNoteTimeDivision,
    keySignature
  );
  console.log("trebleStaff :", trebleStaff);
  console.log("bassStaff :", bassStaff);
  return { trebleStaff, bassStaff };
};

const getDurationForCumulator = (cumulator) => {
  switch (cumulator) {
    case 120:
      return "16";
    case 240:
      return "8";
    case 480:
      return "q";
    case 720:
      return "h";
    case 1920:
      return "w";
    default:
      return false;
  }
};

const parseStaffToMeasures3 = (
  rawStaff,
  quarterNoteTimeDivision,
  keySignature
) => {
  const midiNotes = getNotes(keySignature);
  const measureTime = quarterNoteTimeDivision * 4;
  let staff = [];
  let notes = [];
  let newNotes = [];
  console.log("rawStaff: ", rawStaff);
  for (let index = 0; index < rawStaff.length; index++) {
    let event = rawStaff[index];
    event.index = index;
    if (event.type === MidiHelper.EventType.NOTE) {
      if (event.data[1] !== MidiHelper.EventVelocity.OFF) {
        // case first note
        if (notes.length === 0) {
          event.cumulatedDeltaArray = [0];
          event.cumulatedDelta = 0;
          event.cumulatedEvent = [];
          //event.step = 0;
          notes.push([event]);
        } else {
          // case if a note happened at same time than the previous
          if (event.deltaTime === 0) {
            event.cumulatedDeltaArray = [event.deltaTime];
            event.cumulatedDelta = event.deltaTime;
            event.cumulatedEvent = [];
            // for a note to be completed, we need a Velocity > 0, a Velocity === 0 and a new note with a velocity > 0
            //event.step = 0;
            notes[notes.length - 1].push(event);
          } else {
            const estimatedDuration = getDuration(
              quarterNoteTimeDivision,
              event.deltaTime,
              true
            );
            if (estimatedDuration?.value > 120) {
              console.log("estimatedDuration");
              console.log(estimatedDuration);
              event.oldDeltaTime = event.deltaTime;
              event.deltaTime -= estimatedDuration?.value;
            }

            event.cumulatedDeltaArray = [0];
            event.cumulatedDelta = 0;
            event.cumulatedEvent = [];
            //event.step = 0;
            for (let i = 0; i < notes[notes.length - 1].length; i++) {
              //if (notes[notes.length - 1][i].step === 1) {
              if (
                !notes[notes.length - 1][i].isRest ||
                notes[notes.length - 1][i].isRest === false
              ) {
                notes[notes.length - 1][i].cumulatedEvent.push(event);
                notes[notes.length - 1][i].cumulatedDelta += event.deltaTime;
                notes[notes.length - 1][i].cumulatedDeltaArray.push(
                  event.deltaTime
                );
                //notes[notes.length - 1][i].step = 2;
              }
              //}
            }
            if (estimatedDuration?.value > 120) {
              const currentRest = {
                notes: ["B3"],
                duration: estimatedDuration.durationLetter,
                durationTime: estimatedDuration.value,
                originalEvents: [event],
                isRest: true,
              };
              notes.push([currentRest]);
            }
            notes.push([event]);
          }
        }
      } else {
        const duration = getDurationForCumulator(event.deltaTime);
        if (duration) {
          const durationRest = `${duration}/r`;
          const currentRest = {
            notes: ["B3"],
            duration: durationRest,
            durationTime: event.deltaTime,
            originalEvents: [event],
            isRest: true,
          };
          notes.push([currentRest]);
        } else {
          for (let i = 0; i < notes[notes.length - 1].length; i++) {
            //if (notes[notes.length - 1][i].data[0] === event.data[0] && notes[notes.length - 1][i].step === 0) {
            //  notes[notes.length - 1][i].step = 1;
            //}
            //if (notes[notes.length - 1][i].step < 2) {
            if (
              !notes[notes.length - 1][i].isRest ||
              notes[notes.length - 1][i].isRest === false
            ) {
              notes[notes.length - 1][i].cumulatedEvent.push(event);
              notes[notes.length - 1][i].cumulatedDelta += event.deltaTime;
              notes[notes.length - 1][i].cumulatedDeltaArray.push(
                event.deltaTime
              );
            }
            //}
          }
        }
      }
    } else {
      if (event.deltaTime > 0) {
        try {
          let nextEvent = rawStaff[index + 1];
          nextEvent.deltaTime += event.deltaTime;
        } catch (e) {}
      }
    }
  }
  console.log(notes);
  for (let i = 0; i < notes.length; i++) {
    let currentNotes = notes[i];
    let sortedNotes = currentNotes.sort(
      (a, b) => b.cumulatedDelta - a.cumulatedDelta
    );
    let firstNote = sortedNotes[0];
    if (
      sortedNotes.length > 1 &&
      firstNote.cumulatedDelta !== sortedNotes[1].cumulatedDelta
    ) {
      currentNotes = currentNotes.filter(
        (val) => val.cumulatedDelta != firstNote.cumulatedDelta
      );
      let noteToAdd = {
        notes: [midiNotes[firstNote.data[0]]],
        //duration: missingDuration,
        duration: getDurationForCumulator(firstNote.cumulatedDelta),
        durationTime: firstNote.cumulatedDelta,
        originalEvents: firstNote,
      };
      sortedNotes = currentNotes.sort(
        (a, b) => b.cumulatedDelta - a.cumulatedDelta
      );
      firstNote = sortedNotes[0];
      if (staff.length === 0) {
        staff.push([noteToAdd]);
      } else {
        const currentMeasure = staff[staff.length - 1];
        const cumulativeDurationTime = currentMeasure.reduce(
          (accu, currentNote) => accu + currentNote.durationTime,
          0
        );
        if (cumulativeDurationTime < measureTime) {
          staff[staff.length - 1].push(noteToAdd);
        } else {
          staff.push([noteToAdd]);
        }
      }
    }
    let newNote = {};
    if (currentNotes[0].isRest) {
      newNote = currentNotes[0];
    } else {
      newNote = {
        notes: currentNotes.reduce(
          (accu, noteEvent) => [...accu, midiNotes[noteEvent.data[0]]],
          []
        ),
        //duration: missingDuration,
        duration: getDurationForCumulator(firstNote.cumulatedDelta),
        durationTime: firstNote.cumulatedDelta,
        originalEvents: notes[i],
      };
    }
    if (newNote.durationTime > 0) {
      if (staff.length === 0) {
        staff.push([newNote]);
      } else {
        const currentMeasure = staff[staff.length - 1];
        const cumulativeDurationTime = currentMeasure.reduce(
          (accu, currentNote) => accu + currentNote.durationTime,
          0
        );
        if (cumulativeDurationTime < measureTime) {
          staff[staff.length - 1].push(newNote);
        } else {
          staff.push([newNote]);
        }
      }
    }
  }
  console.log(staff);
  return staff;
};

const parseStaffToMeasures4 = (
  rawStaff,
  quarterNoteTimeDivision,
  keySignature
) => {
  const midiNotes = getNotes(keySignature);
  const measureTime = quarterNoteTimeDivision * 4;
  let notes = [];
  let newNotes = [];
  let accumulatorDelta = 0;
  console.log("rawStaff: ", rawStaff);
  for (let index = 0; index < rawStaff.length; index++) {
    let event = rawStaff[index];
    event.index = index;
    if (event.deltaTime) {
      accumulatorDelta += event.deltaTime
    }
    if (event.type === MidiHelper.EventType.NOTE) {
      if (event.data[1] !== MidiHelper.EventVelocity.OFF) {
        notes.push({
          startEvent: event,
          start: accumulatorDelta,
          isFinish: false
        });
      } else {
        const noteEquivalent = notes.findIndex(note => 
          note.startEvent.data[0] === event.data[0] && note.isFinish === false
        );
        notes[noteEquivalent].endEvent = event;
        notes[noteEquivalent].isFinish = true;
        notes[noteEquivalent].end = accumulatorDelta;
        notes[noteEquivalent].durationTime = notes[noteEquivalent].end - notes[noteEquivalent].start;
        notes[noteEquivalent].note = midiNotes[event.data[0]];
        const estimatedDuration = getDuration(
          quarterNoteTimeDivision,
          notes[noteEquivalent].durationTime,
          false
        );
        notes[noteEquivalent].duration = estimatedDuration;
      }
    }
    /* if (event.type === MidiHelper.EventType.NOTE) {
      if (event.data[1] !== MidiHelper.EventVelocity.OFF) {
        // case first note
      }
    } */
  }
  let startMeasureTime = 0;
  let endMeasureTime = startMeasureTime + measureTime;
  let staff = [[]];
  for (let index = 0; index < notes.length; index++) {
    if (notes[index].start >= endMeasureTime) {
      startMeasureTime += measureTime;
      endMeasureTime += measureTime;
      staff.push([]);
    }
    staff[staff.length - 1].push(notes[index]);
  }
  console.log("staff ", staff);
};

const parseStaffToMeasures2 = (
  rawStaff,
  quarterNoteTimeDivision,
  keySignature
) => {
  const midiNotes = getNotes(keySignature);
  const measureTime = quarterNoteTimeDivision * 4;
  //console.log(rawStaff);
  let staff = [];
  let staffEvents = [];
  let currentMeasure = [];
  let currentRest;
  let currentNotesPlayed = [];
  let measureTimeCumulator = 0;
  for (let event of rawStaff) {
    if (event.type === MidiHelper.EventType.NOTE) {
      staffEvents.push(event);
      let deltaTimeToAdd = event.deltaTime;
      measureTimeCumulator += deltaTimeToAdd;

      const durationTimeMeasure = currentMeasure.reduce(
        (accu, currentNote) => accu + parseInt(currentNote.durationTime),
        0
      );
      if (staff.length === 0) {
        console.log(measureTimeCumulator);
        console.log(event);
        console.log("currentStaff: ", staff);
        console.log("currentMeasure: ", currentMeasure);
        console.log("currentNotesPlayed: ", currentNotesPlayed);
      }
      if (durationTimeMeasure + measureTimeCumulator > measureTime) {
        const notesForEnding = currentNotesPlayed.filter(
          (note) => note.isFinished
        );
        const missingDurationTime = measureTime - durationTimeMeasure;
        const missingDuration = getDurationForCumulator(missingDurationTime);
        let currentNotes = {
          notes: [],
          duration: missingDuration,
          durationTime: missingDurationTime,
          originalEvents: [],
        };
        notesForEnding.forEach((noteEvent) => {
          currentNotes.notes.push(midiNotes[noteEvent.data[0]]);
          currentNotes.originalEvents.push(noteEvent);
        });
        measureTimeCumulator = 0;
        currentNotesPlayed = [];
        currentMeasure.push(currentNotes);
        staff.push(Array.from(currentMeasure));
        currentMeasure = [];
        /* console.log("finish with error");
          console.log("notesForEnding:", notesForEnding);
          console.log("currentStaff: ", staff);
          console.log("currentMeasure: ", currentMeasure);
          console.log("currentNotesPlayed: ", currentNotesPlayed); */
      }

      if (event.data[1] !== MidiHelper.EventVelocity.OFF) {
        if (deltaTimeToAdd > 0) {
          const estimatedDuration = getDuration(
            quarterNoteTimeDivision,
            deltaTimeToAdd,
            true
          );
          if (estimatedDuration.durationLetter !== "16/r") {
            currentRest = {
              notes: ["B3"],
              duration: estimatedDuration.durationLetter,
              durationTime: estimatedDuration.value,
              originalEvents: [],
            };
            measureTimeCumulator =
              measureTimeCumulator - estimatedDuration.value;
          }
        }
      }
      let duration = getDurationForCumulator(measureTimeCumulator);
      if (duration) {
        //console.log(measureTimeCumulator, ": ", duration);
        let currentNotes = {
          notes: [],
          duration,
          durationTime: measureTimeCumulator,
          originalEvents: [],
        };
        currentNotesPlayed.forEach((noteEvent) => {
          currentNotes.notes.push(midiNotes[noteEvent.data[0]]);
          currentNotes.originalEvents.push(noteEvent);
        });
        measureTimeCumulator = 0;
        currentNotesPlayed = [];
        currentMeasure.push(currentNotes);
        if (currentRest !== undefined) {
          currentMeasure.push(currentRest);
          currentRest = undefined;
        }
        const totalMeasureTime = currentMeasure.reduce(
          (accu, currentNote) => accu + parseInt(currentNote.durationTime),
          0
        );
        if (totalMeasureTime === measureTime) {
          staff.push(Array.from(currentMeasure));
          currentMeasure = [];
        }
      }
      if (event.data[1] !== MidiHelper.EventVelocity.OFF) {
        /* if (getClosestDuration(event.deltaTime)) {
            // TODO: handle rest
          } */
        currentNotesPlayed.push({
          ...event,
          isFinished: false,
        });
      } else {
        const currentNoteIndex = currentNotesPlayed.findIndex(
          (note) => note.data[0] === event.data[0]
        );
        if (currentNoteIndex !== -1) {
          currentNotesPlayed[currentNoteIndex].isFinished = true;
        } else {
          //console.log("ERROR, no current notes for finished found")
        }
      }
    }
  }
  console.log(staff);
  return staff;
};

const parseStaffToMeasures = (
  rawStaff,
  quarterNoteTimeDivision,
  keySignature
) => {
  // TODO: mettre en place équivalance note (exemple: Mib par Mi, car le b est déjà spécifié en début avec la key signature)
  const midiNotes = getNotes(keySignature);
  let staff = [];
  let staffEvents = [];
  let currentNotesPlayed = [];
  console.log(quarterNoteTimeDivision);
  for (let event of rawStaff) {
    if (event.metaType === MidiHelper.EventMetaType.keySignature) {
      //console.log(MidiHelper.getSignature(event.data));
    }
    if (event.type === MidiHelper.EventType.NOTE) {
      staffEvents.push(event);
      currentNotesPlayed.push(event);
      if (event.data[1] !== MidiHelper.EventVelocity.OFF) {
        currentNotesPlayed.push(event);
      } else {
        const currentNote = currentNotesPlayed.find(
          (note) => note.data[0] === event.data[0]
        );
        currentNotesPlayed = currentNotesPlayed.filter(
          (note) => note.data[0] !== event.data[0]
        );
        const totalDeltaTime = event.deltaTime;
        if (totalDeltaTime > 0) {
          if (
            currentNote.deltaTime >=
            quarterNoteTimeDivision /
              2 /*note commence après 1/8, donc il y a une pause avant*/
          ) {
            let result = getDuration(
              quarterNoteTimeDivision,
              currentNote.deltaTime,
              true
            );
            staff.push({
              notes: ["B3"],
              duration: result.durationLetter,
              value: result.value,
              beginDelta: currentNote.deltaTime,
              endDelta: event.deltaTime,
              delta: totalDeltaTime,
              originalEvent: event,
            });
          }
          let result = getDuration(
            quarterNoteTimeDivision,
            totalDeltaTime,
            false
          );
          staff.push({
            notes: [midiNotes[currentNote.data[0]]],
            duration: result.durationLetter,
            value: result.value,
            beginDelta: currentNote.deltaTime,
            endDelta: event.deltaTime,
            delta: totalDeltaTime,
            originalEvent: event,
          });
        } else {
          staff[staff.length - 1].notes.push(midiNotes[currentNote.data[0]]);
        }
      }
    }
  }
  const measureTime = quarterNoteTimeDivision * 4;
  let measures = [];
  let failedMeasures = [];
  let currentTotalMeasure = 0;
  for (let note of staff) {
    if (currentTotalMeasure === 0) {
      measures.push([note]);
    } else {
      measures[measures.length - 1].push(note);
    }
    currentTotalMeasure += note.value;
    if (currentTotalMeasure === measureTime) {
      currentTotalMeasure = 0;
    } else if (currentTotalMeasure > measureTime) {
      const currentMeasure = measures[measures.length - 1];
      /* console.log(
        "Current total measure is greater, index: ",
        measures.length - 1
      );
      console.log(
        "Measures before adjustement : ",
        JSON.parse(JSON.stringify(currentMeasure))
      ); */
      const totalMeasureTimeWithoutLastNote = currentMeasure
        .slice(0, -1)
        .reduce((accu, curr) => curr.value + accu, 0);
      let result = getDuration(
        quarterNoteTimeDivision,
        measureTime - totalMeasureTimeWithoutLastNote,
        currentMeasure[currentMeasure.length - 1].duration.includes("r")
      );
      let remainingMeasureTime =
        currentMeasure[currentMeasure.length - 1].value - result.value;
      currentMeasure[currentMeasure.length - 1] = {
        notes: currentMeasure[currentMeasure.length - 1].notes,
        duration: result.durationLetter,
        value: result.value,
        beginDelta: currentMeasure[currentMeasure.length - 1].beginDelta,
        endDelta: currentMeasure[currentMeasure.length - 1].endDelta,
        delta: currentMeasure[currentMeasure.length - 1].delta,
      };
      // TODO : Add rest for next measure
      currentTotalMeasure = 0;
      if (remainingMeasureTime >= quarterNoteTimeDivision / 2) {
        result = getDuration(
          quarterNoteTimeDivision,
          remainingMeasureTime,
          true
        );
        const newRest = {
          notes: ["B3"],
          duration: result.durationLetter,
          value: result.value,
          beginDelta: currentMeasure[currentMeasure.length - 1].beginDelta,
          endDelta: currentMeasure[currentMeasure.length - 1].endDelta,
          delta: currentMeasure[currentMeasure.length - 1].delta,
        };
        measures.push([newRest]);
        currentTotalMeasure += newRest.value;
      }
    }
  }
  // case last measure is not complete
  const lastMeasure = measures[measures.length - 1];
  const totalMeasureTime = lastMeasure.reduce(
    (accu, curr) => curr.value + accu,
    0
  );
  if (totalMeasureTime < measureTime) {
    const totalMeasureTimeWithoutLastNote = lastMeasure
      .slice(0, -1)
      .reduce((accu, curr) => curr.value + accu, 0);
    let result = getDuration(
      quarterNoteTimeDivision,
      measureTime - totalMeasureTimeWithoutLastNote
    );
    lastMeasure[lastMeasure.length - 1] = {
      notes: lastMeasure[lastMeasure.length - 1].notes,
      duration: result.durationLetter,
      value: result.value,
      beginDelta: lastMeasure[lastMeasure.length - 1].beginDelta,
      endDelta: lastMeasure[lastMeasure.length - 1].endDelta,
      delta: lastMeasure[lastMeasure.length - 1].delta,
    };
  }
  return measures;
};

export { parseMidi, parseEventToMeasures, getKeySignature };
