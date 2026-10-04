/**
 * Stable foundation contracts.
 *
 * Feature implementations should depend on these contracts rather than
 * reaching directly into unrelated subsystems. This keeps the editor,
 * project format, plugin API, animation, physics, and device systems
 * replaceable without forcing a large architectural rewrite.
 */

export * from "./contracts/Disposable";
export * from "./project/ProjectFormat";
export * from "./project/ProjectMigration";
export * from "./plugin/PluginManifest";
export * from "./plugin/PluginPermissions";
export * from "./plugin/PluginAPI";
export * from "./plugin/PluginLifecycle";
export * from "./commands/Command";
export * from "./device/DeviceCapabilities";
export * from "./asset/AssetLifecycle";
export * from "./animation/AnimationLifecycle";
export * from "./physics/PhysicsLifecycle";
