import { writeFileSync } from 'node:fs';
import { SVGDocument } from '../model/SVGDocument';
import { SvgTextWriter } from '../model/SvgTextWriter';
import { CliError } from '../CliError';
import { fmt } from '../model/Num';

/** 序列化当前文档并落盘：文件头 + <svg> 根 + 各图形多态自序列化。 */
export class SvgWriter {
  static write(doc: SVGDocument, path: string): number {
    const writer = new SvgTextWriter();
    writer.raw('<?xml version="1.0" encoding="UTF-8"?>');
    writer.open('svg', [
      ['xmlns', 'http://www.w3.org/2000/svg'],
      ['width', doc.width],
      ['height', doc.height],
      ['viewBox', `0 0 ${fmt(doc.width)} ${fmt(doc.height)}`],
    ]);
    for (const shape of doc.rootChildren) shape.writeSvg(writer);
    writer.close('svg');

    try {
      writeFileSync(path, writer.toString() + '\n', 'utf8');
    } catch {
      throw new CliError(`cannot write file: ${path}`);
    }
    return doc.elementCount();
  }
}
