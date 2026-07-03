import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('Lint Verification', () => {
  it('should pass ESLint with no errors', () => {
    const projectRoot = path.resolve(__dirname, '..');

    expect(() => {
      execSync('pnpm lint', {
        cwd: projectRoot,
        stdio: 'pipe',
        timeout: 60000
      });
    }).not.toThrow();
  }, 120000);
});
