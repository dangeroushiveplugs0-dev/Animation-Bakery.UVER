import type {CharacterData} from "../CharacterData";
import type {CharacterProvider} from "./CharacterProvider";

export class MustardUIProvider implements CharacterProvider{
  readonly id="mustardui" as const;

  canRead(root:unknown):boolean{return !!root&&typeof root==="object";}

  inspect(root:unknown):Partial<CharacterData>{
    const userData=(root as {userData?:Record<string,unknown>}).userData??{};
    const metadata=userData.blenderCharacterMetadata as {providers?:string[];outfits?:CharacterData["outfits"];hair?:CharacterData["hair"]}|undefined;
    if(!metadata?.providers?.includes("mustardui")) return {};
    return {
      providers:["mustardui"],
      outfits:metadata.outfits??[],
      hair:metadata.hair??[],
      raw:{mustardui:metadata}
    };
  }
}
