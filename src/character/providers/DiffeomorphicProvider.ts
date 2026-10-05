import type {CharacterData} from "../CharacterData";
import type {CharacterProvider} from "./CharacterProvider";

export class DiffeomorphicProvider implements CharacterProvider{
  readonly id="diffeomorphic" as const;

  canRead(root:unknown):boolean{return !!root&&typeof root==="object";}

  inspect(root:unknown):Partial<CharacterData>{
    const userData=(root as {userData?:Record<string,unknown>}).userData??{};
    const metadata=userData.blenderCharacterMetadata as {providers?:string[];signals?:string[]}|undefined;
    if(!metadata?.providers?.includes("diffeomorphic")) return {};
    return {
      providers:["diffeomorphic"],
      raw:{diffeomorphic:{detected:true,signals:metadata.signals??[]}}
    };
  }
}
