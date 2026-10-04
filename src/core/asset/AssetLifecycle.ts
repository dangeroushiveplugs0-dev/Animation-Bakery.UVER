export interface AssetLifecycle {
  import(source: unknown): Promise<unknown>;
  replaceCurrent(asset: unknown): Promise<void>;
  clearWorkingScene(): void;
  preserveOriginal(): boolean;
  dispose(asset: unknown): void;
}
