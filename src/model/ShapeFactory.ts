import { Shape } from './Shape';
import { RectShape } from './RectShape';
import { CircleShape } from './CircleShape';
import { EllipseShape } from './EllipseShape';
import { LineShape } from './LineShape';
import { TextShape } from './TextShape';
import { GroupShape } from './GroupShape';
import { CliError } from '../CliError';
import { parseNum } from './Num';

/**
 * 图形工厂：类型名 → 类（全工程允许按名字分派的两处之一，另一处是 CLI 命令分发）。
 * 【待重构】插件化阶段：这里将被 ShapeProvider 注册表取代——内核不再硬编码
 * 六种类型，box 等复合图形以插件注入（见 doc/README.md 变化点假设）。
 */
export class ShapeFactory {
  /** CLI 语法创建：params 为 id 之后的原始参数串。 */
  static create(kind: string, id: string, params: string[]): Shape {
    const n = (i: number): number => parseNum(params[i]);
    switch (kind) {
      case 'rect': {
        this.expectParamCount(params, 4, 5, 'rect');
        const s = new RectShape(id, n(0), n(1), n(2), n(3));
        if (params.length === 5) s.fill = params[4];
        return s;
      }
      case 'circle': {
        this.expectParamCount(params, 3, 4, 'circle');
        const s = new CircleShape(id, n(0), n(1), n(2));
        if (params.length === 4) s.fill = params[3];
        return s;
      }
      case 'ellipse': {
        this.expectParamCount(params, 4, 5, 'ellipse');
        const s = new EllipseShape(id, n(0), n(1), n(2), n(3));
        if (params.length === 5) s.fill = params[4];
        return s;
      }
      case 'line': {
        this.expectParamCount(params, 4, 5, 'line');
        const s = new LineShape(id, n(0), n(1), n(2), n(3));
        if (params.length === 5) s.stroke = params[4];
        return s;
      }
      case 'text': {
        this.expectParamCount(params, 3, 3, 'text');
        return new TextShape(id, n(0), n(1), params[2]);
      }
      case 'g': {
        this.expectParamCount(params, 0, 0, 'g');
        return new GroupShape(id);
      }
      default:
        throw new CliError(`unknown shape type: ${kind} (is the plugin loaded?)`);
    }
  }

  /** 从 XML 属性映射构建（read 用）：不认识的标签返回 null，由调用方决定跳过策略。 */
  static fromXml(
    tag: string,
    id: string,
    attrs: ReadonlyMap<string, string>,
    text: string,
  ): Shape | null {
    const num = (key: string): number => {
      const v = Number(attrs.get(key));
      return Number.isFinite(v) ? v : 0;
    };
    const style = (s: Shape): Shape => {
      if (attrs.has('fill')) s.fill = attrs.get('fill') as string;
      if (attrs.has('stroke')) s.stroke = attrs.get('stroke') as string;
      if (attrs.has('stroke-width')) s.strokeWidth = attrs.get('stroke-width') as string;
      return s;
    };
    switch (tag) {
      case 'rect':
        return style(new RectShape(id, num('x'), num('y'), num('width'), num('height')));
      case 'circle':
        return style(new CircleShape(id, num('cx'), num('cy'), num('r')));
      case 'ellipse':
        return style(new EllipseShape(id, num('cx'), num('cy'), num('rx'), num('ry')));
      case 'line':
        return style(new LineShape(id, num('x1'), num('y1'), num('x2'), num('y2')));
      case 'text':
        return style(new TextShape(id, num('x'), num('y'), text));
      case 'g':
        return style(new GroupShape(id));
      default:
        return null;
    }
  }

  static usageFor(kind: string): string {
    switch (kind) {
      case 'rect': return 'create rect <id> <x> <y> <w> <h> [fill]';
      case 'circle': return 'create circle <id> <cx> <cy> <r> [fill]';
      case 'ellipse': return 'create ellipse <id> <cx> <cy> <rx> <ry> [fill]';
      case 'line': return 'create line <id> <x1> <y1> <x2> <y2> [stroke]';
      case 'text': return 'create text <id> <x> <y> "content"';
      case 'g': return 'create g <id>';
      default: return 'create <type> <id> [params…] [in <containerId>]';
    }
  }

  private static expectParamCount(params: string[], min: number, max: number, kind: string): void {
    if (params.length < min || params.length > max) {
      throw new CliError(`usage: ${ShapeFactory.usageFor(kind)}`);
    }
  }
}
