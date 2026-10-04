export const PluginPermission = {
  Scene: "scene",
  Objects: "objects",
  Mesh: "mesh",
  Materials: "materials",
  Textures: "textures",
  Bones: "bones",
  Rigging: "rigging",
  Animation: "animation",
  Physics: "physics",
  Timeline: "timeline",
  Selection: "selection",
  Project: "project",
  UI: "ui",
  Commands: "commands",
  Storage: "storage",
  FileImport: "file-import",
  FileExport: "file-export",
  Network: "network"
} as const;

export type PluginPermission =
  typeof PluginPermission[keyof typeof PluginPermission];

export const ALWAYS_DENIED_PLUGIN_CAPABILITIES = [
  "gpu-device",
  "native-code",
  "system-process",
  "arbitrary-native-api"
] as const;
