import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader.js";

export class ModelImporter {
  async fromFiles(files: File[]): Promise<THREE.Object3D> {
    if (!files.length) throw new Error("No model file selected.");

    const modelFile = files.find(file => /\.(glb|gltf|obj)$/i.test(file.name));
    if (!modelFile) {
      throw new Error("Unsupported model format. Use GLB, GLTF, or OBJ.");
    }

    const name = modelFile.name.toLowerCase();

    if (name.endsWith(".glb")) {
      const loader = new GLTFLoader();
      const buffer = await modelFile.arrayBuffer();
      const result = await loader.parseAsync(buffer, "");
      return result.scene;
    }

    if (name.endsWith(".gltf")) {
      const manager = new THREE.LoadingManager();
      const urls = new Map<string,string>();

      for (const file of files) {
        urls.set(file.name, URL.createObjectURL(file));
      }

      manager.setURLModifier(requestedUrl => {
        const clean = requestedUrl.split("?")[0].split("#")[0];
        const fileName = decodeURIComponent(clean.split("/").pop() || clean);
        return urls.get(fileName) || requestedUrl;
      });

      const loader = new GLTFLoader(manager);
      const url = URL.createObjectURL(modelFile);

      try {
        const result = await loader.loadAsync(url);
        return result.scene;
      } finally {
        URL.revokeObjectURL(url);
        for (const value of urls.values()) URL.revokeObjectURL(value);
      }
    }

    const loader = new OBJLoader();
    return loader.parse(await modelFile.text());
  }

  async fromFile(file: File): Promise<THREE.Object3D> {
    return this.fromFiles([file]);
  }
}
