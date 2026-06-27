
## Goal

Replace the Fluxa AI chat product with **an AI app/web builder** — the user describes an app, the AI generates a single-page React/HTML app, and it renders live in an iframe next to the chat (Lovable-style split view). Reference: the uploaded `ideaship-main` (a Next.js Lovable/v0 clone using an in-browser VFS + esbuild + AI SDK).

We cannot port `ideaship` 1:1 — it's Next.js + Prisma + S3 + NextAuth + in-browser esbuild bundler. Our stack is React + Vite + Supabase (Lovable Cloud). I'll adapt its **ideas** (system prompt style, VFS, iframe preview, file actions) to our stack.

## Scope (v1 — achievable)

### Remove (Fluxa AI surface)
- Pages: `Chat.tsx`, `Tools.tsx`, `ToolPage.tsx`, `Store.tsx`, `History.tsx`, `PublishedSite.tsx`, `StaffPanel.tsx`, all `admin/*`
- Components: `CodeBlock.tsx`, `AnnouncementBanner.tsx`, `FluxaWordmark.tsx`, `DiscordButton.tsx`
- Hooks: `useCredits.ts`, `useCustomTools.ts`, `useAdminData.ts`, `useAdminStore.ts`, `useAccessRoles.ts`
- Lib: `tools.ts`, `adminStore.ts`
- Edge functions: `tool-run`, `publish-site`, `admin-ai`, `admin-tool-creator` (keep `chat`, repurpose)
- DB tables for credits/tools/admin (leave for now — non-blocking; no UI references)

### Build (new builder surface)

**Pages**
- `/` — new Landing: hero "Build apps by chatting", prompt box that creates a project
- `/build/:projectId` — Builder workspace (split-pane: chat left, preview right, file tree toggle)
- Keep: `SignIn`, `SignUp`, `ForgotPassword`, `ResetPassword`, `Settings`

**Builder workspace components**
- `ChatPanel` — message list + composer (uses AI SDK `useChat`)
- `PreviewPane` — iframe sandbox rendering generated files via blob URL + import-map (no esbuild; React via esm.sh)
- `FileExplorer` — collapsible tree of generated files
- `CodeViewer` — read-only Monaco-lite (use existing shadcn + simple `<pre>` with syntax highlight via `highlight.js`)
- `VersionsList` — list of snapshots (each AI turn = a snapshot in DB)

**Edge function** `chat` (rewrite)
- Streams AI SDK `streamText` with a Lovable-builder system prompt
- Returns assistant text that contains `<file path="...">...</file>` action blocks
- Client parses blocks, writes them to the virtual file system (in-memory + persisted to DB)
- Model: `google/gemini-2.5-pro` for code gen quality

**Preview engine (no in-browser bundler)**
- Generate a single `index.html` + ES module `App.jsx` style. We use a fixed iframe template that loads React/ReactDOM/Babel-standalone via CDN (`esm.sh`), then mounts user-generated `App.tsx` transformed by `@babel/standalone` in the iframe.
- All generated files are passed in via `postMessage` to the iframe shell.
- This keeps the bundler simple (Babel runs inside the iframe) and matches ideaship's "esbuild on the fly" idea without server work.

**Database (Lovable Cloud / Supabase)** — new tables
- `builder_projects` (id, user_id, title, created_at, updated_at)
- `builder_files` (id, project_id, path, content, updated_at) — full latest snapshot
- `builder_messages` (id, project_id, role, content, created_at)
- `builder_snapshots` (id, project_id, message_id, files_json, created_at) — for "restore version"
- RLS: owner-only, with GRANTs

### Out of scope (v1, can iterate)
- Real deployment of generated apps (no `/api/deploy`)
- Image upload to S3 (use base64 in messages)
- Multi-framework — only React + Tailwind generated apps
- Element-picker inline editor (ideaship's `EditingPanel`) — show "coming soon"
- Stripe / credits / forks / templates

## Technical notes

**Iframe preview shell** (`public/preview-shell.html`)
- Loads React, ReactDOM, Tailwind Play CDN, Babel-standalone, react-router-dom from esm.sh
- Listens for `postMessage({type:'files', files: {...}})`
- Concatenates files, transforms with Babel (`presets: ['react','typescript']`), wraps in a module, mounts.

**System prompt** (adapted from ideaship)
- "You are Lovable-style builder. Output ONLY `<lovFile path="...">...</lovFile>` blocks plus brief commentary. Always React + TS + Tailwind + shadcn-style. Use react-router-dom MemoryRouter. Entry file: `src/App.tsx`."

**File parser**
- Regex `/<lovFile path="([^"]+)">([\s\S]*?)<\/lovFile>/g` parses streamed assistant chunks; flushes finished files to VFS in real time.

**Routing change in `App.tsx`**
- `/` → new Landing
- `/build/:id` → Builder
- Drop all `/chat`, `/tools`, `/store`, `/admin`, `/staff` routes

## File map

```text
src/
├── App.tsx                       # rewritten router
├── pages/
│   ├── Landing.tsx               # rewritten — builder hero
│   ├── Builder.tsx               # NEW — split-pane workspace
│   ├── SignIn.tsx / SignUp.tsx / Settings.tsx  # kept
├── components/builder/
│   ├── ChatPanel.tsx
│   ├── PreviewPane.tsx
│   ├── FileExplorer.tsx
│   ├── CodeViewer.tsx
│   ├── ComposerInput.tsx
│   └── parseLovFiles.ts
├── hooks/
│   └── useBuilderProject.ts      # loads/saves files+messages from Cloud
public/
└── preview-shell.html            # iframe runtime
supabase/
├── functions/chat/index.ts       # rewritten for builder
└── migrations/<ts>_builder.sql   # new tables + RLS + GRANTs
```

## Migration order

1. Delete Fluxa pages/components/hooks/functions in one sweep, rewrite `App.tsx`.
2. SQL migration: builder tables + RLS + GRANTs.
3. Add `preview-shell.html` + minimal `PreviewPane` that mounts a hello-world.
4. Rewrite `chat` edge function with builder system prompt + streamText.
5. Build `Builder.tsx` page wiring chat ↔ file parser ↔ preview.
6. New Landing with "Describe your app" hero → creates project → navigates to `/build/:id`.

## Risk / honesty

- This is a non-trivial app; v1 will generate **simple single-page React apps** reliably; complex multi-page apps with routing/data will be hit-or-miss. That's expected for a Lovable-clone v1.
- No app-deploy/publish for generated apps in v1.
- Existing admin/credits DB tables stay (no UI), can be dropped later.

**Confirm and I'll start with step 1 (delete + rewrite router + new landing skeleton). Want me to keep the admin panel as a hidden internal tool, or fully remove it?**
