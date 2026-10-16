import { Shape } from './Shape';
import { fmt, parseNum } from './Num';
import { SvgTextWriter, AttrPair } from './SvgTextWriter';
import { CliError } from '../CliError';

export class EllipseShape extends Shape {
  constructor(id: string, public cx: number, public cy: number, public rx: number, public ry: number) {
    super(id);
  }

  get kind(): string {
    return 'ellipse';
  }

  moveBy(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  scaleBy(f: number): void {
    this.cx *= f;
    this.cy *= f;
    this.rx *= f;
    this.ry *= f;
  }

  scaleBackBy(f: number): void {
    this.cx /= f;
    this.cy /= f;
    this.rx /= f;
    this.ry /= f;
  }

  geometrySummary(): string {
    return `cx=${fmt(this.cx)} cy=${fmt(this.cy)} rx=${fmt(this.rx)} ry=${fmt(this.ry)}`;
  }

  geometryDetail(): string {
    return this.geometrySummary();
  }

  positionSummary(): string {
    return `(${fmt(this.cx)},${fmt(this.cy)})`;
  }

  getGeometry(attr: string): string {
    switch (attr) {
      case 'cx': return fmt(this.cx);
      case 'cy': return fmt(this.cy);
      case 'rx': return fmt(this.rx);
      case 'ry': return fmt(this.ry);
      default: throw new CliError(`unknown attribute: ${attr}`);
    }
  }

  setGeometry(attr: string, value: string): void {
    const v = parseNum(value);
    switch (attr) {
      case 'cx': this.cx = v; break;
      case 'cy': this.cy = v; break;
      case 'rx': this.rx = v; break;
      case 'ry': this.ry = v; break;
      default: throw new CliError(`unknown attribute: ${attr}`);
    }
  }

  writeSvg(writer: SvgTextWriter): void {
    const attrs: AttrPair[] = [
      ['id', this.id],
      ['cx', this.cx],
      ['cy', this.cy],
      ['rx', this.rx],
      ['ry', this.ry],
      ...this.stylePairs(),
    ];
    writer.leaf('ellipse', attrs);
  }
}
