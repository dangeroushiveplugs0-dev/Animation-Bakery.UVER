import type {CharacterData} from "../CharacterData";
import type {CharacterProvider} from "./CharacterProvider";

type Metadata={
  providers?:string[];
  armatures?:Array<{name?:string;bones?:string[];customProperties?:Record<string,unknown>}>;
  outfits?:CharacterData["outfits"];
  hair?:CharacterData["hair"];
  customProperties?:Record<string,unknown>;
  collections?:unknown[];
  scenes?:unknown[];
  objects?:unknown[];
  materials?:unknown[];
  signals?:string[];
};

export class BlenderProvider implements CharacterProvider{
  readonly id="blender" as const;

  canRead(root:unknown):boolean{
    return !!root&&typeof root==="object";
  }

  inspect(root:unknown):Partial<CharacterData>{
    const userData=(root as {userData?:Record<string,unknown>}).userData??{};
    const metadata=(userData.blenderCharacterMetadata??{}) as Metadata;
    const legacyArmatures=Array.isArray(userData.blenderArmatures)
      ?userData.blenderArmatures as Array<{name?:string;bones?:Array<{name?:string}>}>
      :[];

    const armatures=metadata.armatures?.map(value=>value.name||"Armature")
      ??legacyArmatures.map(value=>value.name||"Armature");

    const bones=metadata.armatures?.flatMap(value=>value.bones??[])
      ??legacyArmatures.flatMap(value=>(value.bones??[]).map(bone=>bone.name||"Bone"));

    return {
      providers:["blender"],
      armatures,
      bones,
      outfits:metadata.outfits??[],
      hair:metadata.hair??[],
      customProperties:{
        ...(metadata.customProperties??{}),
        ...((userData.blenderProperties??{}) as Record<string,unknown>)
      },
      raw:{blender:metadata}
    };
  }
}
