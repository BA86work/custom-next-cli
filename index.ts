#!/usr/bin/env node
import prompts from "prompts";
import degit from "degit";
import ora from "ora";
import chalk from "chalk";
import boxen from "boxen";
// import gradient from "gradient-string";
import { execSync } from "child_process";
import type { ExecSyncOptions } from "child_process";
import cac from 'cac'
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';

interface CliOptions {
  template?: string;
  version?: string;
}

interface UserChoices {
  projectName: string;
  typescript: boolean;
  eslint: boolean;
  tailwind: boolean;
  srcDir: boolean;
  appRouter: boolean;
  turbo: boolean;
  customAlias: boolean;
  alias?: string;
  shadcn: boolean;
  pwa: boolean;
}

interface VersionChoices {
  nextVersion: string;
  nodeVersion: string;
}

interface CacheConfig {
  lastUpdated: number;
  templateVersion: string;
  dependencies: Record<string, string>;
}

class TemplateManager {
  private cacheDir: string;
  private cacheFile: string;
  private cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.cacheDir = join(homedir(), '.create-next-shadcn-pwa');
    this.cacheFile = join(this.cacheDir, 'cache.json');
    this.ensureCacheDir();
  }

  private ensureCacheDir() {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async validateVersion(version: string): Promise<string> {
    if (version === 'latest') return version;
    
    // Validate semver format
    const semverRegex = /^(\d+\.\d+\.\d+)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
    if (!semverRegex.test(version)) {
      throw new Error('Invalid version format. Use semver (e.g., 13.4.0) or "latest"');
    }

    try {
      // Check if version exists in npm
      const npmCheck = execSync(`npm view next@${version} version`, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8' 
      });
      return npmCheck.trim();
    } catch (error) {
      throw new Error(`Version ${version} not found`);
    }
  }

  async getCachedTemplate(): Promise<string | null> {
    try {
      if (!existsSync(this.cacheFile)) return null;

      const cache: CacheConfig = JSON.parse(
        readFileSync(this.cacheFile, 'utf-8')
      );

      if (Date.now() - cache.lastUpdated > this.cacheMaxAge) {
        return null;
      }

      const tempDir = join(this.cacheDir, 'template');
      if (!existsSync(tempDir)) return null;

      return tempDir;
    } catch (error) {
      return null;
    }
  }

  async cacheTemplate(tempDir: string, dependencies: Record<string, string>) {
    try {
      const cache: CacheConfig = {
        lastUpdated: Date.now(),
        templateVersion: '1.0.0', // Update this based on your template versioning
        dependencies
      };

      writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
      
      // Copy template to cache directory
      const cacheTempDir = join(this.cacheDir, 'template');
      execSync(getCleanupCommand(cacheTempDir));
      execSync(`${isWindows ? 'xcopy /E /I /Y' : 'cp -r'} "${tempDir}" "${cacheTempDir}"`);
    } catch (error) {
      console.warn('Failed to cache template:', error);
    }
  }

  async getCurrentNodeVersion(): Promise<string> {
    try {
      const nodeVersion = process.version;
      return nodeVersion.replace('v', '');
    } catch (error) {
      return '18.x'; // fallback to LTS
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

declare module "degit" {
  interface DegitOptions {
    force?: boolean;
    verbose?: boolean;
  }
  interface Emitter {
    clone(target: string, opts?: { files?: (string | null)[] }): Promise<void>;
  }
  export default function degit(repo: string, opts?: DegitOptions): Emitter;
}

const isWindows = process.platform === 'win32';
const pathSeparator = isWindows ? '\\' : '/';

function getExecOptions(): ExecSyncOptions {
  return {
    stdio: 'inherit',
    shell: isWindows ? 'cmd.exe' : '/bin/sh'
  };
}

function getCleanupCommand(dir: string): string {
  return isWindows 
    ? `if exist ${dir} rmdir /S /Q ${dir}`
    : `rm -rf ${dir}`;
}

async function main() {
  const templateManager = new TemplateManager();

  const versionPrompts = [
    {
      type: 'text' as const,
      name: 'nextVersion',
      message: `Which ${chalk.yellow("Next.js version")} would you like to use?`,
      initial: 'latest',
      validate: async (value: string) => {
        try {
          await templateManager.validateVersion(value);
          return true;
        } catch (error) {
          return (error as Error).message;
        }
      }
    }
  ];

  // Show welcome message
  console.log(
    boxen(
      `😋 ${chalk.black(`Not just a default ${chalk.yellowBright("Next.js")} but something ${chalk.yellowBright("extraordinary")}`)}

Features:
🍡 TypeScript  🍟 ESLint  🍭 + PWA
🍡 App Router  🍟 Turbo   🍭 + Shadcn
🍡 Tailwind    

Added default components:
✨ installPWA.tsx   ✨ disableRightClick.tsx

Sample file config:
📁 metadata   📁 manifest   📁 tailwind

Ready to ${chalk.cyanBright("build something amazing?")}
repo: ${chalk.blueBright("https://github.com/BA86work/next-starter-shadcn-pwa")}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "yellow",
        title: "⚡ NEXT.JS STARTER",
        titleAlignment: "center",
      }
    )
  );

  const cli = cac('create-custom-next-cli')

  cli
    .command('[target]', 'Create a new Next.js project')
    .action(async (target) => {
      // Interactive prompts with better styling
      console.log(chalk.yellow.bold("\n🚀 Let's set up your project!\n"));

      const response = (await prompts([
        {
          type: "text",
          name: "projectName",
          message: `What is your ${chalk.yellow("project named?")}?`,
          initial: "my-app",
        },
        {
          type: "toggle",
          name: "typescript",
          message: `Would you like to use ${chalk.yellow("TypeScript")}?`,
          initial: true,
          active: "Yes",
          inactive: "No",
        },
        {
          type: "toggle",
          name: "eslint",
          message: `Would you like to use ${chalk.yellow("ESLint")}?`,
          initial: true,
          active: "Yes",
          inactive: "No",
        },
        {
          type: "toggle",
          name: "tailwind",
          message: `Would you like to use ${chalk.yellow("Tailwind CSS")}?`,
          initial: true,
          active: "Yes",
          inactive: "No",
        },
        {
          type: "toggle",
          name: "srcDir",
          message: `Would you like your code inside a ${chalk.yellow("src/")} directory?`,
          initial: false,
          active: "Yes",
          inactive: "No",
        },
        {
          type: "toggle",
          name: "appRouter",
          message: `Would you like to use ${chalk.yellow("App Router")}? (recommended)`,
          initial: true,
          active: "Yes",
          inactive: "No",
        },
        {
          type: "toggle",
          name: "turbo",
          message: `Would you like to use ${chalk.yellow("Turbopack")} for next dev?`,
          initial: false,
          active: "Yes",
          inactive: "No",
        },
        {
          type: "toggle",
          name: "customAlias",
          message: `Would you like to customize the ${chalk.yellow("import alias")} (@/* by default)?`,
          initial: false,
          active: "Yes",
          inactive: "No",
        },
        {
          type: "toggle",
          name: "shadcn",
          message: `Would you like to include ${chalk.yellow("shadcn/ui")} components?`,
          initial: true,
          active: "Yes",
          inactive: "No",
        },
        {
          type: "toggle",
          name: "pwa",
          message: `Would you like to add ${chalk.yellow("PWA")} support?`,
          initial: true,
          active: "Yes",
          inactive: "No",
        },
        ...versionPrompts
      ])) as UserChoices & VersionChoices;

      console.log(chalk.yellow("\n📦 Setting up your project...\n"));

      const spinner = ora({
        text: "Creating your app...",
        color: "yellow",
        spinner: "dots",
      }).start();

      try {
        // สร้าง Next.js app พื้นฐานด้วย bun create next-app
        spinner.text = " Initializing Next.js application...";
        const createCommand = [
          `bun create next-app@${response.nextVersion}`,
          response.projectName,
          "--yes",
          "--typescript=" + (response.typescript ? "true" : "false"),
          "--eslint=" + (response.eslint ? "true" : "false"),
          "--tailwind=" + (response.tailwind ? "true" : "false"),
          "--src-dir=" + (response.srcDir ? "true" : "false"),
          "--app=" + (response.appRouter ? "true" : "false"),
          "--turbo=" + (response.turbo ? "true" : "false"),
          "--import-alias=" +
            (response.customAlias ? response.alias || "@/*" : "@/*"),
        ]
          .filter(Boolean)
          .join(" ");

        execSync(createCommand, { stdio: "inherit" });

        // เพิ่ม features ของเราเพิ่มเติม
        if (response.shadcn || response.pwa) {
          spinner.text = "🎨 Adding custom features...";
          try {
            // Check cache first
            const cachedTemplate = await templateManager.getCachedTemplate();
            const tempDir = 'temp-template';

            if (!cachedTemplate) {
              // Clean up any existing temp directory
              execSync(getCleanupCommand(tempDir), getExecOptions());
              
              // Clone with proper error handling
              try {
                execSync(
                  `git clone --depth 1 https://github.com/BA86work/next-starter-shadcn-pwa.git ${tempDir}`,
                  { ...getExecOptions(), stdio: 'pipe' }
                );
              } catch (cloneError: any) {
                throw new Error(`Failed to clone template repository: ${cloneError?.message || 'Unknown error'}`);
              }
            }

            const templateDir = cachedTemplate || tempDir;

            // Read template's package.json
            const packageJsonPath = join(templateDir, 'package.json');
            if (!existsSync(packageJsonPath)) {
              throw new Error('Template package.json not found');
            }

            const templatePackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            
            if (templatePackageJson && templatePackageJson.dependencies) {
              // Get additional dependencies that aren't in the new project
              const additionalDeps = Object.entries(templatePackageJson.dependencies)
                .filter(([name]) => !['react', 'react-dom', 'next'].includes(name))
                .map(([name, version]) => `${name}@${version}`);

              if (additionalDeps.length > 0) {
                // Install additional dependencies
                spinner.text = "📦 Installing template dependencies...";
                execSync(`cd ${response.projectName} && bun add ${additionalDeps.join(' ')}`, getExecOptions());
              }
            } else {
              throw new Error('Invalid package.json structure');
            }

            // Copy required files and directories
            const dirs = ['components', 'app', 'lib', 'styles'];
            for (const dir of dirs) {
              try {
                const sourcePath = join(templateDir, dir);
                const targetPath = join(response.projectName, dir);
                if (existsSync(sourcePath)) {
                  execSync(`${isWindows ? `xcopy /E /I /Y "${sourcePath}" "${targetPath}"` : `cp -r "${sourcePath}" "${targetPath}"`}`, getExecOptions());
                }
              } catch (err) {
                console.warn(`Warning: Could not copy ${dir} directory`);
              }
            }

            // Copy config files
            const configFiles = [
              'tailwind.config.ts',
              'postcss.config.js',
              'next.config.js'
            ];

            for (const file of configFiles) {
              try {
                const sourcePath = join(templateDir, file);
                const targetPath = join(response.projectName, file);
                if (existsSync(sourcePath)) {
                  execSync(`${isWindows ? `copy /Y "${sourcePath}" "${targetPath}"` : `cp "${sourcePath}" "${targetPath}"`}`, getExecOptions());
                }
              } catch (err) {
                console.warn(`Warning: Could not copy ${file}`);
              }
            }

            if (response.pwa) {
              try {
                const publicDir = join(response.projectName, 'public');
                if (!existsSync(publicDir)) {
                  mkdirSync(publicDir, { recursive: true });
                }
                const manifestSource = join(templateDir, 'public', 'manifest.json');
                const manifestTarget = join(publicDir, 'manifest.json');
                if (existsSync(manifestSource)) {
                  execSync(`${isWindows ? `copy /Y "${manifestSource}" "${manifestTarget}"` : `cp "${manifestSource}" "${manifestTarget}"`}`, getExecOptions());
                }
              } catch (err) {
                console.warn('Warning: Could not copy manifest.json');
              }
            }

            // Cache template if it was freshly downloaded
            if (!cachedTemplate) {
              try {
                await templateManager.cacheTemplate(tempDir, templatePackageJson.dependencies);
              } catch (cacheError) {
                console.warn('Failed to cache template:', cacheError);
                // Continue execution even if caching fails
              }
            }

            // Clean up temp directory if we used it
            if (!cachedTemplate) {
              execSync(getCleanupCommand(tempDir), getExecOptions());
            }

          } catch (error) {
            console.error('\nError adding custom features:', error);
            spinner.warn(chalk.yellow('⚠️ Some custom features may not have been added completely.'));
            console.log(chalk.cyan('\nTo add the features manually:'));
            console.log(chalk.cyan('1. Clone https://github.com/BA86work/next-starter-shadcn-pwa'));
            console.log(chalk.cyan('2. Copy the components/ and app/ folders to your project'));
            console.log(chalk.cyan('3. Run: bun add @radix-ui/react-slot sonner class-variance-authority clsx tailwind-merge lucide-react'));
          }
        }

        spinner.succeed(chalk.yellow("✨ Successfully created your app!"));

        console.log(
          boxen(
            chalk.yellow(`Next steps:
1. cd ${response.projectName}
2. bun install
3. bun dev`),
            {
              padding: 1,
              margin: { top: 1, bottom: 1 },
              borderStyle: "round",
              borderColor: "yellow",
              title: "🚀 Get Started",
              titleAlignment: "center",
            }
          )
        );
      } catch (error) {
        spinner.fail(chalk.red("❌ Failed to create app"));
        console.error(error);
        process.exit(1);
      }
    })

  cli.help()
  cli.parse()
}

main().catch(console.error);