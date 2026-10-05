import type {CharacterData} from "../CharacterData";
import type {CharacterProvider} from "./CharacterProvider";

/**
 * Read-only adapter foundation.
 * It intentionally does not execute MustardUI Python or copy its code.
 * Future detection will inspect exported Blender custom properties,
 * collections and object relationships produced by MustardUI-compatible models.
 */
export class MustardUIProvider implements CharacterProvider{
  readonly id="mustardui" as const;

  canRead(root:unknown):boolean{
    return !!root&&typeof root==="object";
  }

  inspect(_root:unknown):Partial<CharacterData>{
    return {providers:["mustardui"],raw:{mustardui:{detected:false}}};
  }
}
