/**
 * Project setup verification tests
 * These tests verify the project is properly initialized
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = join(import.meta.dirname, '..');

describe('Project Initialization', () => {
  let packageJson;
  let gitignoreContent;

  beforeAll(() => {
    if (existsSync(join(ROOT, 'package.json'))) {
      packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
    }
    if (existsSync(join(ROOT, '.gitignore'))) {
      gitignoreContent = readFileSync(join(ROOT, '.gitignore'), 'utf-8');
    }
  });

  describe('package.json', () => {
    it('should exist', () => {
      expect(existsSync(join(ROOT, 'package.json'))).toBe(true);
    });

    it('should have correct project name', () => {
      expect(packageJson.name).toBe('tracelight');
    });

    it('should have electron-vite as dev dependency', () => {
      expect(packageJson.devDependencies?.['electron-vite']).toBeDefined();
    });

    it('should have React dependencies', () => {
      expect(packageJson.dependencies?.react).toBeDefined();
      expect(packageJson.dependencies?.['react-dom']).toBeDefined();
    });

    it('should have TypeScript as dev dependency', () => {
      expect(packageJson.devDependencies?.typescript).toBeDefined();
    });

    it('should have electron as dev dependency', () => {
      expect(packageJson.devDependencies?.electron).toBeDefined();
    });

    it('should have Ant Design as dependency', () => {
      expect(packageJson.dependencies?.antd).toBeDefined();
    });

    it('should have Zustand as dependency', () => {
      expect(packageJson.dependencies?.zustand).toBeDefined();
    });

    it('should have React Router as dependency', () => {
      expect(packageJson.dependencies?.['react-router-dom']).toBeDefined();
    });

    it('should have better-sqlite3 as dependency', () => {
      expect(packageJson.dependencies?.['better-sqlite3']).toBeDefined();
    });

    it('should have isomorphic-git as dependency', () => {
      expect(packageJson.dependencies?.['isomorphic-git']).toBeDefined();
    });

    it('should have electron-builder as dev dependency', () => {
      expect(packageJson.devDependencies?.['electron-builder']).toBeDefined();
    });

    it('should have ESLint and Prettier as dev dependencies', () => {
      expect(packageJson.devDependencies?.eslint).toBeDefined();
      expect(packageJson.devDependencies?.prettier).toBeDefined();
    });

    it('should have required scripts', () => {
      expect(packageJson.scripts?.dev).toBeDefined();
      expect(packageJson.scripts?.build).toBeDefined();
    });
  });

  describe('.gitignore', () => {
    it('should exist', () => {
      expect(existsSync(join(ROOT, '.gitignore'))).toBe(true);
    });

    it('should ignore node_modules', () => {
      expect(gitignoreContent).toContain('node_modules');
    });

    it('should ignore dist', () => {
      expect(gitignoreContent).toContain('dist');
    });

    it('should ignore electron dist', () => {
      expect(gitignoreContent).toContain('out');
    });
  });

  describe('Git repository', () => {
    it('should be initialized', () => {
      expect(existsSync(join(ROOT, '.git'))).toBe(true);
    });
  });
});
