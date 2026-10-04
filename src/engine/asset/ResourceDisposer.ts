import * as THREE from "three";

const TEXTURE_KEYS = [
  "map","normalMap","roughnessMap","metalnessMap","aoMap",
  "emissiveMap","alphaMap","clearcoatMap","clearcoatNormalMap",
  "clearcoatRoughnessMap"
] as const;

export function disposeObject3D(root: THREE.Object3D, disposeTextures = true): void {
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();

  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;

    if (mesh.geometry) geometries.add(mesh.geometry);

    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of list) {
      if (!material) continue;
      materials.add(material);

      if (disposeTextures) {
        for (const key of TEXTURE_KEYS) {
          const texture = (material as THREE.MeshStandardMaterial)[key];
          if (texture) textures.add(texture);
        }
      }
    }
  });

  geometries.forEach(value => value.dispose());
  materials.forEach(value => value.dispose());
  if (disposeTextures) textures.forEach(value => value.dispose());
}
