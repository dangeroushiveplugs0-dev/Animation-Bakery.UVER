import type {CharacterData} from "../CharacterData";
import type {CharacterProvider} from "./CharacterProvider";

export class BlenderProvider implements CharacterProvider{
  readonly id="blender" as const;

  canRead(root:unknown):boolean{
    return !!root&&typeof root==="object";
  }

  inspect(root:unknown):Partial<CharacterData>{
    const object=root as {userData?:Record<string,unknown>};
    const userData=object.userData??{};
    const armatures=Array.isArray(userData.blenderArmatures)
      ?userData.blenderArmatures as Array<{name?:string;bones?:Array<{name?:string}>}>
      :[];

    return {
      providers:["blender"],
      armatures:armatures.map(value=>value.name||"Armature"),
      bones:armatures.flatMap(value=>(value.bones??[]).map(bone=>bone.name||"Bone")),
      customProperties:(userData.blenderProperties??{}) as Record<string,unknown>,
      raw:{blender:userData}
    };
  }
}
