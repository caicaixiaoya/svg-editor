import { Command } from './Command';
import { SVGDocument } from '../model/SVGDocument';
import { fmt } from '../model/Num';

/**
 * move：叶子平移自身，容器递归平移全部子孙（Composite 统一操作）。
 * 回显：叶子报“移动到哪里”（绝对位置），容器报“移动了多少”（增量）。
 */
export class MoveCommand extends Command {
  constructor(
    private readonly doc: SVGDocument,
    private readonly id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {
    super();
  }

  execute(): string {
    const shape = this.requireShape(this.doc, this.id);
    shape.moveBy(this.dx, this.dy);
    const pos = shape.positionSummary();
    return pos !== null
      ? `${shape.label()} moved to ${pos}`
      : `${shape.label()} moved by (${fmt(this.dx)},${fmt(this.dy)})`;
  }

  undo(): string {
    const shape = this.requireShape(this.doc, this.id);
    shape.moveBy(-this.dx, -this.dy);
    const pos = shape.positionSummary();
    return pos !== null
      ? `${shape.label()} moved back to ${pos}`
      : `${shape.label()} moved back by (${fmt(-this.dx)},${fmt(-this.dy)})`;
  }
}
