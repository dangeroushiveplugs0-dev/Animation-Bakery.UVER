import type {
  CapabilityProvider,
  DeviceCapabilities,
  PerformanceTier
} from "../../core/device/DeviceCapabilities";

function detectTier(
  memoryGB: number | undefined,
  cores: number,
  maxTextureSize: number
): PerformanceTier {
  if (
    (memoryGB !== undefined && memoryGB >= 8) ||
    (cores >= 8 && maxTextureSize >= 8192)
  ) {
    return "high";
  }

  if (
    (memoryGB !== undefined && memoryGB >= 4) ||
    cores >= 6 ||
    maxTextureSize >= 4096
  ) {
    return "medium";
  }

  return "low";
}

export class BrowserDeviceCapabilities implements CapabilityProvider {
  detect(): DeviceCapabilities {
    const glCanvas = document.createElement("canvas");
    const gl =
      glCanvas.getContext("webgl2") ??
      glCanvas.getContext("webgl");

    const nav = navigator as Navigator & {
      deviceMemory?: number;
    };

    const maxTextureSize = gl
      ? Number(gl.getParameter(gl.MAX_TEXTURE_SIZE) ?? 2048)
      : 2048;

    const hardwareConcurrency = Math.max(1, navigator.hardwareConcurrency || 1);
    const deviceMemoryGB = nav.deviceMemory;
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);

    return {
      performanceTier: detectTier(
        deviceMemoryGB,
        hardwareConcurrency,
        maxTextureSize
      ),
      hardwareConcurrency,
      deviceMemoryGB,
      maxTextureSize,
      webGL2: !!glCanvas.getContext("webgl2"),
      pixelRatio,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
  }
}
