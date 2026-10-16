/** 解析后的 XML 节点：标签、属性表、子节点与拼接文本内容。 */
export class XmlNode {
  readonly children: XmlNode[] = [];
  text = '';

  constructor(
    readonly tag: string,
    readonly attrs: Map<string, string>,
  ) {}
}
