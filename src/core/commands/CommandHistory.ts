import type {Command, CommandHistory} from "./Command";

export class InMemoryCommandHistory implements CommandHistory {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];

  constructor(private readonly maxSize = 100) {}

  async execute(command: Command): Promise<void> {
    await command.execute();
    this.undoStack.push(command);
    this.redoStack.length = 0;

    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
  }

  async undo(): Promise<void> {
    const command = this.undoStack.pop();
    if (!command) return;

    await command.undo();
    this.redoStack.push(command);
  }

  async redo(): Promise<void> {
    const command = this.redoStack.pop();
    if (!command) return;

    await command.execute();
    this.undoStack.push(command);
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }

  get undoCount(): number {
    return this.undoStack.length;
  }

  get redoCount(): number {
    return this.redoStack.length;
  }
}
