import * as THREE from "three";
import {ModelImporter} from "../importers/ModelImporter";

export class AssetManager {
  private readonly importer = new ModelImporter();
  private readonly root = new THREE.Group();

  constructor(scene: THREE.Scene) {
    this.root.name = "ImportedAssets";
    scene.add(this.root);
  }

  async loadModel(file: File): Promise<THREE.Object3D> {
    const model = await this.importer.fromFile(file);
    model.name = file.name;
    this.clear();
    this.root.add(model);
    return model;
  }

  clear() {
    this.root.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        material.dispose();
      }
    });
    this.root.clear();
  }
}
