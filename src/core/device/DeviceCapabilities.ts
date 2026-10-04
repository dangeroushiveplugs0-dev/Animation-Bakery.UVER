export type PerformanceTier = "low" | "medium" | "high";

export interface DeviceCapabilities {
  performanceTier: PerformanceTier;
  hardwareConcurrency: number;
  deviceMemoryGB?: number;
  maxTextureSize: number;
  webGL2: boolean;
  pixelRatio: number;
  screenWidth: number;
  screenHeight: number;
}

export interface CapabilityProvider {
  detect(): DeviceCapabilities;
}
