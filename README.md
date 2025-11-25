# Next FHI CLI

CLI tool untuk scaffolding Next.js project dengan tech stack standar Fullerton Health Indonesia.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js
- **Form Management**: React Hook Form + Zod
- **State Management**: Zustand
- **UI Framework**: shadcn/ui
- **Styling**: Tailwind CSS
- **ORM**: Prisma
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged

## 📦 Installation

```bash
pnpm add -g @fhi-itdev/next-fhi-cli
```

Atau install dari source:

```bash
git clone <repository-url>
cd next-fhi-cli
pnpm install
pnpm run build
pnpm link --global
```

## 🎯 Usage

### Membuat Project Baru

```bash
next-fhi init my-project
```

Atau tanpa argumen (akan menanyakan nama project):

```bash
next-fhi init
```

### Struktur Project yang Dihasilkan

```
my-project/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── forms/           # Form components
│   │   └── layouts/         # Layout components
│   ├── lib/
│   │   ├── actions/         # Server actions
│   │   ├── api/             # API utilities
│   │   ├── utils/           # Utility functions
│   │   ├── validations/     # Zod schemas
│   │   ├── hooks/           # Custom hooks
│   │   └── db.ts            # Prisma client
│   ├── store/               # Zustand stores
│   │   └── user-store.ts
│   └── types/               # TypeScript types
├── prisma/
│   └── schema.prisma
├── __tests__/
│   ├── unit/
│   ├── e2e/
│   └── setup.ts
├── public/
│   ├── images/
│   └── icons/
├── .husky/
│   ├── pre-commit
│   └── validate-naming.js
├── components.json
├── vitest.config.ts
├── playwright.config.ts
├── .prettierrc
└── package.json
```

## 🔒 Naming Convention Enforcement

Project ini menggunakan Husky untuk memvalidasi naming convention secara otomatis:

### Aturan Naming:

| Tipe | Convention | Contoh Benar | Contoh Salah |
|------|-----------|--------------|--------------|
| **React Components** (.tsx/.jsx) | PascalCase | `UserProfile.tsx`<br>`LoginForm.tsx`<br>`ButtonPrimary.tsx` | `userProfile.tsx`<br>`login-form.tsx` |
| **Non-Component Files** | kebab-case | `user-service.ts`<br>`auth-utils.ts`<br>`api-config.ts` | `userService.ts`<br>`AuthUtils.ts` |
| **Folders** | kebab-case | `user-profile/`<br>`auth-forms/`<br>`admin-dashboard/` | `UserProfile/`<br>`authForms/` |
| **Next.js Special Files** | lowercase | `page.tsx`<br>`layout.tsx`<br>`route.ts`<br>`loading.tsx` | - |

### Cara Kerja:

Git commit akan **otomatis dibatalkan** jika ada pelanggaran naming convention. Anda akan melihat error message yang jelas tentang file mana yang bermasalah.

**Contoh Error Message:**
```
❌ Error: Component "src/components/userProfile.tsx" harus menggunakan PascalCase!
   Contoh yang benar: UserProfile.tsx, LoginForm.tsx, ButtonPrimary.tsx

❌ Error: File "src/lib/authService.ts" harus menggunakan kebab-case!
   Contoh yang benar: auth-service.ts, user-utils.ts

❌ Commit dibatalkan! Perbaiki naming convention terlebih dahulu.
```

## 📝 Available Scripts

Setelah project dibuat, Anda bisa menjalankan:

```bash
# Development
pnpm run dev

# Build
pnpm run build

# Testing
pnpm run test              # Run unit tests
pnpm run test:ui           # Run unit tests with UI
pnpm run test:e2e          # Run e2e tests
pnpm run test:e2e:ui       # Run e2e tests with UI

# Linting & Formatting
pnpm run lint
pnpm run lint:fix
pnpm run format

# Database
pnpm exec prisma generate
pnpm exec prisma migrate dev
pnpm exec prisma studio
```

## ⚙️ Setup Awal

1. Copy `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update environment variables di `.env`:
   ```env
   # MSSQL Connection String
   DATABASE_URL="sqlserver://localhost:1433;database=mydb;user=sa;password=YourPassword123;encrypt=true;trustServerCertificate=true"
   
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"
   ```

   **Format Connection String MSSQL:**
   ```
   sqlserver://HOST:PORT;database=DB_NAME;user=USERNAME;password=PASSWORD;encrypt=true;trustServerCertificate=true
   ```

   **Contoh untuk berbagai environment:**
   
   **Local Development:**
   ```env
   DATABASE_URL="sqlserver://localhost:1433;database=myapp_dev;user=sa;password=DevPassword123;encrypt=true;trustServerCertificate=true"
   ```

   **Azure SQL Database:**
   ```env
   DATABASE_URL="sqlserver://myserver.database.windows.net:1433;database=myapp_prod;user=myadmin@myserver;password=ProdPassword123;encrypt=true"
   ```

   **Named Instance:**
   ```env
   DATABASE_URL="sqlserver://localhost\\SQLEXPRESS:1433;database=mydb;user=sa;password=Password123;encrypt=true;trustServerCertificate=true"
   ```

3. Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

4. Generate Prisma client:
   ```bash
   pnpm exec prisma generate
   ```

5. Run migrations:
   ```bash
   pnpm exec prisma migrate dev
   ```

6. Start development server:
   ```bash
   pnpm run dev
   ```

## 🎨 shadcn/ui Components

Project sudah include shadcn/ui. Untuk menambah component baru:

```bash
pnpm dlx shadcn@latest add [component-name]
```

Contoh:
```bash
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add form
```

## 📚 Example Usage

### Form dengan React Hook Form + Zod

```typescript
// src/lib/validations/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

```typescript
// src/components/forms/login-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

### State Management dengan Zustand

```typescript
// src/store/user-store.ts
import { create } from 'zustand';

interface UserStore {
  user: any | null;
  setUser: (user: any) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
```

```typescript
// Usage in component
'use client';

import { useUserStore } from '@/store/user-store';

export function UserProfile() {
  const { user, setUser } = useUserStore();
  
  return <div>{user?.name}</div>;
}
```

## 🛠️ Development

Untuk development CLI ini:

```bash
# Clone repository
git clone <repository-url>
cd next-fhi-cli

# Install dependencies
pnpm install

# Build
pnpm run build

# Link globally untuk testing
pnpm link --global

# Test CLI
next-fhi init test-project
```

## 📄 License

MIT

## 👥 Author

Fullerton Health Indonesia