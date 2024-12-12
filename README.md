# create-custom-next-cli

🚀 The ultimate CLI tool for creating Next.js projects with powerful features and flexibility! Create production-ready Next.js applications with shadcn/ui, PWA support, and more - all preconfigured and ready to go.

## ✨ Key Features

- 🎯 **Flexible Next.js Version Control**
  - Choose any Next.js version (e.g., `13.4.0`, `14.0.0`)
  - Default to latest version for cutting-edge features
  - Automatic version validation against official releases

- 🎨 **Rich UI & Development Features**
  - shadcn/ui components pre-configured
  - PWA support with offline capabilities
  - Tailwind CSS with best practices
  - TypeScript/JavaScript support
  - ESLint configuration
  - Turbopack support for faster development
  - Customizable import aliases

- ⚡ **Smart Template Management**
  - Auto-updates with template changes
  - Resilient to component additions/removals
  - Dependency validation and management
  - Intelligent caching system

- 💪 **Cross-Platform Support**
  - Windows
  - macOS
  - Linux

## 🚀 Quick Start

### Using bun (Recommended)

```bash
bun create custom-next-cli my-app
```

### Using npx

```bash
npx create-custom-next-cli my-app
```

## 🎯 Interactive Features

All features can be toggled with Yes/No options during project creation:

```bash
? Project name: my-app
? Use TypeScript? › Yes/No
? Use ESLint? › Yes/No
? Use Tailwind CSS? › Yes/No
? Use src/ directory? › Yes/No
? Use App Router? › Yes/No
? Use Turbopack? › Yes/No
? Customize import alias? › Yes/No
? Include shadcn/ui? › Yes/No
? Add PWA support? › Yes/No
```

## 🔧 Version Control

### Next.js Version Selection

- Use `latest` for the newest version (default)
- Specify exact version: `13.4.0`, `14.0.0`, etc.
- Automatic validation against official Next.js releases

Example:

```bash
? Which Next.js version would you like to use? › latest
# or
? Which Next.js version would you like to use? › 13.4.0
```

## 📦 Template & Dependencies

### Template Updates

- CLI automatically handles template repository changes
- New components are seamlessly integrated
- Removed components won't affect CLI functionality
- Zero maintenance required for template updates

### Dependency Management

- Dependencies are automatically installed based on selections
- When selecting "No" for a feature:
  - Related dependencies are not installed
  - Associated components are not copied
  - Configuration files are not added
  - Zero impact on project size

### Runtime & Version Management

- Uses npm for version validation
- Supports Node.js >=14.0.0
- Automatic dependency version validation
- Smart caching for faster project creation

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/BA86work/create-custom-next-cli
cd create-custom-next-cli

# Install dependencies
bun install

# Build the project
bun run build

# Run locally
./dist/index.js my-app
```

## 💡 Additional Information

- **Template Updates**: The CLI automatically handles any changes in the template repository, including new or removed components, ensuring your project always gets the latest features without breaking.

- **Version Management**: If no version is specified, the CLI always uses the latest Next.js version, staying in sync with official releases.

- **Dependencies**: New dependencies in the template are automatically handled. For custom dependency toggles (like axios), the template repository needs to be updated.

## 📝 License

MIT License - feel free to use in your projects!

---

Made with ❤️ by BA86work. Star ⭐ this repository if you find it helpful!
