import React, { useState } from 'react';
import * as THREE from "three";
import * as WEBIFC from "web-ifc";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import Stats from "stats.js";

const IfcViewer = () => {
  const [file, setFile] = useState(null);
  const [world, setWorld] = useState(null);
  const [fragmentIfcLoader, setFragmentIfcLoader] = useState(null);

  const initializeWorld = (container) => {
    const components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, container);
    world.camera = new OBC.SimpleCamera(components);

    components.init();

    world.camera.controls.setLookAt(3, 3, 3, 0, 0, 0);
    world.scene.setup();

    const grids = components.get(OBC.Grids);
    grids.create(world);
    world.scene.three.background = null;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    world.scene.three.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 10, 10);
    world.scene.three.add(directionalLight);

    // IFCLoader
    const fragments = components.get(OBC.FragmentsManager);
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

    for (const cat of excludedCats) {
      fragmentIfcLoader.settings.excludedCategories.add(cat);
    }

    // Subscribe to the onFragmentsLoaded event
    fragments.onFragmentsLoaded.add((model) => {
      console.log("we are in fragmentsloaded");
      console.log(model);
    });

    const stats = new Stats();
    stats.showPanel(2);
    document.body.append(stats.dom);
    stats.dom.style.left = "0px";
    stats.dom.style.zIndex = "unset";
    world.renderer.onBeforeUpdate.add(() => stats.begin());
    world.renderer.onAfterUpdate.add(() => stats.end());

    setWorld(world);
    setFragmentIfcLoader(fragmentIfcLoader);
  };

  const loadIfc = async (file, loader, world) => {
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
      world.scene.three.add(model);
      console.log("Model loaded successfully:", model);

      // Adjust camera to fit the model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = world.camera.three.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));
      cameraZ *= 1.5; // zoom out a little so that the model is fully visible
      world.camera.three.position.z = cameraZ;
      world.camera.three.lookAt(center);
      world.camera.controls.update();

    } catch (error) {
      console.error("Error loading IFC model:", error);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      console.log("File selected:", selectedFile);
      setFile(selectedFile);

      const container = document.getElementById("container");
      if (!world) {
        initializeWorld(container);
      }

      if (world && fragmentIfcLoader) {
        loadIfc(selectedFile, fragmentIfcLoader, world);
      }
    }
  };

  return (
    <div>
      <input type="file" accept=".ifc" onChange={handleFileChange} />
      <div id="container" style={{ width: '100%', height: '100vh' }}>
        <p>hello world</p>
      </div>
    </div>
  );
};

export default IfcViewer;