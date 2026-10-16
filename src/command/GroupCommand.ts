import { Command } from './Command';
import { SVGDocument } from '../model/SVGDocument';
import { Shape } from '../model/Shape';
import { GroupShape } from '../model/GroupShape';
import { CliError } from '../CliError';

interface Origin {
  shape: Shape;
  parent: GroupShape | null;
  index: number;
}

/**
 * group：新建容器并收编若干图形（整体一个 undo 单元）。
 * - 校验：新 id 唯一、成员都存在、目标集内不得同时含容器与其子孙；
 * - 新容器落在第一个成员的原父级、原槽位；成员按给定顺序成为其子（保持相对顺序）。
 */
export class GroupCommand extends Command {
  private group: GroupShape | null = null;
  private origins: Origin[] = [];

  constructor(
    private readonly doc: SVGDocument,
    private readonly newGid: string,
    private readonly ids: string[],
  ) {
    super();
  }

  execute(): string {
    if (this.doc.has(this.newGid)) throw new CliError(`id already exists: ${this.newGid}`);
    const shapes = this.ids.map((id) => this.requireShape(this.doc, id));
    const seen = new Set<string>();
    for (const id of this.ids) {
      if (seen.has(id)) throw new CliError(`duplicate id: ${id}`);
      seen.add(id);
    }
    for (const a of shapes) {
      for (const b of shapes) {
        if (a !== b && a.isAncestorOf(b)) {
          throw new CliError(`cannot group a container into its own descendant: ${a.id}`);
        }
      }
    }
    this.origins = shapes.map((s) => ({
      shape: s,
      parent: s.parent,
      index: this.doc.siblingListOf(s).indexOf(s),
    }));

    const first = this.origins[0];
    // 先摘除全部成员（校验已全部通过，此后的变更不会再失败），保证原子性
    for (const origin of this.origins) this.doc.detach(origin.shape);
    this.group = new GroupShape(this.newGid);
    this.doc.attach(this.group, first.parent, first.index);
    for (const origin of this.origins) this.doc.attach(origin.shape, this.group);

    return `g#${this.newGid} created with ${shapes.length} children`;
  }

  undo(): string {
    if (!this.group) throw new CliError('group command was not executed');
    for (const child of [...this.group.children]) this.doc.detach(child);
    this.doc.detach(this.group);

    // 按原父级分组、原下标升序回插，精确恢复每个成员的原位置
    const byParent = new Map<GroupShape | null, Origin[]>();
    for (const origin of this.origins) {
      const list = byParent.get(origin.parent) ?? [];
      list.push(origin);
      byParent.set(origin.parent, list);
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => a.index - b.index);
      for (const origin of list) this.doc.attach(origin.shape, origin.parent, origin.index);
    }
    return `g#${this.newGid} ungrouped (${this.origins.length} children restored)`;
  }
}
