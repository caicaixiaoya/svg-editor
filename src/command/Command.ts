import { SVGDocument } from '../model/SVGDocument';
import { Shape } from '../model/Shape';
import { CliError } from '../CliError';

/**
 * Command 模式：一条编辑命令 = 一个对象 = 一个 undo 单元。
 * execute() 完成全部校验后再变更状态（失败抛 CliError，不留下半成品），
 * undo() 与 execute() 对称可逆；redo 复用 execute()。
 * 返回值为回显给用户的消息文本。
 */
export abstract class Command {
  abstract execute(): string;
  abstract undo(): string;

  protected requireShape(doc: SVGDocument, id: string): Shape {
    const s = doc.find(id);
    if (!s) throw new CliError(`no such shape: ${id}`);
    return s;
  }
}
