A PostgreSQL-backed device registration service intended for mobile devices that are not tied to a specific user or account.

It provides device registration, secret-based access-token refresh, and middleware for authenticated API calls.

## Setup

1. Copy `.env-sample` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, and `EXPIRES_IN`.
2. Create the database named in `DATABASE_URL`.
3. Run `npm run seed` to create the `devices` table.
4. Run `npm start` to start the service at `http://localhost:3000`.

The seed is idempotent and creates only the schema. Register devices through `POST /auth/register`.

## PostgreSQL verification

Run the seed twice to verify that schema creation is repeatable:

```sh
npm run seed
npm run seed
```

After starting the service, verify registration and token refresh:

```sh
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"id":1,"name":"Test Device","serial":"TEST-001","mac_addr":"00:00:00:00:00:01","device_ip":"127.0.0.1"}'

curl -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"id":1,"secret":"SECRET_RETURNED_BY_REGISTER"}'
```

`GET /devices` is public and excludes stored secret hashes. `GET /secret` requires the bearer access token returned by the refresh request.
