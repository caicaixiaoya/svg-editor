import { CliError } from '../CliError';

/** 数值显示：整数不带小数点，浮点截去尾部噪声（保留 6 位小数精度）。 */
export function fmt(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 1e6) / 1e6);
}

/** 数值解析：非法输入抛 CliError（`error: invalid number: xx`）。 */
export function parseNum(raw: string): number {
  const v = Number(raw);
  if (Number.isNaN(v)) throw new CliError(`invalid number: ${raw}`);
  return v;
}
