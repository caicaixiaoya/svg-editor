import { Command } from './Command';
import { SVGDocument } from '../model/SVGDocument';

/** set：白名单外的属性在 getAttr 中被拒（unknown attribute）；undo 恢复旧值。 */
export class SetCommand extends Command {
  private oldValue: string | null = null;

  constructor(
    private readonly doc: SVGDocument,
    private readonly id: string,
    private readonly attr: string,
    private readonly value: string,
  ) {
    super();
  }

  execute(): string {
    const shape = this.requireShape(this.doc, this.id);
    this.oldValue = shape.getAttr(this.attr); // 兼做白名单校验
    shape.setAttr(this.attr, this.value);
    return `${shape.label()} updated: ${this.display(this.value)}`;
  }

  undo(): string {
    const shape = this.requireShape(this.doc, this.id);
    if (this.oldValue === null) shape.unsetAttr(this.attr);
    else shape.setAttr(this.attr, this.oldValue);
    return this.oldValue === null
      ? `${shape.label()} updated: ${this.attr} unset`
      : `${shape.label()} updated: ${this.display(this.oldValue)}`;
  }

  private display(value: string): string {
    return this.attr === 'text' ? `${this.attr}="${value}"` : `${this.attr}=${value}`;
  }
}
