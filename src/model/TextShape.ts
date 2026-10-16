import { Shape } from './Shape';
import { fmt, parseNum } from './Num';
import { SvgTextWriter, AttrPair } from './SvgTextWriter';
import { CliError } from '../CliError';

/** 文本图形：内容是子文本而非属性；`set <id> text "..."` 改写内容。 */
export class TextShape extends Shape {
  constructor(id: string, public x: number, public y: number, public content: string) {
    super(id);
  }

  get kind(): string {
    return 'text';
  }

  moveBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  /** 位置参与缩放；font-size 不在 set 白名单内，不参与。 */
  scaleBy(f: number): void {
    this.x *= f;
    this.y *= f;
  }

  scaleBackBy(f: number): void {
    this.x /= f;
    this.y /= f;
  }

  geometrySummary(): string {
    return `(${fmt(this.x)},${fmt(this.y)}) "${this.content}"`;
  }

  geometryDetail(): string {
    return `x=${fmt(this.x)} y=${fmt(this.y)}`;
  }

  positionSummary(): string {
    return `(${fmt(this.x)},${fmt(this.y)})`;
  }

  /** show 时的附加明细行。 */
  override extraDetail(): string[] {
    return [`text="${this.content}"`];
  }

  getGeometry(attr: string): string {
    switch (attr) {
      case 'x': return fmt(this.x);
      case 'y': return fmt(this.y);
      case 'text': return this.content;
      default: throw new CliError(`unknown attribute: ${attr}`);
    }
  }

  setGeometry(attr: string, value: string): void {
    if (attr === 'text') {
      this.content = value;
      return;
    }
    const v = parseNum(value);
    if (attr === 'x') this.x = v;
    else if (attr === 'y') this.y = v;
    else throw new CliError(`unknown attribute: ${attr}`);
  }

  writeSvg(writer: SvgTextWriter): void {
    const attrs: AttrPair[] = [
      ['id', this.id],
      ['x', this.x],
      ['y', this.y],
      ...this.stylePairs(),
    ];
    writer.inline('text', attrs, this.content);
  }
}
