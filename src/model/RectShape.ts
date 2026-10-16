import { Shape } from './Shape';
import { fmt, parseNum } from './Num';
import { SvgTextWriter, AttrPair } from './SvgTextWriter';
import { CliError } from '../CliError';

export class RectShape extends Shape {
  constructor(id: string, public x: number, public y: number, public width: number, public height: number) {
    super(id);
  }

  get kind(): string {
    return 'rect';
  }

  moveBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  scaleBy(f: number): void {
    this.x *= f;
    this.y *= f;
    this.width *= f;
    this.height *= f;
  }

  scaleBackBy(f: number): void {
    this.x /= f;
    this.y /= f;
    this.width /= f;
    this.height /= f;
  }

  geometrySummary(): string {
    return `x=${fmt(this.x)} y=${fmt(this.y)} w=${fmt(this.width)} h=${fmt(this.height)}`;
  }

  geometryDetail(): string {
    return this.geometrySummary();
  }

  positionSummary(): string {
    return `(${fmt(this.x)},${fmt(this.y)})`;
  }

  getGeometry(attr: string): string {
    switch (attr) {
      case 'x': return fmt(this.x);
      case 'y': return fmt(this.y);
      case 'width': return fmt(this.width);
      case 'height': return fmt(this.height);
      default: throw new CliError(`unknown attribute: ${attr}`);
    }
  }

  setGeometry(attr: string, value: string): void {
    const v = parseNum(value);
    switch (attr) {
      case 'x': this.x = v; break;
      case 'y': this.y = v; break;
      case 'width': this.width = v; break;
      case 'height': this.height = v; break;
      default: throw new CliError(`unknown attribute: ${attr}`);
    }
  }

  writeSvg(writer: SvgTextWriter): void {
    const attrs: AttrPair[] = [
      ['id', this.id],
      ['x', this.x],
      ['y', this.y],
      ['width', this.width],
      ['height', this.height],
      ...this.stylePairs(),
    ];
    writer.leaf('rect', attrs);
  }
}
