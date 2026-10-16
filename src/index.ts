import readline from 'node:readline';
import { Session } from './cli/Session';

/** 入口：装配 REPL（`npm run cli`）。stdin 管道亦可直接回放命令脚本。 */
const session = new Session();
console.log(`svg-editor 0.1 — type 'help' for commands`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'svg> ',
});
rl.prompt();
rl.on('line', (line: string) => {
  for (const out of session.executeLine(line)) console.log(out);
  if (session.quitRequested) {
    rl.close();
    return;
  }
  rl.prompt();
});
rl.on('close', () => process.exit(0));
