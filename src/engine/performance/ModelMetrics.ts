import * as THREE from "three";

export interface ModelMetrics {
  meshes:number;
  skinnedMeshes:number;
  vertices:number;
  triangles:number;
  materials:number;
  textures:number;
  textureMB:number;
  bones:number;
}

function textureSize(texture:THREE.Texture):number {
  const image=texture.image as {width?:number;height?:number}|undefined;
  const width=image?.width||0;
  const height=image?.height||0;
  if(!width||!height)return 0;
  return width*height*4*1.33/(1024*1024);
}

export function measureModel(root:THREE.Object3D):ModelMetrics {
  let meshes=0,skinnedMeshes=0,vertices=0,triangles=0,bones=0,textureMB=0;
  const materials=new Set<string>();
  const textures=new Map<string,THREE.Texture>();

  root.traverse(object=>{
    const mesh=object as THREE.Mesh;
    if(!mesh.isMesh)return;

    meshes++;
    if((mesh as THREE.SkinnedMesh).isSkinnedMesh){
      skinnedMeshes++;
      bones+=((mesh as THREE.SkinnedMesh).skeleton?.bones.length||0);
    }

    const position=mesh.geometry.getAttribute("position");
    if(position){
      vertices+=position.count;
      const index=mesh.geometry.getIndex();
      triangles+=index?Math.floor(index.count/3):Math.floor(position.count/3);
    }

    const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    for(const material of list){
      if(!material)continue;
      materials.add(material.uuid);

      for(const key of [
        "map","normalMap","roughnessMap","metalnessMap",
        "aoMap","emissiveMap","alphaMap"
      ] as const){
        const texture=(material as unknown as Record<string,THREE.Texture|undefined>)[key];
        if(texture && !textures.has(texture.uuid)){
          textures.set(texture.uuid,texture);
          textureMB+=textureSize(texture);
        }
      }
    }
  });

  return {
    meshes,
    skinnedMeshes,
    vertices,
    triangles,
    materials:materials.size,
    textures:textures.size,
    textureMB,
    bones
  };
}
