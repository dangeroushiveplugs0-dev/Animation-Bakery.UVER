import * as THREE from "three";

const REFLECTION_MATERIAL_PATTERN=/refl/i;

export function applyGltfMaterialCompatibility(root:THREE.Object3D):void{
  root.traverse(object=>{
    const mesh=object as THREE.Mesh;
    if(!mesh.isMesh) return;

    const materials=Array.isArray(mesh.material)
      ?mesh.material
      :[mesh.material];

    const hasTexturedNonReflectionMaterial=materials.some(material=>{
      if(!material||REFLECTION_MATERIAL_PATTERN.test(material.name)) return false;
      const standard=material as THREE.MeshStandardMaterial;
      return !!standard.map;
    });

    for(const material of materials){
      if(!material||!REFLECTION_MATERIAL_PATTERN.test(material.name)) continue;

      // Only suppress a reflection overlay when the same mesh has an actual
      // textured material underneath it. Reflection-named standalone meshes
      // are left completely intact so details such as eyes/ears/accessories
      // cannot disappear just because of their material name.
      if(!hasTexturedNonReflectionMaterial) continue;

      material.transparent=true;
      material.opacity=0;
      material.depthWrite=false;
      material.needsUpdate=true;
    }
  });
}
