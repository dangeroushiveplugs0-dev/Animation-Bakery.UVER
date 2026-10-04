import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader.js";

export class ModelImporter {
  private readonly gltf = new GLTFLoader();
  private readonly obj = new OBJLoader();

  async fromFile(file: File): Promise<THREE.Object3D> {
    const name = file.name.toLowerCase();
    if (name.endsWith(".glb")) {
      const buffer = await file.arrayBuffer();
      const result = await this.gltf.parseAsync(buffer, "");
      return result.scene;
    }
    if (name.endsWith(".gltf")) {
      const url = URL.createObjectURL(file);
      try {
        return await this.gltf.loadAsync(url).then(result => result.scene);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    if (name.endsWith(".obj")) {
      return this.obj.parse(await file.text());
    }
    throw new Error("Unsupported model format. Use GLB, GLTF, or OBJ.");
  }
}
