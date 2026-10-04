import type {PluginPermission} from "./PluginPermissions";

export interface PluginContext {
  pluginId: string;
  apiVersion: string;
  hasPermission(permission: PluginPermission): boolean;
}

export interface UVERPluginAPI {
  readonly context: PluginContext;
  readonly scene: unknown;
  readonly objects: unknown;
  readonly mesh: unknown;
  readonly materials: unknown;
  readonly textures: unknown;
  readonly bones: unknown;
  readonly rigging: unknown;
  readonly animation: unknown;
  readonly physics: unknown;
  readonly timeline: unknown;
  readonly selection: unknown;
  readonly project: unknown;
  readonly ui: unknown;
  readonly commands: unknown;
  readonly storage: unknown;
}

export interface UVERPlugin {
  activate(api: UVERPluginAPI): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}
