import { Shape } from './Shape';
import { GroupShape } from './GroupShape';
import { CliError } from '../CliError';

/**
 * 当前文档：画布尺寸 + 根级图形列表 + 全局 id 注册表。
 * 结构操作（挂载/摘除）统一从这里走，保证 id 唯一性与 parent 指针一致。
 */
export class SVGDocument {
  readonly rootChildren: Shape[] = [];
  private readonly byId = new Map<string, Shape>();

  constructor(public width: number, public height: number) {}

  find(id: string): Shape | undefined {
    return this.byId.get(id);
  }

  has(id: string): boolean {
    return this.byId.has(id);
  }

  /** 挂载到 parent（null = 画布根）；index 省略时追加为最后一个子节点。 */
  attach(shape: Shape, parent: GroupShape | null, index?: number): void {
    if (this.byId.has(shape.id)) throw new CliError(`id already exists: ${shape.id}`);
    const list = parent ? parent.children : this.rootChildren;
    list.splice(index ?? list.length, 0, shape);
    shape.parent = parent;
    this.byId.set(shape.id, shape);
  }

  detach(shape: Shape): void {
    const list = shape.parent ? shape.parent.children : this.rootChildren;
    const i = list.indexOf(shape);
    if (i >= 0) list.splice(i, 1);
    shape.parent = null;
    this.byId.delete(shape.id);
  }

  /** 图形所在的双向列表（parent 的子列表或根列表），供 z-order 调整。 */
  siblingListOf(shape: Shape): Shape[] {
    return shape.parent ? shape.parent.children : this.rootChildren;
  }

  /** 全文档元素数（含容器自身，不含 svg 根），用于 read/save 回显。 */
  elementCount(): number {
    let count = 0;
    const walk = (list: readonly Shape[]): void => {
      for (const s of list) {
        count++;
        walk(s.children);
      }
    };
    walk(this.rootChildren);
    return count;
  }
}
