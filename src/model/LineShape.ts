import { Shape } from './Shape';
import { fmt, parseNum } from './Num';
import { SvgTextWriter, AttrPair } from './SvgTextWriter';
import { CliError } from '../CliError';

export class LineShape extends Shape {
  constructor(
    id: string,
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number,
  ) {
    super(id);
  }

  get kind(): string {
    return 'line';
  }

  moveBy(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }

  scaleBy(f: number): void {
    this.x1 *= f;
    this.y1 *= f;
    this.x2 *= f;
    this.y2 *= f;
  }

  scaleBackBy(f: number): void {
    this.x1 /= f;
    this.y1 /= f;
    this.x2 /= f;
    this.y2 /= f;
  }

  geometrySummary(): string {
    return `(${fmt(this.x1)},${fmt(this.y1)}) -> (${fmt(this.x2)},${fmt(this.y2)})`;
  }

  geometryDetail(): string {
    return `x1=${fmt(this.x1)} y1=${fmt(this.y1)} x2=${fmt(this.x2)} y2=${fmt(this.y2)}`;
  }

  positionSummary(): string {
    return `(${fmt(this.x1)},${fmt(this.y1)})`;
  }

  getGeometry(attr: string): string {
    switch (attr) {
      case 'x1': return fmt(this.x1);
      case 'y1': return fmt(this.y1);
      case 'x2': return fmt(this.x2);
      case 'y2': return fmt(this.y2);
      default: throw new CliError(`unknown attribute: ${attr}`);
    }
  }

  setGeometry(attr: string, value: string): void {
    const v = parseNum(value);
    switch (attr) {
      case 'x1': this.x1 = v; break;
      case 'y1': this.y1 = v; break;
      case 'x2': this.x2 = v; break;
      case 'y2': this.y2 = v; break;
      default: throw new CliError(`unknown attribute: ${attr}`);
    }
  }

  writeSvg(writer: SvgTextWriter): void {
    const attrs: AttrPair[] = [
      ['id', this.id],
      ['x1', this.x1],
      ['y1', this.y1],
      ['x2', this.x2],
      ['y2', this.y2],
      ...this.stylePairs(),
    ];
    writer.leaf('line', attrs);
  }
}
