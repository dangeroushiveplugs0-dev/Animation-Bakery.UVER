import type {CharacterData,CharacterProviderId} from "../CharacterData";

export interface CharacterProvider{
  readonly id:CharacterProviderId;
  canRead(root:unknown):boolean;
  inspect(root:unknown):Partial<CharacterData>;
}
