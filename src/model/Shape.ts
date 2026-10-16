import type { GroupShape } from './GroupShape';
import { CliError } from '../CliError';
import { SvgTextWriter, AttrPair } from './SvgTextWriter';

/**
 * 图形元素抽象基类（Composite 的 Component 角色）。
 *
 * 约定：
 * - 叶子图形持有几何属性；容器（GroupShape）持有子图形；
 * - move/scale/set/delete 等操作对容器与叶子一视同仁（统一操作语义）；
 * - 属性白名单：fill / stroke / stroke-width 对所有类型开放（SVG 可继承的呈现属性），
 *   几何属性与文本内容由各子类自行裁决，白名单外抛 unknown attribute。
 */
export abstract class Shape {
  readonly id: string;
  /** 结构变更须经 SVGDocument 维护。 */
  parent: GroupShape | null = null;
  fill: string | null = null;
  stroke: string | null = null;
  strokeWidth: string | null = null;

  protected constructor(id: string) {
    this.id = id;
  }

  abstract get kind(): string;

  get isContainer(): boolean {
    return false;
  }

  get children(): readonly Shape[] {
    return [];
  }

  /** 叶子返回 null；容器返回自身（避免命令层到处 instanceof）。 */
  asContainer(): GroupShape | null {
    return null;
  }

  abstract moveBy(dx: number, dy: number): void;
  /** 等比缩放：factor 乘到全部几何属性（位置与尺寸）。 */
  abstract scaleBy(factor: number): void;
  /** scale 的精确逆运算（除法），供 undo 使用，避免 (x*f)*(1/f) 的浮点漂移。 */
  abstract scaleBackBy(factor: number): void;

  /** tree 命令的行内摘要（几何 + fill）。 */
  abstract geometrySummary(): string;
  /** show 命令的几何明细行。 */
  abstract geometryDetail(): string;
  /** show 命令的附加明细行（如 text 的内容），默认无。 */
  extraDetail(): string[] {
    return [];
  }
  /** move 回显用的“当前位置”（如 (130,100)）；容器无单一位置，返回 null。 */
  abstract positionSummary(): string | null;

  /** 读几何属性；白名单外抛 CliError。 */
  abstract getGeometry(attr: string): string;
  /** 写几何属性（含数值校验）；白名单外抛 CliError。 */
  abstract setGeometry(attr: string, value: string): void;

  abstract writeSvg(writer: SvgTextWriter): void;

  label(): string {
    return `${this.kind}#${this.id}`;
  }

  getAttr(attr: string): string | null {
    return this.isStyleAttr(attr) ? this.getStyle(attr) : this.getGeometry(attr);
  }

  setAttr(attr: string, value: string): void {
    if (this.isStyleAttr(attr)) this.setStyle(attr, value);
    else this.setGeometry(attr, value);
  }

  /** 仅样式属性可为“未设置”；几何属性恒有值。 */
  unsetAttr(attr: string): void {
    if (attr === 'fill') this.fill = null;
    else if (attr === 'stroke') this.stroke = null;
    else if (attr === 'stroke-width') this.strokeWidth = null;
    else throw new CliError(`unknown attribute: ${attr}`);
  }

  isAncestorOf(other: Shape): boolean {
    const self: Shape = this;
    let p: GroupShape | null = other.parent;
    while (p !== null) {
      if (p === self) return true;
      p = p.parent;
    }
    return false;
  }

  protected isStyleAttr(attr: string): boolean {
    return attr === 'fill' || attr === 'stroke' || attr === 'stroke-width';
  }

  private getStyle(attr: string): string | null {
    if (attr === 'fill') return this.fill;
    if (attr === 'stroke') return this.stroke;
    return this.strokeWidth;
  }

  private setStyle(attr: string, value: string): void {
    if (attr === 'fill') this.fill = value;
    else if (attr === 'stroke') this.stroke = value;
    else this.strokeWidth = value;
  }

  protected stylePairs(): AttrPair[] {
    return [
      ['fill', this.fill],
      ['stroke', this.stroke],
      ['stroke-width', this.strokeWidth],
    ];
  }
}
