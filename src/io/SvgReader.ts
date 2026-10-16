import { readFileSync } from 'node:fs';
import { XmlParser } from './XmlParser';
import { XmlNode } from './XmlNode';
import { SVGDocument } from '../model/SVGDocument';
import { ShapeFactory } from '../model/ShapeFactory';
import { GroupShape } from '../model/GroupShape';
import { CliError } from '../CliError';

const SUPPORTED_TAGS = new Set(['rect', 'circle', 'ellipse', 'line', 'text', 'g']);

/**
 * 读入 SVG 文件为当前文档。
 * - 缺 id 的元素按 `标签名+序号` 自动补齐并打印警告；
 * - 不支持的元素跳过（警告）；transform 不参与模型，显式警告；
 * - 显式 id 重复视为文件错误（整条 read 失败，不改变任何状态）。
 */
export class SvgReader {
  static read(path: string): { doc: SVGDocument; warnings: string[] } {
    let source: string;
    try {
      source = readFileSync(path, 'utf8');
    } catch {
      throw new CliError(`cannot read file: ${path}`);
    }

    let root: XmlNode;
    try {
      root = XmlParser.parse(source);
    } catch (e) {
      throw new CliError(`invalid XML in ${path}: ${(e as Error).message}`);
    }

    if (localName(root.tag) !== 'svg') throw new CliError(`not an SVG document: ${path}`);

    const size = (key: string): number => {
      const v = Number(root.attrs.get(key));
      return Number.isFinite(v) && v > 0 ? v : NaN;
    };
    let width = size('width');
    let height = size('height');
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      const viewBox = (root.attrs.get('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
      if (viewBox.length === 4 && viewBox.every(Number.isFinite)) {
        if (!Number.isFinite(width)) width = viewBox[2];
        if (!Number.isFinite(height)) height = viewBox[3];
      }
    }
    const doc = new SVGDocument(
      Number.isFinite(width) && width > 0 ? width : 800,
      Number.isFinite(height) && height > 0 ? height : 600,
    );

    const warnings: string[] = [];
    for (const child of root.children) SvgReader.buildElement(child, doc, null, warnings);
    return { doc, warnings };
  }

  private static buildElement(
    node: XmlNode,
    doc: SVGDocument,
    parent: GroupShape | null,
    warnings: string[],
  ): void {
    const tag = localName(node.tag);
    if (node.attrs.has('transform')) warnings.push(`warning: ignored transform on <${tag}>`);
    if (!SUPPORTED_TAGS.has(tag)) {
      warnings.push(`warning: skipped unsupported element <${tag}>`);
      return;
    }

    let id = node.attrs.get('id');
    if (id === undefined) {
      id = SvgReader.autoId(doc, tag);
      warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`);
    } else if (doc.has(id)) {
      throw new CliError(`duplicate id in file: ${id}`);
    }

    const shape = ShapeFactory.fromXml(tag, id, node.attrs, node.text);
    if (!shape) return;
    doc.attach(shape, parent);

    const container = shape.asContainer();
    if (container) for (const child of node.children) SvgReader.buildElement(child, doc, container, warnings);
  }

  private static autoId(doc: SVGDocument, tag: string): string {
    let n = 1;
    while (doc.has(`${tag}${n}`)) n++;
    return `${tag}${n}`;
  }
}

function localName(tag: string): string {
  const idx = tag.indexOf(':');
  return idx >= 0 ? tag.slice(idx + 1) : tag;
}
