import * as THREE from "three";

export class AnimationManager{
  private mixer?:THREE.AnimationMixer;
  private activeAction?:THREE.AnimationAction;
  private activeClip?:THREE.AnimationClip;
  private fps=30;

  load(root:THREE.Object3D,clip?:THREE.AnimationClip){
    this.dispose();
    if(!clip)return;
    this.mixer=new THREE.AnimationMixer(root);
    this.activeClip=clip;
    this.activeAction=this.mixer.clipAction(clip);
    this.activeAction.play();
  }

  setFPS(fps:number){
    this.fps=Math.max(1,Math.min(240,fps));
  }

  update(delta:number){
    this.mixer?.update(delta);
  }

  getFPS(){return this.fps;}
  getActiveClip(){return this.activeClip;}

  dispose(){
    if(this.activeAction){
      this.activeAction.stop();
      this.activeAction.reset();
    }
    this.mixer?.stopAllAction();
    this.mixer?.uncacheRoot(this.mixer.getRoot());
    this.mixer=undefined;
    this.activeAction=undefined;
    this.activeClip=undefined;
  }
}
