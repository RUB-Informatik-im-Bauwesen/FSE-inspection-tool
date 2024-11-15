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
    highlighter.events.select.onHighlight.add(async (data) => { // HIGHLIGHT WHEN CLICKING ON FRAGMENTS, GET PROPERTIES OF FRAGMENTS //TODO: GET COORDINATES OF FRAGMENTS
      let modelID = null;
      let fragmentsSet = null; 
      console.log("Data:", data);

      for (const fragmentID in data) {
        console.log("Fragment ID:", fragmentID);
        const fragment = fragmentsRef.current.list.get(fragmentID);
        if (!fragment) {
            console.error("Fragment not found.");
            continue;
        }
        modelID = fragment.group?.uuid;
        fragmentsSet = data[fragmentID];
      }
      console.log("FRAGMENTSREF:", fragmentsRef.current);
      const ids = getKeys(data);
      if (fragmentsSet) {
          const [expressID] = fragmentsSet.values(); // get expressID from the ids
          console.log("fragmentID:", fragmentsSet);
          console.log("Express ID:", expressID);
          const fragmentGroups = fragmentsRef.current.groups; // Get the FragmentsGroups
          const fragmentGroup = fragmentGroups.get(modelID); // Get the corresponding fragmentGroup that has been clicked
          if (fragmentGroup) {
              const fragmentProperties = await fragmentGroup.getProperties(expressID);
              console.log("Fragment properties:", fragmentProperties); 
              console.log("isArray:", Array.isArray(fragmentProperties))
              const updatedProperties = await replaceType5Properties(fragmentGroup, fragmentProperties);
              updatedProperties.className = updatedProperties.constructor.name;
              console.log("Fragment properties AFTER:", await fragmentGroup.getProperties(expressID)); 
              setPropertySets(updatedProperties); // Update state with the properties
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
  const replaceType5Properties = async (fragmentGroup, properties) => {
    const traverseAndReplace = async (props) => {
      let hasType5 = false;
  
      for (const key in props) {
        const property = props[key];
        if (property && typeof property === 'object') {
          if (property.type === 5) {
            const expressID = property.value;
            const newProperties = await fragmentGroup.getProperties(expressID);
            props[key] = await traverseAndReplace(newProperties); // Recursively replace type 5 properties
            hasType5 = true;
          } else {
            // Recursively check nested properties
            props[key] = await traverseAndReplace(property);
          }
        }
      }
  
      return props;
    };
  
    return await traverseAndReplace(properties);
  };
  const resolvePropertyRelationships = async() => {
    const fragmentGroups = Array.from(fragmentsRef.current.groups.values());
    const promises = fragmentGroups.map(async (group) => {
      if (group.hasProcessedProperties) {
        return;
      }

      const localProperties = group.getLocalProperties();
    
      // Filter properties to include only IfcRelDefinesByProperties
      const ifcRelDefinesByProperties = Object.values(localProperties).filter(
        (property) => property.type === 4186316022
      );
      for (const property of ifcRelDefinesByProperties) {
        const relatingPropertyDefinitionID = property.RelatingPropertyDefinition.value;
        const relatingPropertyDefinition = await group.getProperties(relatingPropertyDefinitionID);
        const relatingPropertyDefinitionName = relatingPropertyDefinition.Name.value;

        for (const relatedObject of property.RelatedObjects) {
          const relatedObjectID = relatedObject.value;
          const relatedObjectProperties = await group.getProperties(relatedObjectID);
    
          // Append relatingPropertyDefinition to relatedObjectProperties
          relatedObjectProperties[relatingPropertyDefinitionName] = relatingPropertyDefinition;
        }
      }
      // Set the flag to indicate that the group has been processed
      group.hasProcessedProperties = true;
    });
    await Promise.all(promises);
  };

  const getTest = async() => {
    console.log("Fragmentsmanager: ", Array.from(fragmentsRef.current.groups.values()));
    const temp = Array.from(fragmentsRef.current.groups.values());
    const firstGroup = temp[0]; // Access the first element
    console.log("First Group: ", firstGroup);
    console.log("First Group local properties: ", firstGroup.getLocalProperties());
    const localProperties = firstGroup.getLocalProperties();
  
    // Filter properties to include only IfcRelDefinesByProperties
    const ifcRelDefinesByProperties = Object.values(localProperties).filter(
      (property) => property.type === 4186316022
    );
    console.log("IfcRelDefinesByProperties: ", ifcRelDefinesByProperties);
    for (const property of ifcRelDefinesByProperties) {
      const relatingPropertyDefinitionID = property.RelatingPropertyDefinition.value;
      const relatingPropertyDefinition = await firstGroup.getProperties(relatingPropertyDefinitionID);
      console.log(`RelatingPropertyDefinition for ${relatingPropertyDefinitionID}: `, relatingPropertyDefinition);
      const relatingPropertyDefinitionName = relatingPropertyDefinition.Name.value;

      for (const relatedObject of property.RelatedObjects) {
        const relatedObjectID = relatedObject.value;
        const relatedObjectProperties = await firstGroup.getProperties(relatedObjectID);
        console.log(`RelatedObjectProperties for ${relatedObjectID}: `, relatedObjectProperties);
  
        // Append relatingPropertyDefinition to relatedObjectProperties
        relatedObjectProperties[relatingPropertyDefinitionName] = relatingPropertyDefinition;
        console.log(`Updated RelatedObjectProperties for ${relatedObjectID}: `, relatedObjectProperties);
      }
    }
    const expressID = 968;
    console.log("First Group object: ", firstGroup.getProperties(expressID));
    console.log("First Group expressID 71: ", firstGroup.getProperties(71));
    const id = firstGroup.getAllPropertiesIDs() // get all IDs of the fragments in the group
    const fragMap = firstGroup.getFragmentMap(id) 
    console.log("IDs: ", id);
    console.log("First Group prop Fragment map: ", fragMap);
    const vert = firstGroup.getItemVertices(expressID) 
    console.log("First Group prop Vertices: ", vert);
    const guids =fragmentsRef.current.fragmentIdMapToGuids(fragMap)
    console.log("GUIDS: ", guids)
    const fragMap2 =fragmentsRef.current.guidToFragmentIdMap(guids)
    console.log("NEW FRAGMAP: ", fragMap2)
  };
  const getObjectPropertyDict = async () => { // TODO: HIGHLIGHT CLICKED GROUP
    const groupsDictionary = {}; // key correspond to the group name, value is a dictionary of properties
    const fragmentGroups = Array.from(fragmentsRef.current.groups.values()); // get all groups in an array (they correspond to IFC files)
    console.log("fragmentsmanager: ",fragmentsRef.current)
    const promises = fragmentGroups.map(async (group) => {
      const propertyDictionary = {}; // key correspond to the property className, value is name, id, type
      const propTypes_unique = group.getAllPropertiesTypes();
  
      const typePromises = propTypes_unique.map(async (type) => {
        const properties = await group.getAllPropertiesOfType(type);
        console.log("PROPERTIES: ",properties)
        console.log("GROUP: ",group)
        if (properties) {
          for (const id in properties) {
            const property = properties[id];
            if (!hasInheritedFromPhysical(property)) {
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
      console.log("GROUP: ", group);
      groupsDictionary[group.name] = propertyDictionary;
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
  const hasInheritedFromPhysical = (obj) => {
    let proto = Object.getPrototypeOf(obj);
    while (proto) {
      if (proto.constructor.name === 'IfcBuildingElement' || proto.constructor.name === 'IfcPhysicalComplexQuantity') {
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
      model.name = file.name;
      worldRef.current.scene.three.add(model);
      console.log("Model loaded successfully:", model);
      modelIDRef.current = model.modelID;
      console.log("Model ID:", modelIDRef.current);
      console.log("FILENAME: ",file.name);
      getObjectPropertyDict(); // fill the object explorer panel
      resolvePropertyRelationships(); // resolve the property relationships for property display
    } catch (error) {
      console.error("Error loading IFC model:", error);
    }
  };
  const renderPropertySets = (propertySets) => {
    const renderValue = (value) => {
      if (typeof value === 'object' && value !== null) {
        if ('value' in value) {
          return value.value;
        } else {
          return (
            <ul>
              {Object.entries(value).map(([key, val], index) => (
                <li key={index}>
                  <strong>{key}:</strong> {renderValue(val)}
                </li>
              ))}
            </ul>
          );
        }
      } else {
        return value;
      }
    };
  
    return (
      <ul>
        {Object.entries(propertySets).map(([key, value], index) => (
          <li key={index}>
            <strong>{key}:</strong> {renderValue(value)}
          </li>
        ))}
      </ul>
    );
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
      <button className="toggle-panel-button" onClick={() => getTest()}>
        {'test'}
      </button>
      <button className="zoom-on-click-button" onClick={() => birdsView()}>
        BirdUp
      </button>
      <div className={`side-panel right ${isPanelOpen ? 'open' : ''}`}>
        <h2>Properties</h2>
        {renderPropertySets(propertySets)}
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