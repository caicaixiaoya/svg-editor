import { fmt } from './Num';

export type AttrPair = [string, string | number | null];

function escapeAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeText(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * SVG 文本的底层写出器（缩进、属性转义、数字格式化）。
 * 放在 model 而非 io：图形的序列化是图形自身的行为（多态写标签），
 * io/SvgWriter 只负责文件头与落盘，避免 io → 各图形类的反向分派。
 */
export class SvgTextWriter {
  private readonly lines: string[] = [];
  private depth = 0;

  raw(line: string): void {
    this.lines.push(line);
  }

  leaf(tag: string, attrs: AttrPair[]): void {
    this.lines.push(this.indent() + '<' + tag + this.attrString(attrs) + '/>');
  }

  open(tag: string, attrs: AttrPair[]): void {
    this.lines.push(this.indent() + '<' + tag + this.attrString(attrs) + '>');
    this.depth++;
  }

  close(tag: string): void {
    this.depth--;
    this.lines.push(this.indent() + '</' + tag + '>');
  }

  /** 单行开闭标签，中间为文本内容（<text> 专用，保证内容前后无换行空白）。 */
  inline(tag: string, attrs: AttrPair[], text: string): void {
    this.lines.push(this.indent() + '<' + tag + this.attrString(attrs) + '>' + escapeText(text) + '</' + tag + '>');
  }

  toString(): string {
    return this.lines.join('\n');
  }

  private indent(): string {
    return '  '.repeat(this.depth);
  }

  private attrString(attrs: AttrPair[]): string {
    let s = '';
    for (const [name, value] of attrs) {
      if (value === null || value === undefined) continue;
      const v = typeof value === 'number' ? fmt(value) : value;
      s += ` ${name}="${escapeAttr(v)}"`;
    }
    return s;
  }
}
