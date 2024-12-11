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

async function main() {
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
      ])) as UserChoices;

      console.log(chalk.yellow("\n📦 Setting up your project...\n"));

      const spinner = ora({
        text: "Creating your app...",
        color: "yellow",
        spinner: "dots",
      }).start();

      try {
        // สร้าง Next.js app พื้นฐานด้วย bun create next-app
        spinner.text = "🚀 Initializing Next.js application...";
        const createCommand = [
          "bun create next-app",
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
            const tempDir = 'temp-template';
            const execOptions: ExecSyncOptions = {
              stdio: 'inherit',
              shell: 'cmd.exe'
            };

            // Clean up existing temp directory if it exists
            execSync(`if exist ${tempDir} rmdir /S /Q ${tempDir}`, execOptions);
            
            // Clone the repository
            execSync(`git clone --depth 1 https://github.com/BA86work/next-starter-shadcn-pwa.git ${tempDir}`, execOptions);

            if (response.shadcn) {
              try {
                // Read template's package.json to get dependencies
                const packageJsonContent = execSync(`type "${tempDir}\\package.json"`, { 
                  ...execOptions, 
                  encoding: 'utf-8',
                  stdio: ['pipe', 'pipe', 'pipe']
                });

                const templatePackageJson = JSON.parse(packageJsonContent.toString());
                
                if (templatePackageJson && templatePackageJson.dependencies) {
                  // Get additional dependencies that aren't in the new project
                  const additionalDeps = Object.keys(templatePackageJson.dependencies)
                    .filter(dep => !['react', 'react-dom', 'next'].includes(dep));

                  if (additionalDeps.length > 0) {
                    // Install additional dependencies
                    spinner.text = "📦 Installing additional dependencies...";
                    execSync(`cd ${response.projectName} && bun add ${additionalDeps.join(' ')}`, execOptions);
                  }
                } else {
                  throw new Error('Invalid package.json structure');
                }
              } catch (err) {
                console.warn('Warning: Could not read template dependencies, installing defaults...');
                execSync(`cd ${response.projectName} && bun add @radix-ui/react-slot sonner class-variance-authority clsx tailwind-merge lucide-react`, execOptions);
              }

              // Copy required files and directories
              const dirs = ['components', 'app', 'lib', 'styles'];
              for (const dir of dirs) {
                try {
                  execSync(`if exist "${tempDir}\\${dir}" (xcopy /E /I /Y "${tempDir}\\${dir}" "${response.projectName}\\${dir}")`, execOptions);
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
                  execSync(`if exist "${tempDir}\\${file}" (copy /Y "${tempDir}\\${file}" "${response.projectName}\\${file}")`, execOptions);
                } catch (err) {
                  console.warn(`Warning: Could not copy ${file}`);
                }
              }
            }
            
            if (response.pwa) {
              try {
                execSync(`if not exist "${response.projectName}\\public" mkdir "${response.projectName}\\public"`, execOptions);
                execSync(`if exist "${tempDir}\\public\\manifest.json" (copy /Y "${tempDir}\\public\\manifest.json" "${response.projectName}\\public\\")`, execOptions);
              } catch (err) {
                console.warn('Warning: Could not copy manifest.json');
              }
            }

            // Cleanup temp directory
            execSync(`if exist ${tempDir} rmdir /S /Q ${tempDir}`, execOptions);

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
