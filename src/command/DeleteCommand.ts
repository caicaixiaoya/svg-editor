import { Command } from './Command';
import { SVGDocument } from '../model/SVGDocument';
import { Shape } from '../model/Shape';
import { GroupShape } from '../model/GroupShape';

/**
 * delete：容器连同全部子孙（整棵子树 detach），undo 按原位置整体放回。
 * 注意 undo 时图形已不在 id 注册表中，必须用 execute 时保存的对象引用。
 */
export class DeleteCommand extends Command {
  private shape: Shape | null = null;
  private parent: GroupShape | null = null;
  private index = 0;

  constructor(
    private readonly doc: SVGDocument,
    private readonly id: string,
  ) {
    super();
  }

  execute(): string {
    this.shape = this.requireShape(this.doc, this.id);
    this.parent = this.shape.parent;
    this.index = this.doc.siblingListOf(this.shape).indexOf(this.shape);
    this.doc.detach(this.shape);
    return `${this.shape.label()} deleted`;
  }

  undo(): string {
    if (!this.shape) throw new Error('delete command was not executed');
    this.doc.attach(this.shape, this.parent, this.index);
    return this.parent
      ? `${this.shape.label()} restored into ${this.parent.label()}`
      : `${this.shape.label()} restored to root`;
  }
}
