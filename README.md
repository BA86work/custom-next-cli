# create-custom-next-cli

CLI tool for creating Next.js projects with custom templates.

## Installation

```bash
# Local development
git clone <repository>
cd create-custom-next-cli
bun install
bun run build

# Global installation
npm install -g .

# Or use directly with npx
npx create-custom-next-cli
```

## Usage

```bash
create-custom-next-cli [options]

Options:
  -v, --version <version>  Specify Next.js version
  -t, --template <name>    Specify template name
  -h, --help              Display help
```

This project was created using `bun init` in bun v1.1.33. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
