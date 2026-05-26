const { spawn } = require('child_process');
const path = require('path');

console.log('=====================================================');
console.log('🚀 Monorepo Launcher: Express (Nodemon) & React (Vite)');
console.log('=====================================================');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// Start Backend Express Server (running under nodemon via 'npm run dev')
const server = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, '..', 'backend'),
  stdio: 'inherit',
  shell: true
});

// Start Frontend React Dev Server (running under vite via 'npm run dev')
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, '..', 'client'),
  stdio: 'inherit',
  shell: true
});

// Make sure children exit when parent exits
server.on('exit', (code) => {
  console.log(`Backend server (Nodemon) exited with code ${code}`);
  client.kill();
  process.exit(code);
});

client.on('exit', (code) => {
  console.log(`Frontend dev server (Vite) exited with code ${code}`);
  server.kill();
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('\nGracefully terminating Monorepo dev processes...');
  try {
    server.kill();
    client.kill();
  } catch (e) {}
  process.exit(0);
});
