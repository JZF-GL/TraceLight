import { describe, it, expect, vi } from 'vitest';

// Mock the App component
vi.mock('../src/App', () => ({
  default: () => <div data-testid="mock-app">Mock App</div>,
}));

describe('Main Entry Point', () => {
  it('index.html contains root div', () => {
    const fs = require('fs');
    const path = require('path');
    const indexHtml = fs.readFileSync(
      path.resolve(__dirname, '../index.html'),
      'utf-8'
    );
    expect(indexHtml).toContain('id="root"');
  });

  it('index.html references main.tsx', () => {
    const fs = require('fs');
    const path = require('path');
    const indexHtml = fs.readFileSync(
      path.resolve(__dirname, '../index.html'),
      'utf-8'
    );
    expect(indexHtml).toContain('src/main.tsx');
  });

  it('main.tsx imports React', () => {
    const fs = require('fs');
    const path = require('path');
    const mainTsx = fs.readFileSync(
      path.resolve(__dirname, '../src/main.tsx'),
      'utf-8'
    );
    expect(mainTsx).toContain("import React from 'react'");
  });

  it('main.tsx renders App component', () => {
    const fs = require('fs');
    const path = require('path');
    const mainTsx = fs.readFileSync(
      path.resolve(__dirname, '../src/main.tsx'),
      'utf-8'
    );
    expect(mainTsx).toContain('<App />');
  });

  it('main.tsx uses ReactDOM.createRoot', () => {
    const fs = require('fs');
    const path = require('path');
    const mainTsx = fs.readFileSync(
      path.resolve(__dirname, '../src/main.tsx'),
      'utf-8'
    );
    expect(mainTsx).toContain('ReactDOM.createRoot');
  });
});
