import { Command } from './Command';
import { CliError } from '../CliError';

/**
 * 撤销/重做双栈。
 * run：执行编辑命令并入 undo 栈（同时清空 redo 栈——undo 后的新编辑使 redo 失效）。
 * io 边界（init/read/save/canvas 改尺寸）由 Session 调 clear() 处理。
 */
export class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  run(command: Command): string {
    const message = command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    return message;
  }

  undo(commandNotFound: string): string {
    const command = this.undoStack.pop();
    if (!command) throw new CliError(commandNotFound);
    const message = command.undo();
    this.redoStack.push(command);
    return message;
  }

  redo(commandNotFound: string): string {
    const command = this.redoStack.pop();
    if (!command) throw new CliError(commandNotFound);
    const message = command.execute();
    this.undoStack.push(command);
    return message;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
