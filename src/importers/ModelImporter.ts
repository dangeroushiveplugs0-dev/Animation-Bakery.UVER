import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader.js";
import {applyGltfMaterialCompatibility} from "./GltfMaterialCompatibility";
import {BlendImporter} from "./BlendImporter";

export class ModelImporter{
  private readonly blendImporter=new BlendImporter();

  async fromFiles(files:File[]):Promise<THREE.Object3D>{
    if(!files.length) throw new Error("No model file selected.");
    const modelFile=files.find(file=>/\.(blend|glb|gltf|obj)$/i.test(file.name));
    if(!modelFile) throw new Error("Unsupported model format. Use BLEND, GLB, GLTF, or OBJ.");

    const name=modelFile.name.toLowerCase();
    if(name.endsWith(".blend")) return this.blendImporter.fromFiles(files);

    if(name.endsWith(".glb")){
      const loader=new GLTFLoader();
      const result=await loader.parseAsync(await modelFile.arrayBuffer(),"");
      applyGltfMaterialCompatibility(result.scene);
      return result.scene;
    }

    if(name.endsWith(".gltf")){
      const manager=new THREE.LoadingManager();
      const urls=new Map<string,string>();
      for(const file of files) urls.set(file.name,URL.createObjectURL(file));
      manager.setURLModifier(requestedUrl=>{
        const clean=requestedUrl.split("?")[0].split("#")[0];
        const fileName=decodeURIComponent(clean.split("/").pop()||clean);
        return urls.get(fileName)||requestedUrl;
      });
      const loader=new GLTFLoader(manager);
      const url=URL.createObjectURL(modelFile);
      try{
        const result=await loader.loadAsync(url);
        applyGltfMaterialCompatibility(result.scene);
        return result.scene;
      }finally{
        URL.revokeObjectURL(url);
        for(const value of urls.values()) URL.revokeObjectURL(value);
      }
    }

    return new OBJLoader().parse(await modelFile.text());
  }

  async fromFile(file:File):Promise<THREE.Object3D>{
    return this.fromFiles([file]);
  }
}
