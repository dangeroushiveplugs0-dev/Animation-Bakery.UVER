import type {PluginManifest} from "./PluginManifest";
import type {UVERPlugin} from "./PluginAPI";

export type PluginState =
  | "discovered"
  | "validated"
  | "loaded"
  | "active"
  | "disabled"
  | "failed";

export interface PluginRecord {
  manifest: PluginManifest;
  plugin: UVERPlugin;
  state: PluginState;
  error?: string;
}

export interface PluginHost {
  discover(source: string): Promise<PluginManifest>;
  load(manifest: PluginManifest): Promise<PluginRecord>;
  activate(pluginId: string): Promise<void>;
  deactivate(pluginId: string): Promise<void>;
  unload(pluginId: string): Promise<void>;
}
