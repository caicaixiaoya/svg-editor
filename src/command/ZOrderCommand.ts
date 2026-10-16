import { Command } from './Command';
import { SVGDocument } from '../model/SVGDocument';

/**
 * front / back：同级 z-order 调整。SVG 中后出现的元素画在上层，
 * 故 front = 移到同级末尾，back = 移到同级开头；undo 恢复原下标。
 */
export class ZOrderCommand extends Command {
  private index = 0;

  constructor(
    private readonly doc: SVGDocument,
    private readonly id: string,
    private readonly toFront: boolean,
  ) {
    super();
  }

  execute(): string {
    const shape = this.requireShape(this.doc, this.id);
    const siblings = this.doc.siblingListOf(shape);
    this.index = siblings.indexOf(shape);
    siblings.splice(this.index, 1);
    if (this.toFront) siblings.push(shape);
    else siblings.unshift(shape);
    return `${shape.label()} ${this.toFront ? 'brought to front' : 'sent to back'}`;
  }

  undo(): string {
    const shape = this.requireShape(this.doc, this.id);
    const siblings = this.doc.siblingListOf(shape);
    siblings.splice(siblings.indexOf(shape), 1);
    siblings.splice(this.index, 0, shape);
    return `${shape.label()} z-order restored`;
  }
}
