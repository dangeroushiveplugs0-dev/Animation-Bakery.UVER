export interface Command {
  readonly id: string;
  readonly label: string;
  execute(): void | Promise<void>;
  undo(): void | Promise<void>;
}

export interface CommandHistory {
  execute(command: Command): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
  clear(): void;
}
