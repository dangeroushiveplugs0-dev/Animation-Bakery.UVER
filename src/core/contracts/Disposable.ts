export interface Disposable {
  dispose(): void;
}

export interface AsyncDisposable extends Disposable {
  disposeAsync(): Promise<void>;
}

export function disposeIfPresent(value: unknown): void {
  if (value && typeof (value as Disposable).dispose === "function") {
    (value as Disposable).dispose();
  }
}
