import { Command } from './Command';
import { SVGDocument } from '../model/SVGDocument';
import { Shape } from '../model/Shape';
import { GroupShape } from '../model/GroupShape';
import { CliError } from '../CliError';

/**
 * ungroup：解散容器，子图形提升到原容器的父级、占据原容器的位置（连续槽位）。
 * 根级容器（svg 直接子节点）不可解散——其子无处提升。
 * undo 时容器已 detach，使用 execute 时保存的对象引用。
 */
export class UngroupCommand extends Command {
  private shape: Shape | null = null;
  private container: GroupShape | null = null;
  private parent: GroupShape | null = null;
  private index = 0;
  private kids: Shape[] = [];

  constructor(
    private readonly doc: SVGDocument,
    private readonly gid: string,
  ) {
    super();
  }

  execute(): string {
    this.shape = this.requireShape(this.doc, this.gid);
    this.container = this.shape.asContainer();
    if (!this.container) throw new CliError(`not a container: ${this.gid}`);
    if (this.shape.parent === null) throw new CliError(`cannot ungroup top-level container: ${this.gid}`);

    this.parent = this.shape.parent;
    this.index = this.doc.siblingListOf(this.shape).indexOf(this.shape);
    this.kids = [...this.container.children];

    for (const kid of this.kids) this.doc.detach(kid);
    this.doc.detach(this.shape);
    this.kids.forEach((kid, i) => this.doc.attach(kid, this.parent as GroupShape, this.index + i));
    return `${this.shape.label()} ungrouped (${this.kids.length} children promoted)`;
  }

  undo(): string {
    if (!this.shape || !this.container) throw new Error('ungroup command was not executed');
    for (const kid of this.kids) this.doc.detach(kid);
    this.doc.attach(this.shape, this.parent, this.index);
    for (const kid of this.kids) this.doc.attach(kid, this.container);
    return `${this.shape.label()} restored with ${this.kids.length} children`;
  }
}
