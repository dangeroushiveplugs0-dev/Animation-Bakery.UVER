export interface AnimationClipDescriptor {
  id: string;
  name: string;
  fps: number;
  duration: number;
  loop: boolean;
}

export interface AnimationLifecycle {
  load(root: unknown, clip: unknown): void;
  unload(): void;
  setFPS(fps: number): void;
  getActiveClip(): AnimationClipDescriptor | undefined;
  update(deltaSeconds: number): void;
  dispose(): void;
}
