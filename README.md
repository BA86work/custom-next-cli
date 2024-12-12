# create-custom-next-cli

CLI tool for creating Next.js projects with custom templates and features like shadcn/ui and PWA support.

## Features

- 🚀 TypeScript/JavaScript support
- 🎨 Tailwind CSS configuration
- 📱 PWA support
- 🎯 shadcn/ui components
- ⚡ Turbopack support
- 🔧 ESLint configuration
- 📁 Customizable project structure

## Installation & Usage

You can use this CLI in several ways:

### Using bun create (Recommended)

```bash
bun create custom-next-cli <project-name>
```

### Using npx

```bash
npx create-custom-next-cli <project-name>
```

### Local development

```bash
# Clone the repository
git clone https://github.com/BA86work/create-custom-next-cli
cd create-custom-next-cli

# Install dependencies
bun install

# Build the project
bun run build

# Run locally
./dist/index.js <project-name>
```

## CLI Options

```bash
create-custom-next-cli [project-name] [options]

Options:
  --next-version <version>      Specify Next.js version
  --tailwind-version <version>  Specify Tailwind CSS version
  --help                       Display help information
```

## Interactive Prompts

The CLI will guide you through the following options:

- Project name
- TypeScript usage
- ESLint configuration
- Tailwind CSS setup
- Source directory structure
- App Router usage
- Turbopack for development
- Import alias customization
- shadcn/ui components integration
- PWA support

This project was created using `bun init` in bun v1.1.33. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
