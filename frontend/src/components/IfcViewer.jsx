import React, { useRef } from 'react';
import * as THREE from "three";
import * as WEBIFC from "web-ifc";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import Stats from "stats.js";

const IfcViewer = () => {
  const fileRef = useRef(null);
  const worldRef = useRef(null);
  const fragmentIfcLoaderRef = useRef(null);
  const containerRef = useRef(null);
  const fragmentsRef = useRef(null);
  const initializedRef = useRef(false); // Track initialization state

  const initializeWorld = (container) => {
    const components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, container);
    world.camera = new OBC.SimpleCamera(components);

    components.init();

    world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);
    world.scene.setup();

    const grids = components.get(OBC.Grids);
    grids.create(world);
    world.scene.three.background = null;

    // IFCLoader
    const fragments = components.get(OBC.FragmentsManager);
    fragmentsRef.current = fragments;
    const fragmentIfcLoader = components.get(OBC.IfcLoader);
    fragmentIfcLoader.settings.wasm = {
      path: "https://unpkg.com/web-ifc@0.0.57/",
      absolute: true,
    };
    const excludedCats = [
      WEBIFC.IFCTENDONANCHOR,
      WEBIFC.IFCREINFORCINGBAR,
      WEBIFC.IFCREINFORCINGELEMENT,
    ];

    const stats = new Stats();
    stats.dom.style.zIndex = "unset";
    world.renderer.onBeforeUpdate.add(() => stats.begin());
    world.renderer.onAfterUpdate.add(() => stats.end());

    worldRef.current = world;
    fragmentIfcLoaderRef.current = fragmentIfcLoader;
  };

  const loadIfc = async (file, loader) => {
    try {
      console.log("Loading file:", file);
      const data = await file.arrayBuffer();
      const buffer = new Uint8Array(data);
      console.log("Buffer length:", buffer.length); // Log buffer length
      if (buffer.length === 0) {
        throw new Error("Empty buffer");
      }
      const model = await loader.load(buffer);
      model.name = "example";
      worldRef.current.scene.three.add(model);
      console.log("Model loaded successfully:", model);
    } catch (error) {
      console.error("Error loading IFC model:", error);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      console.log("File selected:", selectedFile);
      fileRef.current = selectedFile;

      const container = document.getElementById("container");
      if (!worldRef.current || !fragmentIfcLoaderRef.current) {
        console.log("Initializing world and loader...");
        initializeWorld(container);
      }

      if (worldRef.current && fragmentIfcLoaderRef.current) {
        fragmentsRef.current.dispose(); // Dispose fragments before initializing a new ifc
        loadIfc(selectedFile, fragmentIfcLoaderRef.current);
      }
    }
  };
  // Initialize the world when the component is first rendered
  if (!initializedRef.current && containerRef.current) {
    initializeWorld(containerRef.current);
    initializedRef.current = true; // Mark as initialized
  }
  return (
    <div>
      <input type="file" accept=".ifc" onChange={handleFileChange} />
      <div id="container" ref={containerRef} style={{ width: '100%', height: '100vh' }}></div>
    </div>
  );
};

export default IfcViewer;