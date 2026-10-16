import { Tokenizer } from './Tokenizer';
import { CommandDispatcher } from './CommandDispatcher';
import { History } from '../command/History';
import { SVGDocument } from '../model/SVGDocument';
import { CliError } from '../CliError';

/**
 * 会话：当前文档 + 历史 + io 锁 + 回读路径，命令的宿主。
 * - `#` 开头（或空白）的行是注释，静默忽略；
 * - 文档类命令（init/read/save/canvas 改尺寸）执行后清空双栈并上 io 锁，
 *   undo/redo 报错，直到下一条成功编辑命令重新解禁；
 * - 所有错误统一 `error:` 前缀输出，命令失败不改变任何状态。
 */
export class Session {
  private doc: SVGDocument | null = null;
  private filePath: string | null = null;
  private ioLocked = false;
  private quit = false;
  private readonly dispatcher = new CommandDispatcher();
  readonly history = new History();

  get document(): SVGDocument {
    if (!this.doc) throw new CliError(`no document. use 'init' or 'read' first`);
    return this.doc;
  }

  get hasDocument(): boolean {
    return this.doc !== null;
  }

  get ioLockActive(): boolean {
    return this.ioLocked;
  }

  get readBackPath(): string | null {
    return this.filePath;
  }

  get quitRequested(): boolean {
    return this.quit;
  }

  /** init / read：替换当前文档，清空历史，上 io 锁；read 记住回读路径。 */
  loadDocument(doc: SVGDocument, path: string | null): void {
    this.doc = doc;
    this.filePath = path;
    this.enterIoBoundary();
  }

  /** save 成功后：记住路径，上 io 锁。 */
  savedTo(path: string): void {
    this.filePath = path;
    this.enterIoBoundary();
  }

  /** canvas 改尺寸：上 io 锁（不触碰回读路径）。 */
  markIoBoundary(): void {
    this.enterIoBoundary();
  }

  /** 下一条成功编辑命令调用：解禁 undo/redo。 */
  unlockHistory(): void {
    this.ioLocked = false;
  }

  requestQuit(): void {
    this.quit = true;
  }

  executeLine(line: string): string[] {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return [];

    let tokens;
    try {
      tokens = Tokenizer.parse(trimmed);
    } catch (e) {
      return [Session.errorLine(e)];
    }

    const name = tokens[0].text;
    const handler = this.dispatcher.lookup(name);
    if (!handler) return [`error: unknown command: ${name}`];

    try {
      if (!handler.allowedWithoutDoc && this.doc === null) {
        throw new CliError(`no document. use 'init' or 'read' first`);
      }
      return handler.run(this, tokens.slice(1).map((t) => t.text));
    } catch (e) {
      return [Session.errorLine(e)];
    }
  }

  private enterIoBoundary(): void {
    this.history.clear();
    this.ioLocked = true;
  }

  private static errorLine(e: unknown): string {
    if (e instanceof CliError) return `error: ${e.message}`;
    return `error: internal error: ${(e as Error).message}`;
  }
}
