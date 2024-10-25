import React, { useRef, useState } from 'react';
import * as THREE from "three";
import * as WEBIFC from "web-ifc";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import Stats from "stats.js";
import './IfcViewer.css'; // Import the CSS file for styling

const IfcViewer = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false); // State to manage panel visibility
  const [zoomOnClick, setZoomOnClick] = useState(false); // State to manage panel visibility
  const fileInputRef = useRef(null);
  const fileRef = useRef(null);
  const worldRef = useRef(null);
  const fragmentIfcLoaderRef = useRef(null);
  const containerRef = useRef(null);
  const fragmentsRef = useRef(null);
  const initializedRef = useRef(false); // Track initialization state
  const CameraControlRef = useRef(null);

  const initializeWorld = (container) => {
    const components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBCF.PostproductionRenderer(components, container);
    world.camera = new OBC.SimpleCamera(components);
    CameraControlRef.current = world.camera.controls
    components.init();

    world.renderer.postproduction.enabled = true;
    world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);
    world.scene.setup();

    const grids = components.get(OBC.Grids);
    const grid = grids.create(world);
    world.scene.three.background = null;
    world.renderer.postproduction.customEffects.excludedMeshes.push(grid.three);
    // highlighter
    const highlighter = components.get(OBCF.Highlighter);
    highlighter.setup({ world });
    highlighter.zoomToSelection = zoomOnClick;

    const outliner = components.get(OBCF.Outliner);
    outliner.world = world;
    outliner.enabled = true;

    outliner.create(
      "example",
      new THREE.MeshBasicMaterial({
        color: 0xbcf124,
        transparent: true,
        opacity: 0.1,
      }),
    );

    highlighter.events.select.onHighlight.add((data) => {
      outliner.clear("example");
      outliner.add("example", data);
    });

    highlighter.events.select.onClear.add(() => {
      outliner.clear("example");
    });
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
        //fragmentsRef.current.dispose(); // Dispose fragments before initializing a new ifc
        loadIfc(selectedFile, fragmentIfcLoaderRef.current);
      }
    }
  };
  const birdsView = () => {
    if (CameraControlRef.current) {
      const camera = CameraControlRef.current._camera;
      const target = new THREE.Vector3(0, 0, 0); // Assuming you want to look at the origin
      const altitude = 100; // Adjust this value to set the height of the bird's-eye view

      // Set the camera position to a high altitude
      camera.position.set(target.x, target.y + altitude, target.z);

      // Point the camera downwards
      CameraControlRef.current.setLookAt(
        camera.position.x,
        camera.position.y,
        camera.position.z,
        target.x,
        target.y,
        target.z,
        true // Enable smooth transition
      );
    }
  };
  // Initialize the world when the component is first rendered
  if (!initializedRef.current && containerRef.current) {
    initializeWorld(containerRef.current);
    initializedRef.current = true; // Mark as initialized
  }
  return (
    <div className="ifc-viewer">
      <input
        type="file"
        accept=".ifc"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button className="custom-upload-button" onClick={() => fileInputRef.current.click()}>
        Upload IFC File
      </button>
      <button className="toggle-panel-button" onClick={() => setIsPanelOpen(!isPanelOpen)}>
        {isPanelOpen ? 'Close Panel' : 'Open Panel'}
      </button>
      <button className="zoom-on-click-button" onClick={() => setZoomOnClick(!zoomOnClick)}>
        {zoomOnClick ? 'Zoom on click: On' : 'Zoom on click: Off'}
      </button>
      <button className="zoom-on-click-button" onClick={() => birdsView()}>
        BirdUp
      </button>
      <div className={`side-panel ${isPanelOpen ? 'open' : ''}`}>
        <h2>Side Panel</h2>
        <p>Content goes here...</p>
      </div>
      <div id="container" ref={containerRef} style={{ width: '100%', height: '100vh' }}></div>
    </div>
  );
};

export default IfcViewer;