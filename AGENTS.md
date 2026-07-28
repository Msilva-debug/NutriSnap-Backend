# Repository Guidelines

## Project Structure & Module Organization

This is a NestJS backend for NutriSnap using TypeScript, TypeORM, PostgreSQL, JWT auth, scheduled jobs, WebSockets, and Gemini-powered nutrition features. Application code lives in `src/`. Feature modules are grouped under `src/modules/<feature>/`, with nearby controllers, services, DTOs, entities, guards, strategies, agents, and unit tests.

Database migrations live in `src/migrations/` and seed/support SQL lives in `scripts/`. End-to-end tests are under `test/`, while unit specs are colocated with source files as `*.spec.ts`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run start:dev`: run the Nest server in watch mode for local development.
- `npm run build`: compile the app into `dist/`.
- `npm test`: run unit tests with Jest.
- `npm run test:e2e`: run the e2e suite using `test/jest-e2e.json`.
- `npm run test:cov`: generate Jest coverage output in `coverage/`.
- `npm run lint`: run ESLint and auto-fix TypeScript files.
- `npm run format`: format `src/**/*.ts` and `test/**/*.ts` with Prettier.

## Coding Style & Naming Conventions

Use TypeScript and NestJS patterns already present in the repo: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`, and `dto/*.dto.ts`. Keep feature behavior inside its module unless shared through a provider.

Formatting is managed by Prettier through ESLint. Keep imports readable, use two-space indentation, and avoid unrelated refactors. ESLint allows `any`, but prefer typed DTOs, entities, and interfaces when practical.

## Testing Guidelines

Use Jest for unit and e2e tests. Name unit tests `*.spec.ts` and colocate them with the class or utility under test, as in `src/modules/auth/password.utils.spec.ts`. Use `test/app.e2e-spec.ts` for HTTP-level coverage. Add tests for new validation, auth, date filtering, rule-engine, or recommendation behavior.

## Commit & Pull Request Guidelines

Recent history uses concise Spanish commit subjects in imperative/present tense, for example `Agrega preparaciones reutilizables con Gemini` and `Ajusta recomendaciones segun objetivo nutricional`. Keep commits focused and include a body when behavior, migrations, or API contracts change.

Pull requests should describe the change, list test commands run, mention database migrations or environment variables, and link related issues. Include request/response examples for API changes and screenshots only when a visible client integration is relevant.

## Security & Configuration Tips

Create a local `.env` and never commit secrets. Required values include `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `GEMINI_API_KEY`; `GEMINI_EMBEDDING_MODEL` is optional. Local TypeORM config targets PostgreSQL on `localhost:5432` with database `nutrisnap`; migrations run automatically on startup.
