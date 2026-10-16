import { Session } from './Session';
import { HelpText } from './HelpText';
import { CliError } from '../CliError';
import { fmt, parseNum } from '../model/Num';
import { ShapeFactory } from '../model/ShapeFactory';
import { SVGDocument } from '../model/SVGDocument';
import { SvgReader } from '../io/SvgReader';
import { SvgWriter } from '../io/SvgWriter';
import { TreeRenderer } from '../view/TreeRenderer';
import { ShowRenderer } from '../view/ShowRenderer';
import { Command } from '../command/Command';
import { CreateCommand } from '../command/CreateCommand';
import { DeleteCommand } from '../command/DeleteCommand';
import { MoveCommand } from '../command/MoveCommand';
import { ScaleCommand } from '../command/ScaleCommand';
import { SetCommand } from '../command/SetCommand';
import { GroupCommand } from '../command/GroupCommand';
import { UngroupCommand } from '../command/UngroupCommand';
import { AddToCommand } from '../command/AddToCommand';
import { ZOrderCommand } from '../command/ZOrderCommand';

export interface Handler {
  /** true = 无文档时也可执行（help / init / read / exit）。 */
  allowedWithoutDoc: boolean;
  run(session: Session, args: string[]): string[];
}

/**
 * 命令分发：命令名 → 实现（全工程允许按名字分派的两处之一）。
 * 【待重构】后续阶段可演进为命令注册表（插件式命令扩展）。
 */
export class CommandDispatcher {
  private readonly handlers = new Map<string, Handler>();

  constructor() {
    const register = (name: string, allowedWithoutDoc: boolean, run: Handler['run']) => {
      this.handlers.set(name, { allowedWithoutDoc, run });
    };

    register('help', true, () => HelpText.lines());
    register('exit', true, (s) => {
      s.requestQuit();
      return ['bye'];
    });
    register('quit', true, (s) => {
      s.requestQuit();
      return ['bye'];
    });

    register('init', true, (s, a) => this.init(s, a));
    register('read', true, (s, a) => this.read(s, a));
    register('save', false, (s, a) => this.save(s, a));
    register('canvas', false, (s, a) => this.canvas(s, a));

    register('create', false, (s, a) => this.create(s, a));
    register('delete', false, (s, a) => {
      this.expectArgs(a, 1, 'delete <id>');
      return [this.runEdit(s, new DeleteCommand(s.document, a[0]))];
    });
    register('move', false, (s, a) => {
      this.expectArgs(a, 3, 'move <id> <dx> <dy>');
      return [this.runEdit(s, new MoveCommand(s.document, a[0], parseNum(a[1]), parseNum(a[2])))];
    });
    register('scale', false, (s, a) => {
      this.expectArgs(a, 2, 'scale <id> <factor>');
      return [this.runEdit(s, new ScaleCommand(s.document, a[0], parseNum(a[1])))];
    });
    register('set', false, (s, a) => {
      this.expectArgs(a, 3, 'set <id> <attr> <value>');
      return [this.runEdit(s, new SetCommand(s.document, a[0], a[1], a[2]))];
    });
    register('group', false, (s, a) => {
      if (a.length < 3) throw new CliError('usage: group <newGid> <id1> <id2>…');
      return [this.runEdit(s, new GroupCommand(s.document, a[0], a.slice(1)))];
    });
    register('ungroup', false, (s, a) => {
      this.expectArgs(a, 1, 'ungroup <gid>');
      return [this.runEdit(s, new UngroupCommand(s.document, a[0]))];
    });
    register('addto', false, (s, a) => {
      this.expectArgs(a, 2, 'addto <gid> <id>');
      return [this.runEdit(s, new AddToCommand(s.document, a[0], a[1]))];
    });
    register('front', false, (s, a) => {
      this.expectArgs(a, 1, 'front <id>');
      return [this.runEdit(s, new ZOrderCommand(s.document, a[0], true))];
    });
    register('back', false, (s, a) => {
      this.expectArgs(a, 1, 'back <id>');
      return [this.runEdit(s, new ZOrderCommand(s.document, a[0], false))];
    });

    register('undo', false, (s, a) => this.undo(s, a));
    register('redo', false, (s, a) => this.redo(s, a));

    register('tree', false, (s, a) => {
      if (a.length > 1) throw new CliError('usage: tree [id]');
      if (a.length === 0) return TreeRenderer.renderDocument(s.document);
      const shape = s.document.find(a[0]);
      if (!shape) throw new CliError(`no such shape: ${a[0]}`);
      return TreeRenderer.renderSubtree(shape);
    });
    register('show', false, (s, a) => {
      this.expectArgs(a, 1, 'show <id>');
      const shape = s.document.find(a[0]);
      if (!shape) throw new CliError(`no such shape: ${a[0]}`);
      return ShowRenderer.render(shape);
    });
  }

  lookup(name: string): Handler | undefined {
    return this.handlers.get(name);
  }

  // ---- 文档类（io）----

  private init(s: Session, args: string[]): string[] {
    let width = 800;
    let height = 600;
    if (args.length === 2) {
      width = parseNum(args[0]);
      height = parseNum(args[1]);
    } else if (args.length !== 0) {
      throw new CliError('usage: init [w] [h]');
    }
    if (!(width > 0) || !(height > 0)) throw new CliError(`invalid canvas size`);
    s.loadDocument(new SVGDocument(width, height), null);
    return [`canvas ${fmt(width)}x${fmt(height)} created`];
  }

  private read(s: Session, args: string[]): string[] {
    this.expectArgs(args, 1, 'read <file.svg>');
    const { doc, warnings } = SvgReader.read(args[0]);
    s.loadDocument(doc, args[0]);
    return [...warnings, `read ${args[0]} (${doc.elementCount()} elements)`];
  }

  private save(s: Session, args: string[]): string[] {
    if (args.length > 1) throw new CliError('usage: save [file.svg]');
    const target = args[0] ?? s.readBackPath;
    if (!target) throw new CliError('no file specified');
    const count = SvgWriter.write(s.document, target);
    s.savedTo(target);
    return [`saved to ${target} (${count} elements)`];
  }

  private canvas(s: Session, args: string[]): string[] {
    const doc = s.document;
    if (args.length === 0) return [`canvas ${fmt(doc.width)}x${fmt(doc.height)}`];
    if (args.length !== 2) throw new CliError('usage: canvas [w] [h]');
    const width = parseNum(args[0]);
    const height = parseNum(args[1]);
    if (!(width > 0) || !(height > 0)) throw new CliError(`invalid canvas size`);
    doc.width = width;
    doc.height = height;
    s.markIoBoundary();
    return [`canvas ${fmt(width)}x${fmt(height)} updated`];
  }

  // ---- 编辑类（Command 模式入口）----

  private create(s: Session, args: string[]): string[] {
    if (args.length < 2) throw new CliError('usage: create <type> <id> [params…] [in <containerId>]');
    const [type, id, ...rest] = args;
    let containerId: string | null = null;
    if (rest.length >= 2 && rest[rest.length - 2] === 'in') {
      containerId = rest.pop() as string;
      rest.pop();
    } else if (rest[rest.length - 1] === 'in') {
      throw new CliError(`expected <containerId> after 'in'`);
    }
    const shape = ShapeFactory.create(type, id, rest);
    return [this.runEdit(s, new CreateCommand(s.document, shape, containerId))];
  }

  private undo(s: Session, args: string[]): string[] {
    this.expectArgs(args, 0, 'undo');
    if (s.ioLockActive) throw new CliError('undo not allowed after io command');
    return [s.history.undo('nothing to undo')];
  }

  private redo(s: Session, args: string[]): string[] {
    this.expectArgs(args, 0, 'redo');
    if (s.ioLockActive) throw new CliError('redo not allowed after io command');
    return [s.history.redo('nothing to redo')];
  }

  /** 编辑命令执行成功才入栈并解禁 undo/redo；失败抛出，不改变任何状态。 */
  private runEdit(s: Session, command: Command): string {
    const message = s.history.run(command);
    s.unlockHistory();
    return message;
  }

  private expectArgs(args: string[], count: number, usage: string): void {
    if (args.length !== count) throw new CliError(`usage: ${usage}`);
  }
}
