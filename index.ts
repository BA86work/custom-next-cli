#!/usr/bin/env node
import prompts from "prompts";
import ora from "ora";
import chalk from "chalk";
import boxen from "boxen";
// import gradient from "gradient-string";
import { execSync } from "child_process";
import type { ExecSyncOptions } from "child_process";
import cac from 'cac'
import type { PromptObject } from 'prompts';

interface CliOptions {
  template?: string;
  nextVersion?: string;
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

interface DependencyVersions {
  nextVersion?: string;
  tailwindVersion?: string;
  typescriptVersion?: string;
}

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

function getOSSpecificCommand(commands: {
  windows: string;
  mac?: string;
  linux?: string;
  unix: string;
}): string {
  if (isWindows) return commands.windows;
  if (isMac) return commands.mac || commands.unix;
  if (isLinux) return commands.linux || commands.unix;
  return commands.unix;
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
    .option('--next-version <version>', 'Specify Next.js version')
    .option('--tailwind-version <version>', 'Specify Tailwind CSS version')
    .option('--typescript-version <version>', 'Specify TypeScript version')
    .action(async (target, options: DependencyVersions) => {
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
          "--import-alias=" + (response.customAlias ? response.alias || "@/*" : "@/*"),
        ]
          .filter(Boolean)
          .join(" ");

        try {
          const result = execSync(createCommand, { 
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: 300000,
            killSignal: "SIGTERM",
            encoding: 'utf8'
          });

          if (result) {
            console.log(result);
          }

          spinner.succeed("Next.js application initialized");
          
          await new Promise(resolve => setTimeout(resolve, 1000));

          console.log(chalk.yellow("\n📦 Configuring versions...\n"));
          const versionPrompts: PromptObject[] = [
            {
              type: 'text' as const,
              name: 'nextVersion',
              message: `Specify ${chalk.yellow("Next.js")} version (press Enter for latest):`,
              initial: options.nextVersion || ''
            },
            {
              type: 'text' as const,
              name: 'tailwindVersion',
              message: `Specify ${chalk.yellow("Tailwind CSS")} version (press Enter for latest):`,
              initial: options.tailwindVersion || ''
            }
          ];

          const versionResponse = await prompts(versionPrompts);

          // แก้ไขส่วนการ copy files และ directories
          const copyDirectory = async (source: string, destination: string) => {
            try {
              const command = getOSSpecificCommand({
                windows: `xcopy /E /I /Y "${source}" "${destination}"`,
                mac: `cp -R "${source}/" "${destination}"`,
                linux: `cp --recursive "${source}/." "${destination}"`,
                unix: `cp -R "${source}/." "${destination}"`
              });
              
              await execSync(command, {
                stdio: 'inherit',
                shell: isWindows ? 'cmd.exe' : undefined,
                env: {
                  ...process.env,
                  FORCE_COLOR: '1',
                }
              });
            } catch (error) {
              if (isWindows && (error as Error).message.includes('Access is denied')) {
                throw new Error('Access denied. Try running as administrator');
              } else if (isLinux && (error as Error).message.includes('Permission denied')) {
                throw new Error('Permission denied. Try using sudo');
              } 
              throw new Error(`Failed to copy directory: ${(error as Error).message}`);
            }
          };

          // แก้ไขส่วนการล directory
          const removeDirectory = async (dir: string) => {
            try {
              const command = getOSSpecificCommand({
                windows: `if exist "${dir}" rmdir /S /Q "${dir}"`,
                unix: `rm -rf "${dir}"`
              });
              
              await execSync(command, {
                stdio: 'inherit',
                shell: isWindows ? 'cmd.exe' : undefined
              });
            } catch (error) {
              throw new Error(`Failed to remove directory ${dir}: ${error}`);
            }
          };

          // ปรับปรุงส่วนการติดตั้ง dependencies
          const installDependencies = async (projectPath: string, deps: string[]) => {
            try {
              const command = `cd "${projectPath}" && bun add ${deps.join(' ')}`;
              await execSync(command, {
                stdio: 'inherit',
                shell: isWindows ? 'cmd.exe' : undefined
              });
            } catch (error) {
              throw new Error(`Failed to install dependencies: ${error}`);
            }
          };

          // แก้ไขส่วนการ handle errors
          try {
            // หลังจากสร้าง project แล้ว ถ้ามีการระบุ version
            if (versionResponse.nextVersion) {
              spinner.text = `📦 Installing Next.js version ${versionResponse.nextVersion}...`;
              await installDependencies(response.projectName, [`next@${versionResponse.nextVersion}`]);
            }

            if (response.tailwind && versionResponse.tailwindVersion) {
              spinner.text = `📦 Installing Tailwind CSS version ${versionResponse.tailwindVersion}...`;
              await installDependencies(response.projectName, [`tailwindcss@${versionResponse.tailwindVersion}`]);
            }

            // เพิ่ม features ของเราเพิ่มเติม
            if (response.shadcn || response.pwa) {
              spinner.text = "🎨 Adding custom features...";
              try {
                const tempDir = 'temp-template';
                const execOptions: ExecSyncOptions = {
                  stdio: 'inherit',
                  shell: process.platform === 'win32' ? 'cmd.exe' : undefined
                };

                // Clean up existing temp directory if it exists
                const cleanupCommand = process.platform === 'win32' 
                  ? `if exist ${tempDir} rmdir /S /Q ${tempDir}`
                  : `rm -rf ${tempDir}`;

                execSync(cleanupCommand, execOptions);
                
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
                      await copyDirectory(`${tempDir}/${dir}`, `${response.projectName}/${dir}`);
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
                await removeDirectory(tempDir);

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
        } catch (error) {
          spinner.fail(chalk.red(`❌ Error: ${(error as Error).message || 'Unknown error occurred'}`));
          
          // แสดงคำแนะนำการแก้ไขปัญหาตาม OS
          console.log(chalk.yellow('\nTroubleshooting tips:'));
          if (isWindows) {
            console.log('- Make sure you have administrator privileges');
            console.log('- Check if Windows Defender or antivirus is blocking the operations');
          } else {
            console.log('- Check if you have proper permissions (try using sudo)');
            console.log('- Make sure all required dependencies are installed');
          }
          
          process.exit(1);
        }
      } catch (error) {
        spinner.fail(chalk.red(`❌ Error: ${(error as Error).message || 'Unknown error occurred'}`));
        
        // แสดงคำแนะนำการแก้ไขปัญหาตาม OS
        console.log(chalk.yellow('\nTroubleshooting tips:'));
        if (isWindows) {
          console.log('- Make sure you have administrator privileges');
          console.log('- Check if Windows Defender or antivirus is blocking the operations');
        } else {
          console.log('- Check if you have proper permissions (try using sudo)');
          console.log('- Make sure all required dependencies are installed');
        }
        
        process.exit(1);
      }
    })

  cli.help()
  cli.parse()
}

main().catch(console.error);
