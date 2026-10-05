import {
  extractArmatures,
  extractCollections,
  extractMaterials,
  extractObjects,
  extractScenes
} from "jsblender";

type BlendData=ReturnType<Parameters<typeof extractObjects>[0] extends never ? never : any>;

type UnknownRecord=Record<string,unknown>;

function record(value:unknown):UnknownRecord{
  return value&&typeof value==="object"&&!Array.isArray(value)
    ?value as UnknownRecord
    :{};
}

function text(value:unknown):string{
  return typeof value==="string"?value:"";
}

function keyText(value:unknown):string{
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g,"");
}

function walkCollections(
  collections:ReturnType<typeof extractCollections>,
  result:Array<{name:string;objectNames:string[];children:string[];customProperties:UnknownRecord}>
){
  for(const collection of collections){
    const children=(collection.children??[]).map(child=>child.name);
    result.push({
      name:collection.name,
      objectNames:[...collection.objectNames],
      children,
      customProperties:record(collection.customProperties)
    });
    walkCollections(collection.children??[],result);
  }
}

function collectPropertySignals(value:unknown,signals:string[]){
  const props=record(value);
  for(const [key,item] of Object.entries(props)){
    signals.push(keyText(key));
    if(typeof item==="string") signals.push(keyText(item));
    if(item&&typeof item==="object"&&!Array.isArray(item)){
      collectPropertySignals(item,signals);
    }
  }
}

function looksLikeAny(value:string,names:string[]):boolean{
  return names.some(name=>value.includes(name));
}

function classifyCollections(
  collections:Array<{name:string;objectNames:string[];children:string[];customProperties:UnknownRecord}>
){
  const outfits=collections
    .filter(value=>{
      const key=keyText(value.name);
      return looksLikeAny(key,["outfit","clothing","cloth","wardrobe","costume","dress","armor","attire"]);
    })
    .map(value=>({
      id:"collection:"+value.name,
      name:value.name,
      objectNames:value.objectNames,
      visible:true,
      source:"blender" as const
    }));

  const hair=collections
    .filter(value=>{
      const key=keyText(value.name);
      return looksLikeAny(key,["hair","hairstyle","hairstyles","haircollection"]);
    })
    .map(value=>({
      id:"collection:"+value.name,
      name:value.name,
      objectNames:value.objectNames,
      visible:true,
      source:"blender" as const
    }));

  return {outfits,hair};
}

export interface BlenderCharacterMetadata{
  detected:boolean;
  providers:Array<"blender"|"mustardui"|"diffeomorphic">;
  collections:Array<{
    name:string;
    objectNames:string[];
    children:string[];
    customProperties:UnknownRecord;
  }>;
  scenes:Array<{
    name:string;
    fps:number;
    frameStart:number;
    frameEnd:number;
    frameCurrent:number;
    cameraObject?:string;
    customProperties:UnknownRecord;
  }>;
  objects:Array<{
    name:string;
    type:number;
    dataName?:string;
    parentName?:string;
    customProperties:UnknownRecord;
  }>;
  materials:Array<{
    name:string;
    customProperties:UnknownRecord;
  }>;
  armatures:Array<{
    name:string;
    bones:string[];
    customProperties:UnknownRecord;
  }>;
  outfits:ReturnType<typeof classifyCollections>["outfits"];
  hair:ReturnType<typeof classifyCollections>["hair"];
  customProperties:UnknownRecord;
  signals:string[];
}

export function inspectBlenderCharacterData(blend:ReturnType<typeof import("jsblender")["parseBlend"]>):BlenderCharacterMetadata{
  const collections:Array<BlenderCharacterMetadata["collections"][number]>=[];
  walkCollections(extractCollections(blend),collections);

  const scenes=extractScenes(blend).map(scene=>({
    name:scene.name,
    fps:scene.fps,
    frameStart:scene.frameStart,
    frameEnd:scene.frameEnd,
    frameCurrent:scene.frameCurrent,
    cameraObject:scene.cameraObject,
    customProperties:record(scene.customProperties)
  }));

  const objects=extractObjects(blend).map(object=>({
    name:object.name,
    type:object.type,
    dataName:object.dataName,
    parentName:object.parentName,
    customProperties:record(object.customProperties)
  }));

  const materials=extractMaterials(blend).map(material=>({
    name:material.name,
    customProperties:record(material.customProperties)
  }));

  const armatures=extractArmatures(blend).map(armature=>({
    name:armature.name,
    bones:flattenBones(armature.bones),
    customProperties:record(armature.customProperties)
  }));

  const signals:string[]=[];
  for(const value of [...collections,...scenes,...objects,...materials,...armatures]){
    collectPropertySignals(value.customProperties,signals);
  }
  for(const value of [...collections,...objects,...materials,...armatures]){
    signals.push(keyText(value.name));
  }

  const mustardui=signals.some(value=>looksLikeAny(value,[
    "mustardui","mustard","modelselection","mustarduioutfit","mustarduihair","mustarduimorph"
  ]));
  const diffeomorphic=signals.some(value=>looksLikeAny(value,[
    "diffeomorphic","daz","dazstudio","dazimporter","dazasset","dazfigure","dazmorph","dazjcm","erc"
  ]));

  const classified=classifyCollections(collections);

  return {
    detected:collections.length>0||objects.length>0||materials.length>0||armatures.length>0,
    providers:[
      "blender",
      ...(mustardui?["mustardui" as const]:[]),
      ...(diffeomorphic?["diffeomorphic" as const]:[])
    ],
    collections,
    scenes,
    objects,
    materials,
    armatures,
    outfits:classified.outfits,
    hair:classified.hair,
    customProperties:{},
    signals:[...new Set(signals)]
  };
}

function flattenBones(
  bones:Array<{name:string;children?:Array<{name:string;children?:any[]}>}>
):string[]{
  const result:string[]=[];
  const visit=(items:Array<{name:string;children?:Array<{name:string;children?:any[]}>}>)=>{
    for(const bone of items){
      result.push(bone.name);
      if(bone.children) visit(bone.children);
    }
  };
  visit(bones);
  return result;
}
