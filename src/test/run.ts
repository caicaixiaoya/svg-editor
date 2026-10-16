import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Session } from '../cli/Session';
import { Case } from './Case';
import { transcriptCases } from './cases/TranscriptCases';
import { errorCases } from './cases/ErrorCases';
import { semanticCases } from './cases/SemanticCases';

/** 在临时目录中准备只读 fixture（错误表 / read 边界用例的输入文件）。 */
function writeFixtures(): void {
  writeFileSync(
    'other.svg',
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">',
      '  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>',
      '  <text id="t1" x="10" y="290">imported</text>',
      '  <circle id="c1" cx="50" cy="50" r="10"/>',
      '  <g id="g1">',
      '    <rect id="r2" x="0" y="0" width="10" height="10"/>',
      '    <circle id="c2" cx="5" cy="5" r="2"/>',
      '  </g>',
      '  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>',
      '</svg>',
      '',
    ].join('\n'),
    'utf8',
  );
  writeFileSync('dupid.svg', '<svg width="10" height="10"><rect id="x"/><circle id="x"/></svg>', 'utf8');
  writeFileSync('bad.xml', '<svg><unclosed></svg>', 'utf8');
  writeFileSync('nosvg.xml', '<?xml version="1.0"?><foo/>', 'utf8');
  writeFileSync(
    'unsupported.svg',
    '<svg width="100" height="50"><path id="p" d="M0 0"/><rect id="r" x="0" y="0" width="1" height="1"/></svg>',
    'utf8',
  );
  writeFileSync(
    'transform.svg',
    '<svg width="10" height="10"><g id="g" transform="translate(1,2)"><rect id="r" x="0" y="0" width="1" height="1"/></g></svg>',
    'utf8',
  );
  writeFileSync(
    'multi-unnamed.svg',
    '<svg width="10" height="10"><rect x="0" y="0" width="1" height="1"/><rect x="2" y="0" width="1" height="1"/></svg>',
    'utf8',
  );
  writeFileSync(
    'viewbox.svg',
    '<svg viewBox="0 0 320 240"><rect id="r" x="1" y="1" width="2" height="2"/></svg>',
    'utf8',
  );
  mkdirSync('adir');
}

function diffLabel(index: number): string {
  return `line ${index + 1}`;
}

function main(): void {
  const workDir = mkdtempSync(join(tmpdir(), 'svg-editor-test-'));
  process.chdir(workDir);
  writeFixtures();

  const all: Case[] = [...transcriptCases, ...errorCases, ...semanticCases];
  let failed = 0;
  for (const testCase of all) {
    const session = new Session();
    const actual: string[] = [];
    for (const line of testCase.script) {
      actual.push(...session.executeLine(line));
      if (session.quitRequested) break; // 与真实 REPL 一致：exit 后停止喂入
    }

    const problems: string[] = [];
    const maxLines = Math.max(actual.length, testCase.expected.length);
    for (let i = 0; i < maxLines; i++) {
      const exp = testCase.expected[i];
      const got = actual[i];
      if (exp !== got) {
        problems.push(`  output ${diffLabel(i)}: expected ${JSON.stringify(exp)}, got ${JSON.stringify(got)}`);
        break;
      }
    }
    if (actual.length !== testCase.expected.length && problems.length === 0) {
      problems.push(`  output line count: expected ${testCase.expected.length}, got ${actual.length}`);
    }
    if (testCase.expectFile) {
      const content = readFileSync(testCase.expectFile.path, 'utf8');
      if (content !== testCase.expectFile.content) problems.push(`  file ${testCase.expectFile.path} content mismatch`);
    }
    if (testCase.expectFilesEqual) {
      const [a, b] = testCase.expectFilesEqual;
      if (readFileSync(a, 'utf8') !== readFileSync(b, 'utf8')) problems.push(`  files ${a} and ${b} differ`);
    }

    if (problems.length === 0) {
      console.log(`PASS ${testCase.name}`);
    } else {
      failed++;
      console.log(`FAIL ${testCase.name}`);
      for (const p of problems) console.log(p);
    }
  }

  console.log(`\n${all.length - failed}/${all.length} cases passed (workdir: ${workDir})`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main();
