/* Executa todas as suítes de navegador em sequência. */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.js') && !['helpers.js', 'run.js'].includes(f))
  .sort();

let failed = 0;
for (const file of files) {
  console.log('\n=== ' + file + ' ===');
  const r = spawnSync(process.execPath, [path.join(__dirname, file)], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env
  });
  if (r.status !== 0) failed++;
}
console.log('\n' + (failed ? failed + ' suíte(s) falharam.' : 'Todas as suítes passaram.'));
process.exitCode = failed ? 1 : 0;
