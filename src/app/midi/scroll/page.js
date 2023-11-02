"use client";
import "./scroll.css";
import { useState, useEffect, useRef } from "react";
import { parseMidi, parseEventToMeasures, getKeySignature, prepareMeasureNotes, prepareNotes } from "../helper";
import { Vex } from "vexflow";

// Basic boilerplate for using VexFlow with the SVG rendering context:
const { Renderer, TickContext, Factory, Stave, StaveNote, Formatter, Accidental, Beam, Voice } = Vex.Flow;

export default function Page() {
  const [currentMidi, setCurrentMidi] = useState(null);
  const [vf, setVf] = useState(null);
  const divSheet = useRef(null);
  const [context, setContext] = useState(null);

  useEffect(() => {
    if (divSheet.current) {
        const newVf = new Factory({
        renderer: { elementId: 'sheet', width: window.innerWidth, height: 300 },
        });
        const c = newVf.getContext();
        setContext(c);
        setVf(newVf);
    }
  }, [divSheet]);

  const loadFile = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.addEventListener("load", (event) => {
        setCurrentMidi(event.target.result);
        const midi = parseMidi(event.target.result);
        drawSheet(midi);
    });
    reader.readAsDataURL(file);
  };

  const drawSheet = (midi) => {
    const keySignature = getKeySignature(midi);
    const { trebleStaff, bassStaff } = parseEventToMeasures(midi);
    const score = vf.EasyScore();

    const tickContext = new TickContext();
    // Create a stave of width 10000 at position 10, 40 on the canvas.
    const stave = new Stave(10, 10, 10000).addClef("treble").addTimeSignature('4/4')
    .addKeySignature(keySignature);

    // Connect it to the rendering context and draw!
    stave.setContext(context).draw();
    
    const notes = prepareNotes(trebleStaff[0][0], { clef: "treble" }, score);
    
    notes.forEach(subNotes => {
        subNotes.forEach(n => {
            n.setContext(context).setStave(stave);
            tickContext.addTickable(n);
        }) 
    })

    tickContext.preFormat().setX(window.innerWidth - 100);
    let visibleNoteGroups = [];

    setInterval(() => {
        let note = notes.shift();
        console.log(note);
        if (!note) {
            console.log("DONE!");
            return;
        }
        note.forEach(n => {
            const group = context.openGroup();
            visibleNoteGroups.push(group);
            n.draw();
            context.closeGroup();
            group.classList.add("scroll");
        // Force a DOM-refresh by asking for the group's bounding box. Why? Most
        // modern browsers are smart enough to realize that adding .scroll class
        // hasn't changed anything about the rendering, so they wait to apply it
        // at the next dom refresh, when they can apply any other changes at the
        // same time for optimization. However, if we allow that to happen,
        // then sometimes the note will immediately jump to its fully transformed
        // position -- because the transform will be applied before the class with
        // its transition rule.
        const box = group.getBoundingClientRect();
        group.classList.add("scrolling");
        });
        

    setTimeout(() => {
        const index = visibleNoteGroups.indexOf(group);
        if (index === -1) return;
        group.classList.add("too-slow");
        visibleNoteGroups.shift();
    }, 5000);
    }, 300);
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
    <div id="sheet" ref={divSheet} />
    </>
  );
}
