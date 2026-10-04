export const PLUGIN_MANIFEST_VERSION = 1;

export interface PluginManifest {
  manifestVersion: number;
  id: string;
  name: string;
  version: string;
  author: string;
  apiVersion: string;
  entry: string;
  permissions?: string[];
}

export function validatePluginManifest(manifest: PluginManifest): void {
  const required = ["id", "name", "version", "author", "apiVersion", "entry"] as const;
  for (const key of required) {
    if (!manifest[key] || typeof manifest[key] !== "string") {
      throw new Error(`Invalid plugin manifest: missing ${key}`);
    }
  }
}
