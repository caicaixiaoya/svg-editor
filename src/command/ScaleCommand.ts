import { Command } from './Command';
import { SVGDocument } from '../model/SVGDocument';
import { CliError } from '../CliError';
import { fmt } from '../model/Num';

/**
 * scale：factor 同乘到全部几何属性（位置与尺寸），容器递归到每个子孙。
 * undo 用除法逆运算（scaleBackBy），保证 x*3 再 /3 精确还原、无浮点漂移。
 */
export class ScaleCommand extends Command {
  constructor(
    private readonly doc: SVGDocument,
    private readonly id: string,
    private readonly factor: number,
  ) {
    super();
  }

  execute(): string {
    if (!(this.factor > 0)) throw new CliError('scale factor must be positive');
    const shape = this.requireShape(this.doc, this.id);
    shape.scaleBy(this.factor);
    return `${shape.label()} scaled by ${fmt(this.factor)}`;
  }

  undo(): string {
    const shape = this.requireShape(this.doc, this.id);
    shape.scaleBackBy(this.factor);
    return `${shape.label()} scaled back`;
  }
}
