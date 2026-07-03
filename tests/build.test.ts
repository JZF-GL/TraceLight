import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Build Verification', () => {
  const outPath = path.resolve(__dirname, '../out');
  const mainPath = path.join(outPath, 'main');
  const preloadPath = path.join(outPath, 'preload');
  const rendererPath = path.join(outPath, 'renderer');

  beforeAll(() => {
    // Clean previous build artifacts if they exist
    if (fs.existsSync(outPath)) {
      fs.rmSync(outPath, { recursive: true, force: true });
    }
  }, 30000);

  it('should build successfully with pnpm build', () => {
    expect(() => {
      execSync('pnpm build', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe',
        timeout: 120000
      });
    }).not.toThrow();
  }, 180000);

  it('should create out/ directory with all build outputs', () => {
    expect(fs.existsSync(outPath)).toBe(true);
    const outFiles = fs.readdirSync(outPath);
    expect(outFiles).toContain('main');
    expect(outFiles).toContain('preload');
    expect(outFiles).toContain('renderer');
  });

  it('should have valid main process entry point', () => {
    const mainIndex = path.join(mainPath, 'index.js');
    expect(fs.existsSync(mainIndex)).toBe(true);

    const mainContent = fs.readFileSync(mainIndex, 'utf-8');
    expect(mainContent.length).toBeGreaterThan(0);
    // Main process should contain Electron app code
    expect(mainContent).toContain('BrowserWindow');
  });

  it('should have valid preload entry point', () => {
    const preloadIndex = path.join(preloadPath, 'index.mjs');
    expect(fs.existsSync(preloadIndex)).toBe(true);

    const preloadContent = fs.readFileSync(preloadIndex, 'utf-8');
    expect(preloadContent.length).toBeGreaterThan(0);
    // Preload should contain contextBridge
    expect(preloadContent).toContain('contextBridge');
  });

  it('should have renderer HTML entry point', () => {
    const indexHtml = path.join(rendererPath, 'index.html');
    expect(fs.existsSync(indexHtml)).toBe(true);

    const htmlContent = fs.readFileSync(indexHtml, 'utf-8');
    expect(htmlContent).toContain('TraceLight');
    expect(htmlContent).toContain('root');
  });

  it('should have renderer JavaScript bundle', () => {
    const assetsPath = path.join(rendererPath, 'assets');
    expect(fs.existsSync(assetsPath)).toBe(true);

    const assets = fs.readdirSync(assetsPath);
    const jsFiles = assets.filter(f => f.endsWith('.js'));
    expect(jsFiles.length).toBeGreaterThan(0);
  });

  it('should have renderer CSS bundle', () => {
    const assetsPath = path.join(rendererPath, 'assets');
    expect(fs.existsSync(assetsPath)).toBe(true);

    const assets = fs.readdirSync(assetsPath);
    const cssFiles = assets.filter(f => f.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);
  });
});
