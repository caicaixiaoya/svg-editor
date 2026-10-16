import { SVGDocument } from '../model/SVGDocument';
import { Shape } from '../model/Shape';
import { fmt } from '../model/Num';

/**
 * tree 命令渲染：结构树 + 关键几何属性内联。
 * 对齐规则：同一棵（子）树内所有标签（type#id）按最长者对齐，再留 2 空格接属性。
 */
export class TreeRenderer {
  static renderDocument(doc: SVGDocument): string[] {
    const width = TreeRenderer.maxLabelLength(doc.rootChildren);
    const lines = [`svg (${fmt(doc.width)}x${fmt(doc.height)})`];
    TreeRenderer.pushChildren(doc.rootChildren, '', lines, width);
    return lines;
  }

  static renderSubtree(root: Shape): string[] {
    const width = TreeRenderer.maxLabelLength([root]);
    const lines = [TreeRenderer.nodeLine(root, '', width)];
    const container = root.asContainer();
    if (container) TreeRenderer.pushChildren(container.children, '', lines, width);
    return lines;
  }

  private static maxLabelLength(shapes: readonly Shape[]): number {
    let max = 0;
    for (const s of shapes) {
      max = Math.max(max, s.label().length);
      for (const child of s.children) max = Math.max(max, TreeRenderer.maxLabelLength([child]));
    }
    return max;
  }

  private static pushChildren(
    children: readonly Shape[],
    prefix: string,
    lines: string[],
    width: number,
  ): void {
    children.forEach((shape, i) => {
      const last = i === children.length - 1;
      lines.push(TreeRenderer.nodeLine(shape, prefix + (last ? '└── ' : '├── '), width));
      const container = shape.asContainer();
      if (container) {
        TreeRenderer.pushChildren(container.children, prefix + (last ? '    ' : '│   '), lines, width);
      }
    });
  }

  private static nodeLine(shape: Shape, prefix: string, width: number): string {
    const label = shape.label().padEnd(width + 2);
    const summary = shape.geometrySummary() + TreeRenderer.fillSuffix(shape);
    return (prefix + label + summary).trimEnd();
  }

  private static fillSuffix(shape: Shape): string {
    return shape.fill ? ` fill=${shape.fill}` : '';
  }
}
