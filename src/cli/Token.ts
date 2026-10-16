/** 词法单元：quoted 标记内容是否来自双引号包裹（带空格参数）。 */
export class Token {
  constructor(
    readonly text: string,
    readonly quoted: boolean,
  ) {}
}
