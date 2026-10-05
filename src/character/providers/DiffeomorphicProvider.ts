import type {CharacterData} from "../CharacterData";
import type {CharacterProvider} from "./CharacterProvider";

/**
 * Read-only adapter foundation for Diffeomorphic/DAZ character data.
 * UVER will inspect data embedded in the Blender file rather than running
 * Diffeomorphic Blender Python code.
 */
export class DiffeomorphicProvider implements CharacterProvider{
  readonly id="diffeomorphic" as const;

  canRead(root:unknown):boolean{
    return !!root&&typeof root==="object";
  }

  inspect(_root:unknown):Partial<CharacterData>{
    return {providers:["diffeomorphic"],raw:{diffeomorphic:{detected:false}}};
  }
}
