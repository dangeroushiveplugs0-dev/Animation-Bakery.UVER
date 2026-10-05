import * as THREE from "three";
import {ModelImporter} from "../importers/ModelImporter";
import type {AssetLifecycle} from "../core/asset/AssetLifecycle";
import {disposeObject3D} from "./asset/ResourceDisposer";

export class AssetManager implements AssetLifecycle{
  private readonly importer=new ModelImporter();
  private readonly root=new THREE.Group();
  private readonly renderer?:THREE.WebGLRenderer;

  constructor(scene:THREE.Scene,renderer?:THREE.WebGLRenderer){
    this.root.name="ImportedAssets";
    scene.add(this.root);
    this.renderer=renderer;
  }

  async import(source:File):Promise<THREE.Object3D>{return this.importer.fromFile(source);}
  async loadModel(file:File):Promise<THREE.Object3D>{return this.loadModels([file]);}

  async loadModels(files:File[]):Promise<THREE.Object3D>{
    this.clear();
    const model=await this.importer.fromFiles(files);
    model.name=files.find(file=>/\.(blend|glb|gltf|obj)$/i.test(file.name))?.name||"ImportedModel";
    await this.replaceCurrent(model);
    return model;
  }

  async replaceCurrent(asset:THREE.Object3D):Promise<void>{
    this.clear();
    this.root.add(asset);
  }

  clearWorkingScene(){this.clear();}
  preserveOriginal(){return true;}

  dispose(asset:unknown){
    if(!(asset instanceof THREE.Object3D)) return;
    disposeObject3D(asset);
    this.renderer?.renderLists.dispose();
  }

  clear(){
    disposeObject3D(this.root);
    this.root.clear();
    this.renderer?.renderLists.dispose();
  }
}
