import { Shape } from './Shape';
import { SvgTextWriter, AttrPair } from './SvgTextWriter';
import { CliError } from '../CliError';

/**
 * 容器图形（Composite 的 Composite 角色）。
 * move/scale 递归作用到全部子孙（改写坐标，而非 transform——与 scale 的
 * “同乘全部几何属性”语义及 tree/show 的属性内联显示保持一致）。
 * 子列表的增删移须经 SVGDocument（维护 id 注册表与 parent 指针）。
 */
export class GroupShape extends Shape {
  private readonly _children: Shape[] = [];

  constructor(id: string) {
    super(id);
  }

  get kind(): string {
    return 'g';
  }

  override get isContainer(): boolean {
    return true;
  }

  override get children(): Shape[] {
    return this._children;
  }

  override asContainer(): GroupShape | null {
    return this;
  }

  moveBy(dx: number, dy: number): void {
    for (const child of this._children) child.moveBy(dx, dy);
  }

  scaleBy(f: number): void {
    for (const child of this._children) child.scaleBy(f);
  }

  scaleBackBy(f: number): void {
    for (const child of this._children) child.scaleBackBy(f);
  }

  geometrySummary(): string {
    return '';
  }

  geometryDetail(): string {
    return `children=${this._children.length}`;
  }

  positionSummary(): string | null {
    return null;
  }

  getGeometry(attr: string): string {
    throw new CliError(`unknown attribute: ${attr}`);
  }

  setGeometry(attr: string, _value: string): void {
    throw new CliError(`unknown attribute: ${attr}`);
  }

  writeSvg(writer: SvgTextWriter): void {
    const attrs: AttrPair[] = [['id', this.id], ...this.stylePairs()];
    if (this._children.length === 0) {
      writer.leaf('g', attrs);
      return;
    }
    writer.open('g', attrs);
    for (const child of this._children) child.writeSvg(writer);
    writer.close('g');
  }
}
