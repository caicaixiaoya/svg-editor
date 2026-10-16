/**
 * 全局共享内核：CLI 错误。
 * message 为去掉 `error:` 前缀后的正文，由 CLI 层统一加前缀输出。
 * 各层（model/command/io/cli）只抛 CliError；非 CliError 一律视为内部错误。
 */
export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliError';
  }
}
