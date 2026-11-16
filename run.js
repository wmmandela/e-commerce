/**
 * Single Entrypoint Runner for LuxeMart E-Commerce
 * Spawns both Backend (Express/SQLite) and Frontend (Vite/Vue 3)
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('=================================================================');
console.log(' 🚀 Starting LuxeMart E-Commerce Platform');
console.log(' Vue 3 + Express + SQLite + Safaricom M-Pesa + Multi-Device Sync');
console.log('=================================================================\n');

// 1. Start Backend
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  env: { ...process.env, PORT: 5001 }
});

// 2. Start Frontend
const frontend = spawn('npx', ['vite', '--port', '5173', '--host'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  env: { ...process.env }
});

const cleanup = () => {
  console.log('\nShutting down servers...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
