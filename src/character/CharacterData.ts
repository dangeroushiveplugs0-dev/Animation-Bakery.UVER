export type CharacterProviderId="blender"|"mustardui"|"diffeomorphic"|"uver";

export interface CharacterMorph{
  id:string;
  name:string;
  value:number;
  min?:number;
  max?:number;
  source?:CharacterProviderId;
}

export interface CharacterOutfit{
  id:string;
  name:string;
  objectNames:string[];
  visible:boolean;
  source?:CharacterProviderId;
}

export interface CharacterMaterialVariant{
  id:string;
  name:string;
  materialNames:string[];
  source?:CharacterProviderId;
}

export interface CharacterPhysicsCandidate{
  id:string;
  name:string;
  objectNames:string[];
  source?:CharacterProviderId;
}

export interface CharacterData{
  id:string;
  name:string;
  providers:CharacterProviderId[];
  armatures:string[];
  bones:string[];
  morphs:CharacterMorph[];
  outfits:CharacterOutfit[];
  hair:CharacterOutfit[];
  materialVariants:CharacterMaterialVariant[];
  physicsCandidates:CharacterPhysicsCandidate[];
  customProperties:Record<string,unknown>;
  raw:Record<string,unknown>;
}
