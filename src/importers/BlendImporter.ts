import * as THREE from "three";
import {
  evaluateAllMeshes,
  extractArmatures,
  extractImages,
  extractMaterials,
  extractMeshes,
  extractObjects,
  parseBlend
} from "jsblender";

type BlendMesh=ReturnType<typeof extractMeshes>[number];
type BlendMaterial=ReturnType<typeof extractMaterials>[number];

function basename(value:string):string{
  const clean=value.replace(/\\/g,"/").split("?")[0].split("#")[0];
  return decodeURIComponent(clean.split("/").pop()||clean).replace(/^\\+/,"").toLowerCase();
}

function findFile(files:File[],path:string):File|undefined{
  const wanted=basename(path);
  return files.find(file=>basename(file.name)===wanted);
}

function createGeometry(mesh:BlendMesh):THREE.BufferGeometry{
  const geometry=new THREE.BufferGeometry();
  const uvNames=Object.keys(mesh.uvMaps);
  const map=uvNames.length?mesh.uvMaps[uvNames[0]]:undefined;
  const positions:number[]=[];
  const normals:number[]=[];
  const uvs:number[]=[];
  const groups:Array<{start:number;count:number;materialIndex:number}>=[];

  let firstIndex=0;
  for(let face=0;face<mesh.faceCount;face++){
    const start=mesh.faceOffsets[face];
    const end=mesh.faceOffsets[face+1];
    const corners=end-start;
    if(corners<3) continue;

    const materialIndex=Math.min(
      mesh.materialSlotNames.length-1,
      mesh.materialIndices[face]??0
    );

    for(let fan=1;fan<corners-1;fan++){
      const cornerIndices=[start,start+fan,start+fan+1];
      for(const cornerIndex of cornerIndices){
        const vertexIndex=mesh.cornerVertices[cornerIndex];
        positions.push(
          mesh.vertices[vertexIndex*3]??0,
          mesh.vertices[vertexIndex*3+1]??0,
          mesh.vertices[vertexIndex*3+2]??0
        );

        if(mesh.vertexNormals.length>=vertexIndex*3+3){
          normals.push(
            mesh.vertexNormals[vertexIndex*3],
            mesh.vertexNormals[vertexIndex*3+1],
            mesh.vertexNormals[vertexIndex*3+2]
          );
        }else{
          normals.push(0,0,0);
        }

        if(map&&map.length>=cornerIndex*2+2){
          uvs.push(map[cornerIndex*2],map[cornerIndex*2+1]);
        }
      }
    }

    const count=(corners-2)*3;
    const previous=groups[groups.length-1];
    if(previous&&previous.materialIndex===materialIndex&&previous.start+previous.count===firstIndex){
      previous.count+=count;
    }else{
      groups.push({start:firstIndex,count,materialIndex});
    }
    firstIndex+=count;
  }

  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));
  if(uvs.length) geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));

  for(const group of groups){
    if(group.materialIndex>=0) geometry.addGroup(group.start,group.count,group.materialIndex);
  }

  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  if(!mesh.vertexNormals.length) geometry.computeVertexNormals();
  return geometry;
}

function createMaterials(
  mesh:BlendMesh,
  byName:Map<string,BlendMaterial>,
  textures:Map<string,THREE.Texture>
):THREE.Material[]{
  const names=mesh.materialSlotNames.length?mesh.materialSlotNames:["Material"];

  return names.map(name=>{
    const source=byName.get(name);
    const p=source?.shader?.principled;
    const base=p?.baseColor??source?.diffuse??[0.72,0.72,0.72,1];
    const material=new THREE.MeshStandardMaterial({
      name,
      color:new THREE.Color(base[0],base[1],base[2]),
      metalness:p?.metallic??source?.metallic??0,
      roughness:p?.roughness??source?.roughness??0.7,
      transparent:(p?.alpha??base[3]??1)<0.999,
      opacity:p?.alpha??base[3]??1
    });

    if(p?.baseColorImage) material.map=textures.get(basename(p.baseColorImage))||null;
    if(p?.normalImage) material.normalMap=textures.get(basename(p.normalImage))||null;
    if(p?.roughnessImage) material.roughnessMap=textures.get(basename(p.roughnessImage))||null;
    if(p?.metallicImage) material.metalnessMap=textures.get(basename(p.metallicImage))||null;

    material.needsUpdate=true;
    return material;
  });
}

async function loadTextures(
  blend:ReturnType<typeof parseBlend>,
  files:File[]
):Promise<Map<string,THREE.Texture>>{
  const textures=new Map<string,THREE.Texture>();
  const temporaryUrls:string[]=[];
  const loader=new THREE.TextureLoader();

  for(const image of extractImages(blend)){
    let url:string|undefined;

    if(image.packed?.length){
      const bytes=new Uint8Array(image.packed);
      url=URL.createObjectURL(
        new Blob([bytes.buffer as ArrayBuffer],{type:"image/png"})
      );
    }else{
      const file=findFile(files,image.filepath);
      if(file) url=URL.createObjectURL(file);
    }

    if(!url) continue;
    temporaryUrls.push(url);

    try{
      const texture=await loader.loadAsync(url);
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.flipY=false;
      textures.set(basename(image.name),texture);
      textures.set(basename(image.filepath),texture);
    }catch(error){
      console.warn("UVER: could not load Blender image",image.name,error);
    }
  }

  for(const url of temporaryUrls) URL.revokeObjectURL(url);
  return textures;
}

function copyCustomProperties(
  target:THREE.Object3D,
  properties:Record<string,unknown>|undefined
){
  if(properties) target.userData.blenderProperties=properties;
}

export class BlendImporter{
  async fromFiles(files:File[]):Promise<THREE.Object3D>{
    const modelFile=files.find(file=>/\.blend$/i.test(file.name));
    if(!modelFile) throw new Error("No .blend file selected.");

    let blend:ReturnType<typeof parseBlend>;
    try{
      blend=parseBlend(new Uint8Array(await modelFile.arrayBuffer()));
    }catch(error){
      throw new Error(
        error instanceof Error
          ?"Blender import failed: "+error.message
          :"Blender import failed."
      );
    }

    const root=new THREE.Group();
    root.name=modelFile.name;

    const blendMeshes=extractMeshes(blend);
    const evaluatedMeshes=evaluateAllMeshes(blend);
    const blendMaterials=extractMaterials(blend);
    const blendObjects=extractObjects(blend);
    const armatures=extractArmatures(blend);
    const textures=await loadTextures(blend,files);
    const materialsByName=new Map(blendMaterials.map(material=>[material.name,material]));

    const meshTemplates=new Map<string,THREE.Object3D>();

    for(const mesh of blendMeshes){
      const evaluated=evaluatedMeshes.get(
        blendObjects.find(object=>object.type===1&&object.dataName===mesh.name)?.name||""
      );
      const sourceMesh=evaluated??mesh;
      const geometry=createGeometry(sourceMesh);
      const materials=createMaterials(sourceMesh,materialsByName,textures);
      const object=new THREE.Mesh(
        geometry,
        materials.length===1?materials[0]:materials
      );
      object.name=mesh.name;
      copyCustomProperties(object,mesh.customProperties);
      meshTemplates.set(mesh.name,object);
    }

    const objectsByName=new Map<string,THREE.Object3D>();

    for(const objectData of blendObjects){
      if(objectData.type!==1||!objectData.dataName) continue;
      const template=meshTemplates.get(objectData.dataName);
      if(!template) continue;

      const instance=template.clone(true);
      instance.name=objectData.name;
      instance.position.set(...objectData.location);
      instance.rotation.set(...objectData.rotation);
      instance.scale.set(...objectData.scale);
      copyCustomProperties(instance,objectData.customProperties);
      objectsByName.set(objectData.name,instance);
    }

    for(const objectData of blendObjects){
      const object=objectsByName.get(objectData.name);
      if(!object) continue;
      const parent=objectData.parentName
        ?objectsByName.get(objectData.parentName)
        :undefined;
      (parent??root).add(object);
    }

    if(objectsByName.size===0){
      for(const template of meshTemplates.values()) root.add(template);
    }

    root.userData.blendVersion=blend.header.versionString;
    root.userData.blenderArmatures=armatures.map(armature=>({
      name:armature.name,
      bones:armature.bones,
      customProperties:armature.customProperties
    }));

    return root;
  }

  async fromFile(file:File):Promise<THREE.Object3D>{
    return this.fromFiles([file]);
  }
}
