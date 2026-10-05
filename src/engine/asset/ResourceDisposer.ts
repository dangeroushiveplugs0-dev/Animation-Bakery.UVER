import * as THREE from "three";

export function disposeObject3D(root:THREE.Object3D,disposeTextures=true):void{
  const textures=new Set<THREE.Texture>();
  const materials=new Set<THREE.Material>();
  const geometries=new Set<THREE.BufferGeometry>();
  const skeletons=new Set<THREE.Skeleton>();

  root.traverse(object=>{
    const renderable=object as THREE.Object3D & {
      geometry?:THREE.BufferGeometry;
      material?:THREE.Material|THREE.Material[];
      skeleton?:THREE.Skeleton;
    };

    if(renderable.geometry instanceof THREE.BufferGeometry){
      geometries.add(renderable.geometry);
    }

    if(renderable.skeleton instanceof THREE.Skeleton){
      skeletons.add(renderable.skeleton);
    }

    const list=Array.isArray(renderable.material)
      ?renderable.material
      :renderable.material?[renderable.material]:[];

    for(const material of list){
      if(!(material instanceof THREE.Material)) continue;
      materials.add(material);

      if(disposeTextures){
        for(const key of Object.keys(material as unknown as Record<string,unknown>)){
          const value=(material as unknown as Record<string,unknown>)[key];
          if(value instanceof THREE.Texture) textures.add(value);
        }
      }
    }
  });

  skeletons.forEach(value=>value.boneTexture?.dispose());
  geometries.forEach(value=>value.dispose());
  materials.forEach(value=>value.dispose());
  if(disposeTextures) textures.forEach(value=>value.dispose());
}
