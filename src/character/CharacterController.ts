import * as THREE from "three";
import type {CharacterData,CharacterProviderId} from "./CharacterData";
import type {CharacterProvider} from "./providers/CharacterProvider";
import {BlenderProvider} from "./providers/BlenderProvider";
import {MustardUIProvider} from "./providers/MustardUIProvider";
import {DiffeomorphicProvider} from "./providers/DiffeomorphicProvider";
import {UVERProvider} from "./providers/UVERProvider";

export class CharacterController{
  private readonly providers:CharacterProvider[]=[
    new BlenderProvider(),
    new DiffeomorphicProvider(),
    new MustardUIProvider(),
    new UVERProvider()
  ];

  inspect(root:THREE.Object3D):CharacterData{
    const base:CharacterData={
      id:root.uuid,
      name:root.name||"Character",
      providers:[],
      armatures:[],
      bones:[],
      morphs:[],
      outfits:[],
      hair:[],
      materialVariants:[],
      physicsCandidates:[],
      customProperties:{},
      raw:{}
    };

    for(const provider of this.providers){
      if(!provider.canRead(root)) continue;
      const data=provider.inspect(root);
      Object.assign(base,data);
      for(const id of (data.providers??[]) as CharacterProviderId[]){
        if(!base.providers.includes(id)) base.providers.push(id);
      }
    }

    return base;
  }
}
