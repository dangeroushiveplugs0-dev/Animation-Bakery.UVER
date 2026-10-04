export type PhysicsQuality = "auto" | "preview" | "light" | "normal" | "high" | "custom";

export interface PhysicsLifecycle {
  initialize(): Promise<void>;
  setQuality(quality: PhysicsQuality): void;
  step(deltaSeconds: number): void;
  pause(): void;
  resume(): void;
  clear(): void;
  dispose(): void;
}
