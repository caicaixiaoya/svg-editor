import { XmlNode } from './XmlNode';
import { CliError } from '../CliError';

/**
 * 手写递归下降 XML 解析器（零运行时依赖）。
 * 覆盖良构 SVG 的子集：XML 声明 / 注释 / DOCTYPE（含内部子集）/ CDATA /
 * 单双引号属性 / 数字与命名实体。语法错误抛 CliError。
 */
export class XmlParser {
  private i = 0;

  private constructor(private readonly src: string) {}

  static parse(source: string): XmlNode {
    const parser = new XmlParser(source.replace(/^\uFEFF/, ''));
    parser.skipMisc();
    const root = parser.parseElement();
    parser.skipMisc();
    if (!parser.eof()) throw new CliError(`unexpected content after root element`);
    return root;
  }

  private eof(): boolean {
    return this.i >= this.src.length;
  }

  private peek(): string {
    return this.src[this.i];
  }

  private startsWith(s: string): boolean {
    return this.src.startsWith(s, this.i);
  }

  private skipWs(): void {
    while (!this.eof() && /\s/.test(this.peek())) this.i++;
  }

  /** 跳过顶层与元素间的杂项：空白、<?...?>、<!--...-->、<!DOCTYPE...>。 */
  private skipMisc(): void {
    for (;;) {
      this.skipWs();
      if (this.startsWith('<?')) {
        const end = this.src.indexOf('?>', this.i);
        if (end < 0) throw new CliError('unterminated processing instruction');
        this.i = end + 2;
        continue;
      }
      if (this.startsWith('<!--')) {
        const end = this.src.indexOf('-->', this.i);
        if (end < 0) throw new CliError('unterminated comment');
        this.i = end + 3;
        continue;
      }
      if (this.startsWith('<!')) {
        this.skipDeclaration();
        continue;
      }
      return;
    }
  }

  private skipDeclaration(): void {
    this.i += 2;
    let depth = 0;
    while (!this.eof()) {
      const c = this.src[this.i++];
      if (c === '[') depth++;
      else if (c === ']') depth--;
      else if (c === '>' && depth === 0) return;
    }
    throw new CliError('unterminated declaration');
  }

  private readName(): string {
    const m = /^[A-Za-z_:][A-Za-z0-9_.:-]*/.exec(this.src.slice(this.i));
    if (!m) throw new CliError(`expected a name at offset ${this.i}`);
    this.i += m[0].length;
    return m[0];
  }

  private parseElement(): XmlNode {
    if (this.peek() !== '<') throw new CliError(`expected '<' at offset ${this.i}`);
    this.i++;
    const tag = this.readName();
    const attrs = new Map<string, string>();
    let selfClosing = false;

    for (;;) {
      this.skipWs();
      if (this.eof()) throw new CliError(`unexpected EOF in <${tag}>`);
      const c = this.peek();
      if (c === '>') {
        this.i++;
        break;
      }
      if (c === '/') {
        this.i++;
        if (this.peek() !== '>') throw new CliError(`expected '>' after '/' in <${tag}>`);
        this.i++;
        selfClosing = true;
        break;
      }
      const name = this.readName();
      this.skipWs();
      if (this.peek() !== '=') throw new CliError(`expected '=' after attribute '${name}'`);
      this.i++;
      this.skipWs();
      const quote = this.peek();
      if (quote !== '"' && quote !== "'") throw new CliError(`attribute '${name}' must be quoted`);
      this.i++;
      const end = this.src.indexOf(quote, this.i);
      if (end < 0) throw new CliError(`unterminated attribute value for '${name}'`);
      attrs.set(name, this.decodeEntities(this.src.slice(this.i, end)));
      this.i = end + 1;
    }

    const node = new XmlNode(tag, attrs);
    if (selfClosing) return node;

    for (;;) {
      if (this.eof()) throw new CliError(`unexpected EOF, <${tag}> not closed`);
      if (this.startsWith('</')) {
        this.i += 2;
        const closeTag = this.readName();
        this.skipWs();
        if (this.peek() !== '>') throw new CliError(`expected '>' in </${closeTag}>`);
        this.i++;
        if (closeTag !== tag) throw new CliError(`mismatched close tag: expected </${tag}>, got </${closeTag}>`);
        return node;
      }
      if (this.startsWith('<!--')) {
        const end = this.src.indexOf('-->', this.i);
        if (end < 0) throw new CliError('unterminated comment');
        this.i = end + 3;
        continue;
      }
      if (this.startsWith('<![CDATA[')) {
        const end = this.src.indexOf(']]>', this.i);
        if (end < 0) throw new CliError('unterminated CDATA section');
        node.text += this.src.slice(this.i + 9, end);
        this.i = end + 3;
        continue;
      }
      if (this.startsWith('<?')) {
        const end = this.src.indexOf('?>', this.i);
        if (end < 0) throw new CliError('unterminated processing instruction');
        this.i = end + 2;
        continue;
      }
      if (this.peek() === '<') {
        node.children.push(this.parseElement());
        continue;
      }
      const lt = this.src.indexOf('<', this.i);
      const stop = lt < 0 ? this.src.length : lt;
      node.text += this.decodeEntities(this.src.slice(this.i, stop));
      this.i = stop;
    }
  }

  private decodeEntities(s: string): string {
    return s.replace(/&(#x?[0-9a-fA-F]+|[A-Za-z_][A-Za-z0-9_.]*);/g, (whole, entity: string) => {
      if (entity.startsWith('#')) {
        const code = entity[1] === 'x' || entity[1] === 'X'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
        try {
          return String.fromCodePoint(code);
        } catch {
          return whole;
        }
      }
      const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
      return named[entity] ?? whole;
    });
  }
}
