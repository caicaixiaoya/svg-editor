#!/usr/bin/env node
/**
 * 依赖方向检查：扫描 src 下所有相对 import，对照架构方案的依赖矩阵，
 * 出现违规即非零退出。一致性自查的自动化依据（doc/README.md §3）。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

// 允许的依赖方向：模块 → 可依赖的模块集合（'' 表示 src 根的共享内核）
const RULES = {
  '': ['*'],
  model: ['model', ''],
  command: ['command', 'model', ''],
  io: ['io', 'model', ''],
  view: ['view', 'model', ''],
  cli: ['cli', 'command', 'model', 'io', 'view', ''],
  test: ['*'],
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.ts')) out.push(full);
  }
  return out;
}

function moduleOf(file) {
  const rel = relative(SRC, file);
  const parts = rel.split(sep);
  return parts.length === 1 ? '' : parts[0];
}

let violations = 0;
const edgeCount = new Map();

for (const file of walk(SRC)) {
  const from = moduleOf(file);
  const source = readFileSync(file, 'utf8');
  const imports = [...source.matchAll(/from '(\.[^']+)'/g)].map((m) => m[1]);
  for (const spec of imports) {
    const target = moduleOf(join(dirname(file), spec));
    if (target === from) continue;
    const allowed = RULES[from] ?? [];
    const key = `${from || '(root)'} -> ${target || '(root)'}`;
    edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
    if (!allowed.includes('*') && !allowed.includes(target)) {
      console.error(`VIOLATION ${file}: ${from || '(root)'} 不得依赖 ${target || '(root)'}`);
      violations++;
    }
  }
}

console.log('\n依赖边统计（from -> to: 条数）：');
for (const [edge, n] of [...edgeCount.entries()].sort()) console.log(`  ${edge}: ${n}`);
console.log(violations === 0 ? '\nOK: 依赖方向全部符合架构方案' : `\n${violations} 处违规`);
process.exit(violations === 0 ? 0 : 1);
