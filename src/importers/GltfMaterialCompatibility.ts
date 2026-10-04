import * as THREE from "three";

const REFLECTION_MATERIAL_PATTERN=/refl/i;

export function applyGltfMaterialCompatibility(root:THREE.Object3D):void{
  root.traverse(object=>{
    const mesh=object as THREE.Mesh;
    if(!mesh.isMesh) return;

    const materials=Array.isArray(mesh.material)
      ?mesh.material
      :[mesh.material];

    const hasNonReflectionMaterial=materials.some(
      material=>!!material&&!REFLECTION_MATERIAL_PATTERN.test(material.name)
    );

    for(const material of materials){
      if(!material||!REFLECTION_MATERIAL_PATTERN.test(material.name)) continue;

      // Reflection-overlay materials are only suppressed when the same mesh
      // also has a real non-reflection material underneath them. This prevents
      // the compatibility pass from deleting standalone parts such as eyes,
      // ears, small accessories, or other reflection-named meshes.
      if(!hasNonReflectionMaterial) continue;

      // Some exporters create reflection-overlay materials for another
      // renderer. An opaque Three.js fallback would cover the real texture.
      material.transparent=true;
      material.opacity=0;
      material.depthWrite=false;
      material.needsUpdate=true;
    }
  });
}