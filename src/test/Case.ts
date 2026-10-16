/**
 * 一个 golden 回放用例：向全新 Session 逐行喂入 script，
 * 逐行比对全部输出；可选断言产物文件内容或两文件字节一致。
 */
export class Case {
  constructor(
    readonly name: string,
    readonly script: string[],
    readonly expected: string[],
    readonly expectFile?: { path: string; content: string },
    readonly expectFilesEqual?: [string, string],
  ) {}
}
