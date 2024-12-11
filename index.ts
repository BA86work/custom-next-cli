#!/usr/bin/env node
import { program } from "commander";
import prompts from "prompts";
import degit from "degit";
import ora from "ora";
import chalk from "chalk";
import boxen from "boxen";
// import gradient from "gradient-string";
import { execSync } from "child_process";

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

  // CLI options
  program
    .option("-t, --template <n>", "template name")
    .option("-v, --version <version>", "Next.js version")
    .parse(process.argv);

  const options = program.opts<CliOptions>();

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
      options.version ? `--version=${options.version}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    execSync(createCommand, { stdio: "inherit" });

    // เพิ่ม features ของเราเพิ่มเติม
    if (response.shadcn || response.pwa) {
      spinner.text = "🎨 Adding custom features...";
      const emitter = degit("BA86work/next-starter-shadcn-pwa", {
        force: true,
        verbose: true,
      });

      await emitter.clone(response.projectName, {
        files: [
          response.shadcn ? "components/**" : null,
          response.pwa ? "public/manifest.json" : null,
          "app/**",
          "styles/**",
        ].filter(Boolean),
      });
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
}

main().catch(console.error);
