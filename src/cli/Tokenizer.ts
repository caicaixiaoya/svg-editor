import { Token } from './Token';
import { CliError } from '../CliError';

/** 行词法分析：空白分隔；双引号包裹的部分（可含空格）为单个词法单元。 */
export class Tokenizer {
  static parse(line: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < line.length) {
      while (i < line.length && /\s/.test(line[i])) i++;
      if (i >= line.length) break;
      if (line[i] === '"') {
        const end = line.indexOf('"', i + 1);
        if (end < 0) throw new CliError('unterminated string');
        tokens.push(new Token(line.slice(i + 1, end), true));
        i = end + 1;
      } else {
        let j = i;
        while (j < line.length && !/\s/.test(line[j])) j++;
        tokens.push(new Token(line.slice(i, j), false));
        i = j;
      }
    }
    return tokens;
  }
}
