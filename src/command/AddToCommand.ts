import { Command } from './Command';
import { SVGDocument } from '../model/SVGDocument';
import { GroupShape } from '../model/GroupShape';
import { CliError } from '../CliError';

/** addto：把已有图形移入容器（作为最后一个子节点）；undo 放回原父级原槽位。 */
export class AddToCommand extends Command {
  private parent: GroupShape | null = null;
  private index = 0;

  constructor(
    private readonly doc: SVGDocument,
    private readonly gid: string,
    private readonly id: string,
  ) {
    super();
  }

  execute(): string {
    const containerShape = this.doc.find(this.gid);
    if (!containerShape) throw new CliError(`no such container: ${this.gid}`);
    const container = containerShape.asContainer();
    if (!container) throw new CliError(`not a container: ${this.gid}`);
    const shape = this.requireShape(this.doc, this.id);

    if (shape === containerShape || shape.isAncestorOf(containerShape)) {
      throw new CliError(`cannot add a container into its own descendant: ${this.id}`);
    }

    this.parent = shape.parent;
    this.index = this.doc.siblingListOf(shape).indexOf(shape);
    this.doc.detach(shape);
    this.doc.attach(shape, container);
    return `${shape.label()} moved into ${containerShape.label()}`;
  }

  undo(): string {
    const shape = this.requireShape(this.doc, this.id);
    this.doc.detach(shape);
    this.doc.attach(shape, this.parent, this.index);
    return this.parent
      ? `${shape.label()} moved back into ${this.parent.label()}`
      : `${shape.label()} moved back to root`;
  }
}
