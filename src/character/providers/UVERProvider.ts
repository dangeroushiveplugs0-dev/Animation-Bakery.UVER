import type {CharacterData} from "../CharacterData";
import type {CharacterProvider} from "./CharacterProvider";

export class UVERProvider implements CharacterProvider{
  readonly id="uver" as const;

  canRead(root:unknown):boolean{
    return !!root&&typeof root==="object";
  }

  inspect(_root:unknown):Partial<CharacterData>{
    return {providers:["uver"],raw:{uver:{detected:false}}};
  }
}
