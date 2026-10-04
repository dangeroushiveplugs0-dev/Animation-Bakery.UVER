export interface AnimationState{
  name:string;
  fps:number;
  duration:number;
  loop:boolean;
}

export class AnimationStateManager{
  private active?:AnimationState;
  setActive(next:AnimationState){this.active=next;}
  clear(){this.active=undefined;}
  getActive(){return this.active;}
}
