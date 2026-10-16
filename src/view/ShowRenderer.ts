import { Shape } from '../model/Shape';

/** show 命令渲染：单图形的属性明细（几何 / 附加明细 / 样式）。 */
export class ShowRenderer {
  static render(shape: Shape): string[] {
    const parent = shape.parent ? shape.parent.label() : 'svg';
    const lines = [`${shape.label()}  parent=${parent}`, `  ${shape.geometryDetail()}`];
    for (const extra of shape.extraDetail()) lines.push(`  ${extra}`);
    if (shape.fill !== null) lines.push(`  fill=${shape.fill}`);
    if (shape.stroke !== null) lines.push(`  stroke=${shape.stroke}`);
    if (shape.strokeWidth !== null) lines.push(`  stroke-width=${shape.strokeWidth}`);
    return lines;
  }
}
