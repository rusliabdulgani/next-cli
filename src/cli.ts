#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";

const program = new Command();

program
  .name("next-fhi-cli")
  .description(
    "CLI untuk scaffolding Next.js project - Fullerton Health Indonesia"
  )
  .version("1.0.0");

program
  .command("init")
  .description("Inisialisasi project Next.js baru dengan FHI tech stack")
  .argument("[project-name]", "Nama project")
  .action(async (projectName) => {
    try {
      let name = projectName;

      if (!name) {
        const answers = await inquirer.prompt([
          {
            type: "input",
            name: "projectName",
            message: "Nama project (kebab-case):",
            validate: (input) => {
              if (!input) return "Nama project harus diisi!";
              if (!/^[a-z0-9-]+$/.test(input)) {
                return "Nama project harus kebab-case (lowercase dengan dash)!";
              }
              return true;
            },
          },
        ]);
        name = answers.projectName;
      }

      const targetPath = path.join(process.cwd(), name);

      if (fs.existsSync(targetPath)) {
        console.log(chalk.red(`\n❌ Folder ${name} sudah ada!\n`));
        process.exit(1);
      }

      console.log(chalk.blue("\n🚀 Memulai scaffolding project...\n"));

      const spinner = ora("Membuat Next.js app...").start();

      try {
        // Use stdio: 'inherit' for create-next-app to ensure it completes properly
        execSync(
          `pnpm create next-app@latest ${name} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --no-git`,
          { stdio: "inherit", cwd: process.cwd() }
        );

        // Wait a bit for filesystem to sync
        await new Promise((resolve) => setTimeout(resolve, 1000));

        spinner.succeed("Next.js app berhasil dibuat");
      } catch (error: any) {
        spinner.fail("Gagal membuat Next.js app");
        throw error;
      }

      // Verify folder exists before chdir
      if (!fs.existsSync(targetPath)) {
        throw new Error(
          `Folder ${name} tidak ditemukan. Pastikan create-next-app berhasil.`
        );
      }

      process.chdir(targetPath);

      spinner.start("Menginstall dependencies...");

      // Install dependencies in batches to avoid conflicts
      const authDependencies = [
        "next-auth@^4.24.5",
        "bcryptjs",
        "jsonwebtoken",
        "clsx",
        "tailwind-merge",
      ];

      const formDependencies = [
        "react-hook-form",
        "zod",
        "@hookform/resolvers",
      ];

      const stateDependencies = ["zustand"];

      const databaseDependencies = ["@prisma/client@^6.7.0"];

      const devDependencies = [
        "prisma@^6.7.0",
        "@types/bcryptjs",
        "@types/jsonwebtoken",
        "vitest",
        "@vitejs/plugin-react",
        "@playwright/test",
        "husky",
        "lint-staged",
        "prettier",
      ];

      try {
        execSync(`pnpm add ${authDependencies.join(" ")}`, {
          stdio: "inherit",
          cwd: targetPath,
        });
        execSync(`pnpm add ${formDependencies.join(" ")}`, {
          stdio: "inherit",
          cwd: targetPath,
        });
        execSync(`pnpm add ${stateDependencies.join(" ")}`, {
          stdio: "inherit",
          cwd: targetPath,
        });
        execSync(`pnpm add ${databaseDependencies.join(" ")}`, {
          stdio: "inherit",
          cwd: targetPath,
        });
        execSync(`pnpm add -D ${devDependencies.join(" ")}`, {
          stdio: "inherit",
          cwd: targetPath,
        });

        spinner.succeed("Dependencies berhasil diinstall");
      } catch (error: any) {
        spinner.fail("Gagal menginstall dependencies");
        throw error;
      }

      spinner.succeed("Dependencies berhasil diinstall");

      spinner.start("Membuat struktur folder...");
      await createProjectStructure(targetPath);
      spinner.succeed("Struktur folder berhasil dibuat");

      spinner.start("Membuat file konfigurasi...");
      await createConfigFiles(targetPath);
      spinner.succeed("File konfigurasi berhasil dibuat");

      spinner.start("Menginstall shadcn/ui...");
      await setupShadcn(targetPath);
      spinner.succeed("shadcn/ui berhasil diinstall");

      spinner.start("Setup Husky...");
      try {
        execSync("pnpm dlx husky@latest init", {
          stdio: "pipe",
          cwd: targetPath,
        });

        await setupHusky(targetPath);
        spinner.succeed("Husky berhasil di-setup");
      } catch (error: any) {
        spinner.warn(
          "Husky setup warning (silahkan setup manual jika diperlukan)"
        );
      }

      spinner.start("Inisialisasi Prisma...");
      try {
        execSync("pnpm exec prisma init --datasource-provider sqlserver", {
          stdio: "pipe",
          cwd: targetPath,
        });
        await setupPrisma(targetPath);
        spinner.succeed("Prisma berhasil diinisialisasi");
      } catch (error: any) {
        spinner.warn("Prisma init warning (akan di-setup manual)");
        await setupPrisma(targetPath);
      }

      console.log(chalk.green("\n✅ Project berhasil dibuat!\n"));
      console.log(chalk.cyan("Langkah selanjutnya:"));
      console.log(chalk.white(`  cd ${name}`));
      console.log(chalk.white("  cp .env.example .env"));
      console.log(
        chalk.white("  # Edit .env dengan database connection string")
      );
      console.log(chalk.white("  pnpm exec prisma generate"));
      console.log(chalk.white("  pnpm exec prisma migrate dev"));
      console.log(chalk.white("  pnpm run dev\n"));
    } catch (error: any) {
      console.error(chalk.red("\n❌ Error:"), error.message);
      console.log(chalk.yellow("\n💡 Tips troubleshooting:"));
      console.log(chalk.white("  1. Pastikan Node.js >= 18 dan pnpm >= 8"));
      console.log(
        chalk.white("  2. Coba hapus node_modules dan install ulang")
      );
      console.log(
        chalk.white("  3. Cek koneksi internet untuk download dependencies\n")
      );
      process.exit(1);
    }
  });

async function createProjectStructure(basePath: string) {
  const folders = [
    "src/app/api/auth/[...nextauth]",
    "src/components/ui",
    "src/components/forms",
    "src/components/layouts",
    "src/lib/actions",
    "src/lib/api",
    "src/lib/utils",
    "src/lib/validations",
    "src/lib/hooks",
    "src/store",
    "src/types",
    "prisma",
    "public/images",
    "public/icons",
    "__tests__/unit",
    "__tests__/e2e",
  ];

  for (const folder of folders) {
    await fs.ensureDir(path.join(basePath, folder));
  }

  // Create .gitkeep for empty folders
  await fs.writeFile(path.join(basePath, "src/components/forms/.gitkeep"), "");

  await fs.writeFile(
    path.join(basePath, "src/components/layouts/.gitkeep"),
    ""
  );

  // Create utils/check-db.ts (bukan di scripts/, tapi di src/utils/)
  await fs.ensureDir(path.join(basePath, "src/utils"));

  await fs.writeFile(
    path.join(basePath, "src/utils/check-db.ts"),
    `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function checkDbConnection() {
  console.log("🔌 Checking database connection...");

  try {
    await prisma.$queryRaw\`SELECT 1\`;
    console.log("✅ Database connected");
  } catch (error: any) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
}
`
  );
}

async function createConfigFiles(basePath: string) {
  // Vitest config
  const vitestConfig = `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './__tests__/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});`;

  await fs.writeFile(path.join(basePath, "vitest.config.ts"), vitestConfig);

  // Playwright config
  const playwrightConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});`;

  await fs.writeFile(
    path.join(basePath, "playwright.config.ts"),
    playwrightConfig
  );

  // Prettier config
  const prettierConfig = `{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}`;

  await fs.writeFile(path.join(basePath, ".prettierrc"), prettierConfig);

  // Test setup
  const testSetup = `import '@testing-library/jest-dom';`;
  await fs.writeFile(path.join(basePath, "__tests__/setup.ts"), testSetup);

  // Store example (Zustand)
  const storeExample = `import { create } from 'zustand';

interface UserStore {
  user: any | null;
  setUser: (user: any) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));`;

  await fs.ensureDir(path.join(basePath, "src/store"));
  await fs.writeFile(
    path.join(basePath, "src/store/user-store.ts"),
    storeExample
  );

  // Utils
  const utilsFile = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;

  await fs.ensureDir(path.join(basePath, "src/lib/utils"));
  await fs.writeFile(path.join(basePath, "src/lib/utils/cn.ts"), utilsFile);

  // Validation example
  const validationExample = `import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export type LoginInput = z.infer<typeof loginSchema>;`;

  await fs.ensureDir(path.join(basePath, "src/lib/validations"));
  await fs.writeFile(
    path.join(basePath, "src/lib/validations/auth.ts"),
    validationExample
  );

  // NextAuth config
  const authConfig = `import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // TODO: Implement authentication logic
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };`;

  await fs.ensureDir(path.join(basePath, "src/app/api/auth/[...nextauth]"));
  await fs.writeFile(
    path.join(basePath, "src/app/api/auth/[...nextauth]/route.ts"),
    authConfig
  );

  // Update package.json scripts
  const pkgPath = path.join(basePath, "package.json");
  const pkg = await fs.readJSON(pkgPath);

  pkg.scripts = {
    ...pkg.scripts,
    test: "vitest",
    checkdb: "ts-node src/utils/check-db.ts",
    dev: "pnpm run checkdb && next dev",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint:fix": "eslint . --fix",
    format: "prettier --write .",
    prepare: "husky",
  };

  await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
}

async function setupShadcn(basePath: string) {
  const componentsJson = {
    $schema: "https://ui.shadcn.com/schema.json",
    style: "default",
    rsc: true,
    tsx: true,
    tailwind: {
      config: "tailwind.config.ts",
      css: "src/app/globals.css",
      baseColor: "slate",
      cssVariables: true,
      prefix: "",
    },
    aliases: {
      components: "@/components",
      utils: "@/lib/utils",
      ui: "@/components/ui",
    },
  };

  await fs.writeJSON(path.join(basePath, "components.json"), componentsJson, {
    spaces: 2,
  });

  try {
    execSync("pnpm dlx shadcn@latest add button input label --yes", {
      stdio: "pipe",
      cwd: basePath,
    });
  } catch (error) {
    console.log(chalk.yellow("  ⚠️  shadcn components akan diinstall manual"));
  }
}

async function setupHusky(basePath: string) {
  const preCommit = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec lint-staged`;

  await fs.writeFile(path.join(basePath, ".husky/pre-commit"), preCommit);
  await fs.chmod(path.join(basePath, ".husky/pre-commit"), "755");

  const pkgPath = path.join(basePath, "package.json");
  const pkg = await fs.readJSON(pkgPath);

  pkg["lint-staged"] = {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"],
  };

  await fs.writeJSON(pkgPath, pkg, { spaces: 2 });

  const namingConventionScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const stagedFiles = process.argv.slice(2);

// Pattern untuk kebab-case
const kebabCase = /^[a-z0-9-]+$/;
// Pattern untuk PascalCase
const pascalCase = /^[A-Z][a-zA-Z0-9]*$/;

let hasError = false;

const isComponentFile = (filename) => {
  return filename.endsWith('.tsx') || filename.endsWith('.jsx');
};

const validateFileName = (filename, filePath, isComponent) => {
  const nameWithoutExt = filename.split('.')[0];
  
  // Special files yang boleh dilewati
  const specialFiles = ['route', 'layout', 'page', 'loading', 'error', 'not-found', 'default', 'template'];
  if (specialFiles.includes(nameWithoutExt)) {
    return true;
  }

  if (isComponent) {
    // Component files harus PascalCase
    if (!pascalCase.test(nameWithoutExt)) {
      console.error(\`❌ Error: Component "\${filePath}" harus menggunakan PascalCase!\`);
      console.error(\`   Contoh yang benar: UserProfile.tsx, LoginForm.tsx, ButtonPrimary.tsx\`);
      return false;
    }
  } else {
    // Non-component files harus kebab-case
    if (!kebabCase.test(nameWithoutExt)) {
      console.error(\`❌ Error: File "\${filePath}" harus menggunakan kebab-case!\`);
      console.error(\`   Contoh yang benar: user-service.ts, auth-utils.ts, api-config.ts\`);
      return false;
    }
  }
  
  return true;
};

const validateFolderName = (folderName, folderPath) => {
  // Folder dengan awalan underscore atau dalam kurung siku (Next.js convention) boleh dilewati
  if (folderName.startsWith('_') || folderName.startsWith('[') || folderName.startsWith('(')) {
    return true;
  }

  // Special folders Next.js
  const specialFolders = ['api', 'ui', 'app', 'lib', 'components', 'utils', 'actions', 'hooks', 'validations', 'store', 'types', 'forms', 'layouts'];
  if (specialFolders.includes(folderName)) {
    return true;
  }

  if (!kebabCase.test(folderName)) {
    console.error(\`❌ Error: Folder "\${folderPath}" harus menggunakan kebab-case!\`);
    console.error(\`   Contoh yang benar: user-profile/, auth-forms/, admin-dashboard/\`);
    return false;
  }

  return true;
};

stagedFiles.forEach(file => {
  const relativePath = path.relative(process.cwd(), file);
  
  // Skip node_modules, .next, dist, dll
  if (relativePath.includes('node_modules') || 
      relativePath.includes('.next') || 
      relativePath.includes('dist') ||
      relativePath.includes('.git')) {
    return;
  }

  // Hanya validasi file di src/
  if (!relativePath.startsWith('src/')) {
    return;
  }

  const parts = relativePath.split(path.sep);
  const filename = parts[parts.length - 1];
  
  // Validasi nama file
  const isComponent = isComponentFile(filename);
  if (!validateFileName(filename, relativePath, isComponent)) {
    hasError = true;
  }

  // Validasi nama folder (skip src dan file itu sendiri)
  for (let i = 1; i < parts.length - 1; i++) {
    const folderName = parts[i];
    const folderPath = parts.slice(0, i + 1).join('/');
    
    if (!validateFolderName(folderName, folderPath)) {
      hasError = true;
    }
  }
});

if (hasError) {
  console.error('\\n❌ Commit dibatalkan! Perbaiki naming convention terlebih dahulu.\\n');
  console.error('📋 Aturan naming convention:');
  console.error('   - React Components (.tsx/.jsx): PascalCase (contoh: UserProfile.tsx)');
  console.error('   - File lainnya: kebab-case (contoh: user-service.ts)');
  console.error('   - Folder: kebab-case (contoh: user-profile/)');
  console.error('   - Next.js files: route.ts, layout.tsx, page.tsx, loading.tsx, error.tsx\\n');
  process.exit(1);
}

console.log('✅ Naming convention valid!');`;

  await fs.writeFile(
    path.join(basePath, ".husky/validate-naming.js"),
    namingConventionScript
  );

  const updatedPreCommit = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

node .husky/validate-naming.js $(git diff --cached --name-only --diff-filter=ACM)
pnpm exec lint-staged`;

  await fs.writeFile(
    path.join(basePath, ".husky/pre-commit"),
    updatedPreCommit
  );
}

async function setupPrisma(basePath: string) {
  const schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`;

  await fs.writeFile(path.join(basePath, "prisma/schema.prisma"), schema);

  const dbConfig = `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;`;

  await fs.writeFile(path.join(basePath, "src/lib/db.ts"), dbConfig);

  const envExample = `# Database Connection String untuk MSSQL
# Format: sqlserver://HOST:PORT;database=DATABASE;user=USERNAME;password=PASSWORD;encrypt=true;trustServerCertificate=true
DATABASE_URL="sqlserver://localhost:1433;database=mydb;user=sa;password=YourPassword123;encrypt=true;trustServerCertificate=true"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl-rand-base64-32"`;

  await fs.writeFile(path.join(basePath, ".env.example"), envExample);
}

program.parse();
