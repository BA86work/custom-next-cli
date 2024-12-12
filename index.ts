#!/usr/bin/env node
import prompts from "prompts";
import ora from "ora";
import chalk from "chalk";
import boxen from "boxen";
import { execSync } from "child_process";
import type { ExecSyncOptions } from "child_process";
import cac from 'cac'
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { TemplateManager } from './src/templateManager';

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
              
              // Clone with progress
              spinner.text = "📥 Cloning template repository...";
              try {
                const cloneProcess = execSync(
                  `git clone --depth 1 --progress https://github.com/BA86work/next-starter-shadcn-pwa.git ${tempDir}`,
                  { 
                    ...getExecOptions(), 
                    stdio: ['pipe', 'pipe', 'pipe'],
                    encoding: 'utf8'
                  }
                );
                
                spinner.succeed("✅ Template cloned successfully");
              } catch (cloneError: any) {
                spinner.fail("❌ Failed to clone template");
                throw new Error(`Failed to clone template repository: ${cloneError?.message || 'Unknown error'}`);
              }
            }

            const templateDir = cachedTemplate || tempDir;

            // Read and validate template's package.json
            const packageJsonPath = join(templateDir, 'package.json');
            if (!existsSync(packageJsonPath)) {
              throw new Error('Template package.json not found');
            }

            let templatePackageJson;
            try {
              templatePackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            } catch (parseError: any) {
              throw new Error(`Failed to parse template package.json: ${parseError?.message || 'Unknown error'}`);
            }

            if (!templatePackageJson || !templatePackageJson.dependencies) {
              throw new Error('Invalid template package.json structure');
            }

            // Validate dependencies before installation
            spinner.text = "🔍 Validating dependencies...";
            const validationResult = await templateManager.validateDependencies(templatePackageJson.dependencies);
            if (!validationResult.isValid) {
              spinner.fail("❌ Dependency validation failed");
              console.error("Invalid dependencies found:");
              validationResult.errors.forEach((error: string) => console.error(`- ${error}`));
              throw new Error('Dependency validation failed');
            }
            spinner.succeed("✅ Dependencies validated");

            // Install dependencies
            if (Object.keys(templatePackageJson.dependencies).length > 0) {
              spinner.text = "📦 Installing template dependencies...";
              try {
                execSync(`cd ${response.projectName} && bun add ${Object.entries(templatePackageJson.dependencies)
                  .filter(([name]) => !['react', 'react-dom', 'next'].includes(name))
                  .map(([name, version]) => `${name}@${version}`)
                  .join(' ')}`, 
                  getExecOptions()
                );
                spinner.succeed("✅ Dependencies installed");
              } catch (installError: any) {
                spinner.fail("❌ Failed to install dependencies");
                throw new Error(`Failed to install dependencies: ${installError?.message || 'Unknown error'}`);
              }
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

                // Copy ทั้ง directory แทนที่จะ copy แค่ manifest.json
                const publicSource = join(templateDir, 'public');
                if (existsSync(publicSource)) {
                  execSync(
                    `${isWindows 
                      ? `xcopy /E /I /Y "${publicSource}" "${publicDir}"`
                      : `cp -r "${publicSource}/." "${publicDir}"`}`,
                    getExecOptions()
                  );
                }
              } catch (err) {
                console.warn('Warning: Could not copy public directory');
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