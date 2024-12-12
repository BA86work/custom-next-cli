import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { TemplateManager } from '../src/templateManager';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

describe('TemplateManager', () => {
  let templateManager: TemplateManager;
  const cacheDir = join(homedir(), '.create-next-shadcn-pwa');
  const testTempDir = join(__dirname, 'test-temp');

  beforeEach(() => {
    templateManager = new TemplateManager();
    // Create test temp directory with some files
    if (!existsSync(testTempDir)) {
      mkdirSync(testTempDir, { recursive: true });
      writeFileSync(join(testTempDir, 'test.txt'), 'test content');
    }
  });

  afterEach(() => {
    // Cleanup test directories
    [cacheDir, testTempDir].forEach(dir => {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  test('validates correct version format', async () => {
    const version = '13.4.0';
    const result = await templateManager.validateVersion(version);
    expect(result).toBe(version);
  });

  test('accepts "latest" as version', async () => {
    const version = 'latest';
    const result = await templateManager.validateVersion(version);
    expect(result).toBe(version);
  });

  test('rejects invalid version format', async () => {
    const version = 'invalid';
    await expect(templateManager.validateVersion(version)).rejects.toThrow();
  });

  test('caches template successfully', async () => {
    const dependencies = { 'test-dep': '1.0.0' };
    await templateManager.cacheTemplate(testTempDir, dependencies);
    
    const cachedTemplate = await templateManager.getCachedTemplate();
    expect(cachedTemplate).not.toBeNull();
    expect(existsSync(join(cacheDir, 'template', 'test.txt'))).toBe(true);
  });

  test('throws error when source template directory does not exist', async () => {
    const nonExistentDir = join(__dirname, 'non-existent');
    const dependencies = { 'test-dep': '1.0.0' };
    
    await expect(templateManager.cacheTemplate(nonExistentDir, dependencies))
      .rejects
      .toThrow('Source template directory not found');
  });
}); 