import * as THREE from "three";
import {ModelImporter} from "../importers/ModelImporter";
import type {AssetLifecycle} from "../core/asset/AssetLifecycle";

export class AssetManager implements AssetLifecycle {
  private readonly importer = new ModelImporter();
  private readonly root = new THREE.Group();

  constructor(scene: THREE.Scene) {
    this.root.name = "ImportedAssets";
    scene.add(this.root);
  }

  async import(source: File): Promise<THREE.Object3D> {
    return this.importer.fromFile(source);
  }

  async loadModel(file: File): Promise<THREE.Object3D> {
    const model = await this.import(file);
    model.name = file.name;
    await this.replaceCurrent(model);
    return model;
  }

  async replaceCurrent(asset: THREE.Object3D): Promise<void> {
    this.clear();
    this.root.add(asset);
  }

  clearWorkingScene() {
    this.clear();
  }

  preserveOriginal() {
    return true;
  }

  dispose(asset: unknown) {
    if (!(asset instanceof THREE.Object3D)) return;
    this.disposeObject(asset);
  }

  private disposeObject(root: THREE.Object3D) {
    root.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.geometry?.dispose();

      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      for (const material of materials) {
        for (const key of [
          "map",
          "normalMap",
          "roughnessMap",
          "metalnessMap",
          "aoMap",
          "emissiveMap",
          "alphaMap"
        ] as const) {
          const texture = (material as THREE.MeshStandardMaterial)[key];
          texture?.dispose();
        }
        material.dispose();
      }
    });
  }

  clear() {
    this.disposeObject(this.root);
    this.root.clear();
  }
}
