import * as THREE from "three";
import {extractImages,extractMaterials,extractMeshes,extractObjects,parseBlend} from "jsblender";

type BlendMesh=ReturnType<typeof extractMeshes>[number];
type BlendMaterial=ReturnType<typeof extractMaterials>[number];

function basename(value:string):string{
  const clean=value.replace(/\\/g,"/").split("?")[0].split("#")[0];
  return decodeURIComponent(clean.split("/").pop()||clean).replace(/^\\+/,"").toLowerCase();
}

function findFile(files:File[],path:string):File|undefined{
  const wanted=basename(path);
  return files.find(file=>file.name.toLowerCase()===wanted)??files.find(file=>basename(file.name)===wanted);
}

function createGeometry(mesh:BlendMesh):THREE.BufferGeometry{
  const geometry=new THREE.BufferGeometry();
  const triangleCount=mesh.triangles.length/3;
  const positions=new Float32Array(triangleCount*9);
  const normals=new Float32Array(triangleCount*9);
  const uvNames=Object.keys(mesh.uvMaps);
  const uv=uvNames.length?new Float32Array(triangleCount*6):undefined;

  for(let triangle=0;triangle<triangleCount;triangle++){
    for(let corner=0;corner<3;corner++){
      const triangleIndex=triangle*3+corner;
      const vertexIndex=mesh.triangles[triangleIndex];
      const dst=triangleIndex*3;
      positions[dst]=mesh.vertices[vertexIndex*3];
      positions[dst+1]=mesh.vertices[vertexIndex*3+1];
      positions[dst+2]=mesh.vertices[vertexIndex*3+2];
      if(mesh.vertexNormals.length>=vertexIndex*3+3){
        normals[dst]=mesh.vertexNormals[vertexIndex*3];
        normals[dst+1]=mesh.vertexNormals[vertexIndex*3+1];
        normals[dst+2]=mesh.vertexNormals[vertexIndex*3+2];
      }
      if(uv){
        const map=mesh.uvMaps[uvNames[0]];
        uv[triangleIndex*2]=map[triangleIndex*2];
        uv[triangleIndex*2+1]=map[triangleIndex*2+1];
      }
    }
  }

  geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
  geometry.setAttribute("normal",new THREE.BufferAttribute(normals,3));
  if(uv) geometry.setAttribute("uv",new THREE.BufferAttribute(uv,2));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createMaterials(mesh:BlendMesh,byName:Map<string,BlendMaterial>,textures:Map<string,THREE.Texture>):THREE.Material[]{
  const names=mesh.materialSlotNames.length?mesh.materialSlotNames:["Material"];
  return names.map(name=>{
    const source=byName.get(name);
    const p=source?.shader?.principled;
    const diffuse=source?.diffuse;
    const material=new THREE.MeshStandardMaterial({
      name,
      color:diffuse?new THREE.Color(diffuse[0],diffuse[1],diffuse[2]):new THREE.Color(.72,.72,.72),
      metalness:source?.metallic??0,
      roughness:source?.roughness??.7
    });
    if(p?.baseColorImage) material.map=textures.get(basename(p.baseColorImage))||null;
    if(p?.normalImage) material.normalMap=textures.get(basename(p.normalImage))||null;
    if(p?.roughnessImage) material.roughnessMap=textures.get(basename(p.roughnessImage))||null;
    if(p?.metallicImage) material.metalnessMap=textures.get(basename(p.metallicImage))||null;
    material.needsUpdate=true;
    return material;
  });
}

async function loadTextures(blend:ReturnType<typeof parseBlend>,files:File[]){
  const textures=new Map<string,THREE.Texture>();
  const temporaryUrls:string[]=[];
  const loader=new THREE.TextureLoader();

  for(const image of extractImages(blend)){
    let url:string|undefined;
    if(image.packed?.length){
      url=URL.createObjectURL(new Blob([image.packed],{type:"image/png"}));
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

export class BlendImporter{
  async fromFiles(files:File[]):Promise<THREE.Object3D>{
    const modelFile=files.find(file=>/\.blend$/i.test(file.name));
    if(!modelFile) throw new Error("No .blend file selected.");

    let blend:ReturnType<typeof parseBlend>;
    try{
      blend=parseBlend(new Uint8Array(await modelFile.arrayBuffer()));
    }catch(error){
      throw new Error(error instanceof Error?"Blender import failed: "+error.message:"Blender import failed.");
    }

    const root=new THREE.Group();
    root.name=modelFile.name;
    const blendMeshes=extractMeshes(blend);
    const blendMaterials=extractMaterials(blend);
    const blendObjects=extractObjects(blend);
    const textures=await loadTextures(blend,files);
    const materialsByName=new Map(blendMaterials.map(material=>[material.name,material]));
    const meshTemplates=new Map<string,THREE.Object3D>();

    for(const mesh of blendMeshes){
      const geometry=createGeometry(mesh);
      const materials=createMaterials(mesh,materialsByName,textures);
      const object=new THREE.Mesh(geometry,materials.length===1?materials[0]:materials);
      object.name=mesh.name;
      meshTemplates.set(mesh.name,object);
    }

    const objectsByName=new Map<string,THREE.Object3D>();
    for(const objectData of blendObjects){
      if(objectData.type!==1||!objectData.dataName) continue;
      const template=meshTemplates.get(objectData.dataName);
      if(!template) continue;
      const instance=template.clone();
      instance.name=objectData.name;
      instance.position.set(...objectData.location);
      instance.rotation.set(...objectData.rotation);
      instance.scale.set(...objectData.scale);
      objectsByName.set(objectData.name,instance);
    }

    for(const objectData of blendObjects){
      const object=objectsByName.get(objectData.name);
      if(!object) continue;
      const parent=objectData.parentName?objectsByName.get(objectData.parentName):undefined;
      (parent??root).add(object);
    }

    if(objectsByName.size===0){
      for(const template of meshTemplates.values()) root.add(template);
    }

    root.userData.blendVersion=blend.header.versionString;
    return root;
  }

  async fromFile(file:File):Promise<THREE.Object3D>{
    return this.fromFiles([file]);
  }
}
