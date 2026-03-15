# FlowForge (Next.js 15)

Production-ready project/task management app with queue + kanban.

## Stack
- Next.js 15 App Router + TypeScript
- Tailwind CSS + Radix + shadcn-style UI primitives
- Prisma + PostgreSQL (Supabase/Neon) + Prisma Accelerate compatible
- NextAuth v5 (Credentials + Google)
- dnd-kit, Zustand, date-fns, Zod, lucide-react
- Framer Motion + Sonner

## Folder structure
```
flowforge/
  prisma/
    schema.prisma
    seed.ts
  src/
    app/
      (auth)/{login,signup,forgot-password}
      app/{home,queue,projects,kanban}
      api/{auth/[...nextauth],queue}
    actions/
    components/{ui,layout,auth,projects,tasks,kanban,shared}
    lib/{auth,db,store,validations,utils}
```

## Local setup
```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run db:push
npm run prisma:seed
npm run dev
```

## Exact local commands
```bash
cd /Users/openclaw/.openclaw/workspace/flowforge
cp .env.example .env
# fill DATABASE_URL, DIRECT_URL, AUTH_SECRET, Google keys
npm install
npm run prisma:generate
npm run db:push
npm run prisma:seed
npm run build
npm run dev
```

## Seed credentials
- `owner@flowforge.dev` / `Password123!`
- `alex@flowforge.dev` / `Password123!`
- `rina@flowforge.dev` / `Password123!`

## Supabase / Neon notes
- Create a Postgres database in Supabase or Neon.
- Use pooled URL for `DATABASE_URL`; direct/non-pooled URL for `DIRECT_URL`.
- Keep `sslmode=require`.

## One-click Vercel deploy
1. Push repo to GitHub.
2. Import project in Vercel.
3. Set env vars from `.env.example`.
4. Configure build command: `npm run build`.
5. Deploy.

Optional: add Prisma Postgres/Neon integration + run `prisma migrate deploy` in CI.

## Commands
- `npm run dev` – local
- `npm run build` – production build
- `npm run lint` – lint
- `npm run prisma:generate`
- `npm run db:push`
- `npm run prisma:seed`

## Phase-2 hardening flows

### Queue hardening
- Queue now supports persistent drag reorder with DB `order` writes via server actions.
- Bulk move/assign supports selecting multiple queue tasks and applying project + assignee in one action.
- Queue quick add is validated with `react-hook-form + zod` and writes activity log entries.

### Project/task/column form standardization
- New Project, Project Edit, Task Quick Add, and Column Quick Add now use `react-hook-form + zod`.
- Shared schema files:
  - `src/lib/validations/project.ts`
  - `src/lib/validations/task.ts`

### Password reset flow
- Added Prisma model: `PasswordResetToken` (hashed token, expiry, one-time use).
- Added server actions:
  - `requestPasswordReset(email)`
  - `resetPassword({ token, password, confirmPassword })`
- `/forgot-password` now handles both request and token reset mode (`?token=...`).

### Comments + activity MVP
- Added threaded comment support in project task cards (root + reply rendering).
- Comment actions now parse `@mentions` and store mention metadata in `ActivityLog.meta`.
- Task operations (create/update/reorder/bulk assign/comment) now create richer activity entries.

### Prisma + build verification
```bash
npm run prisma:generate
npm run build
```

## Future extension ideas
- Realtime collaborative task updates (Pusher/Liveblocks)
- Rich text editor for task descriptions
- File uploads to S3/R2 instead of URL attachments
- Advanced @mentions + notifications
- SLA analytics + burndown charts
- AI sprint planning assistant
