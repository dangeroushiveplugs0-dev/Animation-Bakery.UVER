export interface Disposable {
  dispose(): void;
}

export function disposeIfPresent(value: unknown): void {
  if (value && typeof (value as Disposable).dispose === "function") {
    (value as Disposable).dispose();
  }
}
