"use client";
import { useState, useEffect, useRef } from "react";
import { parseMidi, parseEventToMeasures, getKeySignature, prepareMeasureNotes } from "./helper";
import { Vex } from "vexflow";

const { Factory, EasyScore, System, Renderer, Stave, StaveNote, Note } = Vex.Flow;

var width_canvas = window.innerWidth * 0.8;
var height_canvas = window.innerHeight * 4.8; 

export default function Page() {
  const [currentMidi, setCurrentMidi] = useState(null);
  const [vf, setVf] = useState(null);
  const divSheet = useRef(null);

  useEffect(() => {
    
    const newVf = new Factory({
      renderer: { elementId: 'sheet', width: width_canvas, height: height_canvas },
    });
    setVf(newVf);
  }, []);

  const loadFile = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
        setCurrentMidi(event.target.result);
        const midi = parseMidi(event.target.result);
        // done!
        //console.log(notes);
        drawSheet(midi);
    });
    reader.readAsDataURL(file);
  };

  const drawSheet = (midi) => {
    const keySignature = getKeySignature(midi);
    console.log(keySignature);
    const { trebleStaff, bassStaff } = parseEventToMeasures(midi);
    const score = vf.EasyScore();
    //const system = vf.System();
    /* const prepareNotes = (notes, options) => {
      let newNotes = [];
      for (let i = 0; i < notes.length; i++) {
        if (i === 0) { newNotes.push([notes[i]]); } else {
          const lastNotes = newNotes[newNotes.length - 1];
          const lastNote = lastNotes[lastNotes.length - 1];
          if (lastNote.duration === notes[i].duration) {
            if (lastNotes.length < 4) {
              lastNotes.push(notes[i]);
            } else {
              newNotes.push([notes[i]]);
            }
          } else {
            newNotes.push([notes[i]]);
          }
        }
      }
      let notesRendered = newNotes.map(firstMap => {  
        const newFirstMap = firstMap.map(subnotes => {
          if (subnotes.notes.length === 1) {
            return `${subnotes.notes[0]}/${subnotes.duration}`
          }
          return `(${subnotes.notes.join(" ")})/${subnotes.duration}`;
        }).join(", ");
        switch (firstMap.length) {
          case 4:
            return score.beam(score.notes(newFirstMap, options));
          case 3:
          case 2:
          case 1:
          default:
            return score.notes(newFirstMap, options);
        }
      });
      console.log(notesRendered);
      return notesRendered.reduce((accu, next, index) => {
        if (index === 0) {
          return next;
        }
        return accu.concat(next);
      });
  }; */

    
    // https://github.com/0xfe/vexflow/blob/master/tests/bach_tests.ts
    const beginX = 10;
    let x = beginX;
    let y = 0;

    function appendSystem(width, currentMeasure) {
        const paddingHeight = 200;
        const paddingWidth = width;
        x += width;
        if (x > width_canvas - 200) {
            x = beginX;
            y += paddingHeight;
        }
        const system = vf.System({ x, y, width: width === 0 || currentMeasure % 4 === 0 ? 300 : 250, spaceBetweenStaves: 10 });
        return system;
    }
    
    let system = appendSystem(0);
    system
    .addStave({
        voices: [
        score.voice(prepareMeasureNotes(trebleStaff[0], { stem: 'down', clef: "treble" }, score)),
        //score.voice(score.notes(notes[0] + "/q", ...notes.slice(1))),
        //score.voice(score.notes('C#4/h, C#4', { stem: 'down' })),
        ]
    })
    .addClef('treble')
    .addTimeSignature('4/4')
    .addKeySignature(keySignature);

    system
    .addStave({
        voices: [
        score.voice(prepareMeasureNotes(bassStaff[0], { clef: "bass"}, score)),
        //score.voice(score.notes(notes[0] + "/q", ...notes.slice(1))),
        //score.voice(score.notes('C#4/h, C#4', { stem: 'down' })),
        ]
    })
    .addClef('bass')
    .addTimeSignature('4/4')
    .addKeySignature(keySignature);

    system.addConnector()

    vf.draw();
    let nextWidth = document.querySelectorAll("g.vf-stave")[0].getBoundingClientRect().width;
    for (let i = 1; i < 20; i++) {
        //system.addConnector('brace');
        system.addConnector('singleRight');
        //system.addConnector('singleLeft');
        system = appendSystem(nextWidth, i);
        console.log("preparing this measures :");
        console.log(trebleStaff[i]);
        console.log(bassStaff[i]);
        let trebleStave = system
        .addStave({
            voices: [
            score.voice(prepareMeasureNotes(trebleStaff[i], { clef: "treble" }, score)),
            //score.voice(score.notes(notes[0] + "/q", ...notes.slice(1))),
            //score.voice(score.notes('C#4/h, C#4', { stem: 'down' })),
            ],
        });
        let bassStave = system
        .addStave({
            voices: [
            score.voice(prepareMeasureNotes(bassStaff[i], { clef: "bass"}, score)),
            //score.voice(score.notes(notes[0] + "/q", ...notes.slice(1))),
            //score.voice(score.notes('C#4/h, C#4', { stem: 'down' })),
            ],
        });
        if (i % 4 === 0) {
          trebleStave.addClef('treble')
          .addKeySignature(keySignature);

          bassStave.addClef('bass')
          .addKeySignature(keySignature);

          system.addConnector()
        }
        vf.draw();
        const drawedStaves = document.querySelectorAll("g.vf-stave");
        const lastStave = drawedStaves[drawedStaves.length - 1]
        nextWidth = lastStave.getBoundingClientRect().width;
    }
  }

  return (
    <>
    <label
      className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-full mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
      htmlFor="file-selector"
    >
      <input
        className="hidden"
        onChange={loadFile}
        type="file"
        id="file-selector"
        accept=".mid"
      />
      <p>Select MIDI piano sheet</p>
    </label>
    <div id="sheet" />
    </>
  );
}
