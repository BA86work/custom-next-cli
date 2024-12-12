import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface DependencyValidationResult {
  isValid: boolean;
  errors: string[];
}

export class TemplateManager {
  private cacheDir: string;
  private cacheFile: string;
  private cacheMaxAge = 24 * 60 * 60 * 1000;
  private isWindows = process.platform === 'win32';

  constructor() {
    this.cacheDir = join(homedir(), '.create-next-shadcn-pwa');
    this.cacheFile = join(this.cacheDir, 'cache.json');
    this.ensureCacheDir();
  }

  private ensureCacheDir() {
    try {
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error: any) {
      throw new Error(`Failed to create cache directory: ${error?.message || 'Unknown error'}`);
    }
  }

  private cleanDirectory(dir: string) {
    try {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
      }
    } catch (error: any) {
      throw new Error(`Failed to clean directory ${dir}: ${error?.message || 'Unknown error'}`);
    }
  }

  async validateDependencies(dependencies: Record<string, string>): Promise<DependencyValidationResult> {
    const result: DependencyValidationResult = { isValid: true, errors: [] };
    
    for (const [name, version] of Object.entries(dependencies)) {
      try {
        const cmd = `npm view ${name}@${version} version`;
        execSync(cmd, { stdio: 'pipe' });
      } catch (error) {
        result.isValid = false;
        result.errors.push(`Invalid dependency: ${name}@${version}`);
      }
    }

    return result;
  }

  async validateVersion(version: string): Promise<string> {
    if (version === 'latest') return version;
    
    const semverRegex = /^(\d+\.\d+\.\d+)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
    if (!semverRegex.test(version)) {
      throw new Error('Invalid version format. Use semver (e.g., 13.4.0) or "latest"');
    }

    try {
      const npmCheck = execSync(`npm view next@${version} version`, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8' 
      });
      return npmCheck.trim();
    } catch (error: any) {
      throw new Error(`Next.js version ${version} not found: ${error?.message || 'Unknown error'}`);
    }
  }

  async getCachedTemplate(): Promise<string | null> {
    try {
      if (!existsSync(this.cacheFile)) return null;

      const cache = JSON.parse(
        readFileSync(this.cacheFile, 'utf-8')
      );

      if (Date.now() - cache.lastUpdated > this.cacheMaxAge) {
        return null;
      }

      const tempDir = join(this.cacheDir, 'template');
      if (!existsSync(tempDir)) return null;

      return tempDir;
    } catch (error: any) {
      console.warn(`Cache read failed: ${error?.message || 'Unknown error'}`);
      return null;
    }
  }

  async cacheTemplate(tempDir: string, dependencies: Record<string, string>) {
    try {
      if (!existsSync(tempDir)) {
        throw new Error(`Source template directory not found: ${tempDir}`);
      }

      // Validate dependencies before caching
      const validationResult = await this.validateDependencies(dependencies);
      if (!validationResult.isValid) {
        throw new Error(`Invalid dependencies found:\n${validationResult.errors.join('\n')}`);
      }

      const cache = {
        lastUpdated: Date.now(),
        templateVersion: '1.0.0',
        dependencies
      };

      // Save cache metadata
      writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
      
      const cacheTempDir = join(this.cacheDir, 'template');
      
      // Clean existing cache directory
      this.cleanDirectory(cacheTempDir);
      
      // Create cache directory
      mkdirSync(cacheTempDir, { recursive: true });

      try {
        // Use native fs.cpSync for more reliable copying
        cpSync(tempDir, cacheTempDir, { 
          recursive: true,
          force: true,
          errorOnExist: false
        });
      } catch (copyError: any) {
        // Fallback to command line copy if native copy fails
        const copyCmd = this.isWindows
          ? `xcopy /E /I /Y /Q "${tempDir}" "${cacheTempDir}"`
          : `cp -rf "${tempDir}/." "${cacheTempDir}"`;
        
        try {
          execSync(copyCmd, {
            stdio: 'pipe',
            shell: this.isWindows ? 'cmd.exe' : '/bin/sh'
          });
        } catch (cmdError: any) {
          throw new Error(`Failed to copy template: ${cmdError?.message || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      console.error('Failed to cache template:', error?.message || 'Unknown error');
      throw error;
    }
  }

  async getCurrentNodeVersion(): Promise<string> {
    try {
      const nodeVersion = process.version;
      return nodeVersion.replace('v', '');
    } catch (error: any) {
      console.warn(`Failed to get Node version: ${error?.message || 'Unknown error'}`);
      return '18.x';
    }
  }

  async validateNodeVersion(version: string): Promise<string> {
    if (version === 'current') {
      return this.getCurrentNodeVersion();
    }

    const nodeVersionRegex = /^(\d+)(?:\.(?:x|\d+)(?:\.(?:x|\d+))?)?$/;
    if (!nodeVersionRegex.test(version)) {
      throw new Error('Invalid Node.js version format. Use: 18.x, 18, or 18.17.0');
    }

    return version;
  }
} 