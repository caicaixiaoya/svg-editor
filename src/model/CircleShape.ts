import { Shape } from './Shape';
import { fmt, parseNum } from './Num';
import { SvgTextWriter, AttrPair } from './SvgTextWriter';
import { CliError } from '../CliError';

export class CircleShape extends Shape {
  constructor(id: string, public cx: number, public cy: number, public r: number) {
    super(id);
  }

  get kind(): string {
    return 'circle';
  }

  moveBy(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  scaleBy(f: number): void {
    this.cx *= f;
    this.cy *= f;
    this.r *= f;
  }

  scaleBackBy(f: number): void {
    this.cx /= f;
    this.cy /= f;
    this.r /= f;
  }

  geometrySummary(): string {
    return `cx=${fmt(this.cx)} cy=${fmt(this.cy)} r=${fmt(this.r)}`;
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
      case 'r': return fmt(this.r);
      default: throw new CliError(`unknown attribute: ${attr}`);
    }
  }

  setGeometry(attr: string, value: string): void {
    const v = parseNum(value);
    switch (attr) {
      case 'cx': this.cx = v; break;
      case 'cy': this.cy = v; break;
      case 'r': this.r = v; break;
      default: throw new CliError(`unknown attribute: ${attr}`);
    }
  }

  writeSvg(writer: SvgTextWriter): void {
    const attrs: AttrPair[] = [
      ['id', this.id],
      ['cx', this.cx],
      ['cy', this.cy],
      ['r', this.r],
      ...this.stylePairs(),
    ];
    writer.leaf('circle', attrs);
  }
}
