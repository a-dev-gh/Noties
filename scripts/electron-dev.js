/**
 * Launcher script that strips ELECTRON_RUN_AS_NODE from the environment
 * before spawning electron-vite.
 *
 * When running inside Electron-based editors (VS Code, Cursor, etc.) or
 * agent tools (Claude Code), ELECTRON_RUN_AS_NODE=1 is often inherited.
 * This variable tells electron.exe to act as plain Node.js, which breaks
 * require("electron") in the main process.
 */
const { execSync } = require('child_process');

delete process.env.ELECTRON_RUN_AS_NODE;

const args = process.argv.slice(2).join(' ');
try {
  execSync(`npx electron-vite ${args}`, {
    stdio: 'inherit',
    env: process.env
  });
} catch (e) {
  process.exit(e.status ?? 1);
}
