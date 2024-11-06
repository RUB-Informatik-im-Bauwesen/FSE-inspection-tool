import React, { useRef, useState } from 'react';
import * as THREE from "three";
import * as WEBIFC from "web-ifc";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as OBF from "@thatopen/fragments";
import Stats from "stats.js";
import './IfcViewer.css';
import { Collapse } from 'react-collapse';

const IfcViewer = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOBJPanelOpen, setIsOBJPanelOpen] = useState(false);
  const [propertySets, setPropertySets] = useState([]);
  const [OBJpropertyDict, setOBJPropertyDict] = useState({});
  const [expandedKeys, setExpandedKeys] = useState({}); // Zustand für erweiterte Schlüssel
  const fileInputRef = useRef(null);
  const fileRef = useRef(null);
  const worldRef = useRef(null);
  const fragmentIfcLoaderRef = useRef(null);
  const containerRef = useRef(null);
  const highlighterRef = useRef(null);
  const fragmentsRef = useRef(null);
  const initializedRef = useRef(false);
  const CameraControlRef = useRef(null);
  const modelIDRef = useRef(null);

  const initializeWorld = (container) => {
    const components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create();

    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBCF.PostproductionRenderer(components, container);
    world.camera = new OBC.SimpleCamera(components);
    CameraControlRef.current = world.camera.controls;
    components.init();

    world.renderer.postproduction.enabled = true;
    world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);
    world.scene.setup();

    const grids = components.get(OBC.Grids);
    const grid = grids.create(world);
    world.scene.three.background = null;
    world.renderer.postproduction.customEffects.excludedMeshes.push(grid.three);

    const highlighter = components.get(OBCF.Highlighter);
    highlighter.setup({ world });
    highlighter.zoomToSelection = false;
    highlighterRef.current = highlighter;

    const outliner = components.get(OBCF.Outliner);
    outliner.world = world;
    outliner.enabled = true;

    outliner.create(
        "example",
        new THREE.MeshBasicMaterial({
            color: 0xbcf124,
            transparent: true,
            opacity: 0.1,
        })
    );

    highlighter.events.select.onHighlight.add(async (data) => { // HIGHLIGHT WHEN CLICKING ON FRAGMENTS, GET PROPERTIES OF FRAGMENTS
      console.log("highlight events:", highlighter.events);
      console.log("Highlighted data:", data);
      
      const ids = getKeys(data);
      if (ids.length > 0) {
          console.log("IDs found in the highlighted data:", ids);
          const expressID = ids[0]; // get expressID from the ids
          console.log("Clicked object ID:", expressID);
          const fragmentGroups = fragmentsRef.current.groups; // Get the FragmentsGroup instance
          const frag_grp_ids = []
          for (const key of fragmentGroups.keys()) { // get all fragmentsgroup keys and push them to frag_ids
            frag_grp_ids.push(key);
          }
          console.log("frag_ids: ",frag_grp_ids)
          console.log("fragmentGroups: ",fragmentGroups)
          const fragmentGroup = fragmentGroups.get(frag_grp_ids[0]); // Get the first fragmentGroup
          console.log("fragmentGroup: ",fragmentGroup)
          console.log("fragmentGroup class: ",fragmentGroups.constructor.name)
          if (fragmentGroup) {
              const fragmentProperties = await fragmentGroup.getProperties(expressID);
              console.log("Fragment properties:", fragmentProperties); 
              console.log("isArray:", Array.isArray(fragmentProperties))
              fragmentProperties.className = fragmentProperties.constructor.name;
              setPropertySets(fragmentProperties); // Update state with the properties
              const type = fragmentProperties.type
              console.log("Type: ",type)
              fragmentGroup.getAllPropertiesOfType(type).then((properties) => {
                if (properties) {
                  for (const id in properties) {
                    const property = properties[id];
                    //console.log(`ID: ${id}, Name: ${property.name}, Type: ${property.type}`);
                  }
                } else {
                  console.log(`No properties of type ${type} found.`);
                }
              });
          } else {
              console.error("FragmentsGroup instance not found.");
          }
      } else {
          console.error("No IDs found in the highlighted data.");
      }
    });

    const fragments = components.get(OBC.FragmentsManager);
    console.log("Fragments: ",fragments)
    fragmentsRef.current = fragments;
    const fragmentIfcLoader = components.get(OBC.IfcLoader);
    fragmentIfcLoader.settings.wasm = {
        path: "https://unpkg.com/web-ifc@0.0.57/",
        absolute: true,
    };

    const stats = new Stats();
    stats.dom.style.zIndex = "unset";
    world.renderer.onBeforeUpdate.add(() => stats.begin());
    world.renderer.onAfterUpdate.add(() => stats.end());

    worldRef.current = world;
    fragmentIfcLoaderRef.current = fragmentIfcLoader;
  };
  const getKeys = (data) => {
    const ids = [];
    for (const key in data) { // get all ids from a dict like object (fragmentgroup)
      if (data.hasOwnProperty(key)) {
          const idSet = data[key]; 
          if (idSet instanceof Set) {
              ids.push(...idSet);
          }
      }
    }
    return ids;
  };
  const getObjectPropertyDict = async () => {
    const groupsDictionary = {}; // key correspond to the group name, value is a dictionary of properties
    const fragmentGroups = Array.from(fragmentsRef.current.groups.values()); // get all groups in an array (they correspond to IFC files)
  
    const promises = fragmentGroups.map(async (group) => {
      const propertyDictionary = {}; // key correspond to the property className, value is name, id, type
      const propTypes_unique = group.getAllPropertiesTypes();
  
      const typePromises = propTypes_unique.map(async (type) => {
        const properties = await group.getAllPropertiesOfType(type);
        if (properties) {
          for (const id in properties) {
            const property = properties[id];
            if (!hasInheritedFromIfcBuildingElement(property)) {
              continue; // Skip the current iteration if the property has never inherited from IfcBuildingElement
            }
            if (!property.Name) {
              continue; // Skip the current iteration if the property does not have a Name
            }
            const className = Object.getPrototypeOf(property).constructor.name;
            if (!propertyDictionary[className]) {
              propertyDictionary[className] = {};
            }
            propertyDictionary[className][id] = {
              name: property.Name.value,
              id: id,
              type: property.type,
            };
          }
        } else {
          console.log(`No properties of type ${type} found.`);
        }
      });
  
      await Promise.all(typePromises);
      groupsDictionary[group.uuid] = propertyDictionary;
    });
  
    await Promise.all(promises);
    setOBJPropertyDict(groupsDictionary);
    console.log("OBJpropertyDict: ", groupsDictionary);
    console.log("groupsDictionary: ", groupsDictionary);
  };
  const highlightGroup = (group) =>{ // highlight a group of fragments
    const id = group.getAllPropertiesIDs() // get all IDs of the fragments in the group
    const fragMap = group.getFragmentMap(id) 
    highlighterRef.current.highlightByID("select",fragMap) // highlight the fragments of the group
  };
  const hasInheritedFromIfcBuildingElement = (obj) => {
    let proto = Object.getPrototypeOf(obj);
    while (proto) {
      if (proto.constructor.name === 'IfcBuildingElement') {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }
    return false;
  };
  const loadIfc = async (file, loader) => {
    try {
      console.log("Loading file:", file);
      const data = await file.arrayBuffer();
      const buffer = new Uint8Array(data);
      console.log("Buffer length:", buffer.length);
      if (buffer.length === 0) {
        throw new Error("Empty buffer");
      }
      const model = await loader.load(buffer);
      model.name = "example";
      worldRef.current.scene.three.add(model);
      console.log("Model loaded successfully:", model);
      modelIDRef.current = model.modelID;
      console.log("Model ID:", modelIDRef.current);
      getObjectPropertyDict();
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
        loadIfc(selectedFile, fragmentIfcLoaderRef.current);
      }
    }
  };

  const toggleExpand = (key) => {
    setExpandedKeys((prevExpandedKeys) => ({
      ...prevExpandedKeys,
      [key]: !prevExpandedKeys[key],
    }));
  };

  const renderOBJPropertyDict = (dict) => {
    return (
      <ul>
        {Object.keys(dict).map((groupUUID) => (
          <li key={groupUUID}>
            <strong onClick={() => toggleExpand(groupUUID)} style={{ cursor: 'pointer' }}>
              {groupUUID}
            </strong>
            <Collapse isOpened={expandedKeys[groupUUID]}>
              <ul>
                {Object.keys(dict[groupUUID]).map((className) => (
                  <li key={className}>
                    <strong onClick={() => toggleExpand(`${groupUUID}-${className}`)} style={{ cursor: 'pointer' }}>
                      {className}
                    </strong>
                    <Collapse isOpened={expandedKeys[`${groupUUID}-${className}`]}>
                      <ul>
                        {Object.keys(dict[groupUUID][className]).map((id) => (
                          <li key={id}>
                            {dict[groupUUID][className][id].name}
                          </li>
                        ))}
                      </ul>
                    </Collapse>
                  </li>
                ))}
              </ul>
            </Collapse>
          </li>
        ))}
      </ul>
    );
  };

  const birdsView = () => {
    if (CameraControlRef.current) {
      const camera = CameraControlRef.current._camera;
      const target = new THREE.Vector3(0, 0, 0);
      const altitude = 100;

      camera.position.set(target.x, target.y + altitude, target.z);

      CameraControlRef.current.setLookAt(
        camera.position.x,
        camera.position.y,
        camera.position.z,
        target.x,
        target.y,
        target.z,
        true 
      );
    }
  };

  if (!initializedRef.current && containerRef.current) {
    initializeWorld(containerRef.current);
    initializedRef.current = true;
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
      <button className="toggle-panel-button" onClick={() => setIsOBJPanelOpen(!isOBJPanelOpen)}>
        {isOBJPanelOpen ? 'Close Object explorer' : 'Open Object explorer'}
      </button>
      <button className="toggle-panel-button" onClick={() => getObjectPropertyDict()}>
        {'test'}
      </button>
      <button className="zoom-on-click-button" onClick={() => birdsView()}>
        BirdUp
      </button>
      <div className={`side-panel right ${isPanelOpen ? 'open' : ''}`}>
          <h2>Properties</h2>
          <ul>
          {Object.keys(propertySets).map((key, index) => (
              <li key={index}>
                <strong>{key}:</strong> {propertySets[key]?.value || propertySets[key]}
              </li>
            ))}
          </ul>
      </div>
      <div className={`side-panel left ${isOBJPanelOpen ? 'open' : ''}`}>
        <h2>Object Explorer</h2>
        {renderOBJPropertyDict(OBJpropertyDict)}
      </div>
      <div id="container" ref={containerRef} style={{ width: '100%', height: '100vh' }}></div>
    </div>
  );
};

export default IfcViewer;