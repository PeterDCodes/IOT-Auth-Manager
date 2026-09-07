# Repository Guidelines

## Project Structure & Module Organization

- `app.js` creates the Express application, mounts routers, and listens on port 3000.
- `routes/` contains public, protected, and authentication endpoints. Keep each route grouped by access level and purpose.
- `middlewear/` contains request middleware such as `authenticate.js`. Retain the existing directory name when adding imports or files.
- `data/` owns SQLite access, device operations, and database seeding.
- `client/` contains the in-progress reusable authentication client.
- Runtime files such as `devices.db` and `TestKey.txt` are generated locally and must not be committed.

## Build, Test, and Development Commands

Run `npm install` to install dependencies. Common commands are:

- `npm start` — starts the API with `node app.js` at `http://localhost:3000`.
- `npm run seed` — creates the `devices` table and writes a seeded secret to `TestKey.txt`. Use a disposable local database; reruns may report existing data.
- `npm test` — currently exits with an error because no test suite is configured.

There is no compile or build step.

## Coding Style & Naming Conventions

Use modern JavaScript with ES module `import`/`export` syntax. Follow the existing two-space indentation in routing and application code, match surrounding punctuation, and prefer `const` unless reassignment is required. Use `camelCase` for functions and variables, `PascalCase` for classes, and lowercase descriptive filenames such as `authentication.js`. Keep route handlers focused; place persistence logic in `data/` and reusable request checks in middleware.

No formatter or linter is configured. Keep changes focused and match the surrounding file's style.

## Testing Guidelines

Until automated tests are added, seed a fresh local database, start the server, and exercise affected endpoints with `curl` or an API client. When adding tests, define a real `npm test` script and name files `*.test.js`, colocated with modules or under `test/`. Cover success, validation, duplicate-device, and authorization failure paths.

## Commit & Pull Request Guidelines

Recent commits use short, action-oriented summaries, usually in sentence case (for example, `added readme`). Prefer clearer imperative subjects such as `Add refresh token validation`, and keep each commit scoped to one logical change. Pull requests should explain behavior changes, list verification commands, link relevant issues, and include example requests/responses for API changes. Call out schema or security implications explicitly; screenshots are only needed for user-visible client changes.
