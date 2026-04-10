# Life Achievement Game

Локальний повноцінний запуск (без деплою).

## Запуск у Cursor (Dev Container)

Щоб у **вбудованому терміналі Cursor** були `node` / `npm` без встановлення Node на Mac:

1. Встанови **Docker Desktop** (або Colima) і в Cursor — розширення **Dev Containers** (запропонує `.vscode/extensions.json`).
2. `cp .env.example .env` і додай у `.env` рядки **Neon** (`DATABASE_URL`, `DIRECT_URL`) та `OPENAI_API_KEY`.
3. Command Palette (**⌘⇧P**): **Dev Containers: Reopen in Container** — дочекайся збірки образу та `postCreateCommand`.
4. Запуск сервера:
   - **Terminal → Run Task…** (**⌘⇧B** або **Tasks: Run Task**) → **Next.js: dev server**,  
   - або в терміналі контейнера: `npm run dev`.

Порт **3000** пересилається автоматично; відкрий [http://localhost:3000](http://localhost:3000).

## Варіант 1: Docker (якщо немає Node.js у системі)

Потрібні **Docker Desktop** (або **Colima** / **Podman**) — Node всередині контейнера, на Mac не обов’язково ставити Node.

1. Створи `.env` з **Neon** (`DATABASE_URL`, `DIRECT_URL`) та `OPENAI_API_KEY` — Compose підхопить `.env` у корені проєкту:

```bash
cd /Users/macbook/Desktop/GameLife
cp .env.example .env
# Відредагуй .env: рядки з Neon з дашборду + OPENAI_API_KEY=sk-...
```

2. Запуск:

```bash
docker compose up --build
```

Або: `npm run docker:up` (якщо Node/npm уже є лише для скриптів).

3. Відкрий [http://localhost:3000](http://localhost:3000).

Перший старт може зайняти хвилину: у контейнері виконається `npm install` (якщо ще немає `node_modules` на диску), `prisma generate`, `migrate deploy`, потім `next dev` на `0.0.0.0:3000`. Код проєкту змонтований у контейнер (`.: /app`), зміни в файлах підхоплюються.

## Варіант 2: Node на Mac (nvm / Homebrew)

```bash
cd /Users/macbook/Desktop/GameLife
nvm use
cp .env.example .env
# додай у .env: DATABASE_URL, DIRECT_URL (Neon), OPENAI_API_KEY=sk-...
npm install
npx prisma migrate dev
npm run dev
```

Відкрий [http://localhost:3000](http://localhost:3000).

## Cursor / агентне середовище

У **чаті агента** (ізольоване середовище) часто **немає Node/Docker**, тому агент не може підняти сервер замість тебе. Відкрий проєкт у **Dev Container** (розділ вище) або запускай **Варіант 1 / 2** у своєму терміналі.

## База даних

Проєкт орієнтований на **Neon (PostgreSQL)**. У [Neon Console](https://console.neon.tech) створи проєкт, скопіюй **Pooled** connection string у `DATABASE_URL` і **Direct** у `DIRECT_URL` (обидва з `sslmode=require`, якщо Neon їх додає). Після змін у `.env`: `npx prisma migrate deploy` (або `migrate dev` у розробці). Локальний SQLite більше не використовується — старий `prisma/dev.db` можна видалити.
