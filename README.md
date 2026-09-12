A PostgreSQL-backed device registration service intended for mobile devices that are not tied to a specific user or account.

It provides device registration, secret-based access-token refresh, an Axios authentication client, and reusable Express middleware for authenticated API calls.

## Authentication flow

1. A device registers once through `POST /auth/register` and securely stores the returned device secret.
2. The device exchanges its ID and secret through `POST /auth/refresh` for a short-lived JWT access token.
3. The device sends that token to an API as `Authorization: Bearer ACCESS_TOKEN`.
4. The API verifies the JWT locally with the `clientregister/express` middleware. It does not query the authentication database on every request.

## Setup

1. Copy `.env-sample` to `.env` and set the PostgreSQL, JWT, and registration values.
2. Create the database named by `PGDATABASE` and grant access to `PGUSER`.
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
  -H 'x-registration-code: YOUR_REGISTRATION_CODE' \
  -d '{"id":1,"name":"Test Device","serial":"TEST-001","mac_addr":"00:00:00:00:00:01","device_ip":"127.0.0.1"}'

curl -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"id":1,"secret":"SECRET_RETURNED_BY_REGISTER"}'
```

`GET /devices` is public and excludes stored secret hashes. `GET /secret` requires the bearer access token returned by the refresh request.

`REGISTRATION_CODE` is optional for backward compatibility. When it is configured, registration requests must send the matching `x-registration-code` header. Configure it outside local experiments so unknown devices cannot enroll themselves.

## Use in another Express API

Install the package from the local sibling directory while developing:

```sh
npm install ../clientRegister
```

Create the middleware once, then mount it on the routes that should be protected:

```js
import express from "express"
import { createAuthenticate } from "clientregister/express"

const app = express()

const authenticate = createAuthenticate({
  secret: process.env.JWT_SECRET,
  issuer: process.env.JWT_ISSUER ?? "client-register",
  audience: process.env.JWT_AUDIENCE ?? "device-apis"
})

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

app.use("/api", authenticate)

app.get("/api/orders", (req, res) => {
  res.json({
    deviceId: req.auth.deviceId,
    orders: []
  })
})

app.listen(4000)
```

`/health` remains public. Every route under `/api` requires a valid token. A successful check places the verified JWT payload on `req.auth`.

The HS256 setup above preserves the original shared-secret behavior. Every API with `JWT_SECRET` can also create valid tokens, so RS256 is recommended when the auth service and protected APIs are separate applications.

## Recommended RS256 setup

Generate a private/public key pair:

```sh
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private.pem -out public.pem
```

Do not commit `private.pem`. Configure the authentication service with:

```dotenv
JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY_PATH=./private.pem
JWT_PUBLIC_KEY_PATH=./public.pem
JWT_ISSUER=client-register
JWT_AUDIENCE=device-apis
EXPIRES_IN=15m
```

Each protected Express API receives only `public.pem`:

```js
import fs from "node:fs"
import { createAuthenticate } from "clientregister/express"

const authenticate = createAuthenticate({
  publicKey: fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, "utf8"),
  issuer: "client-register",
  audience: "device-apis"
})

app.use("/api", authenticate)
```

The public key verifies tokens but cannot sign new ones. The issuer, audience, and allowed algorithm are also checked for every request.

## Client usage

<img width="103" height="227" alt="image" src="https://github.com/user-attachments/assets/00ef556d-c920-4d89-b654-735612ec8483" />

The default package export remains the Axios client used by browser or device applications:

```js
import { AuthClient } from "clientregister"

const authClient = new AuthClient({
  authBaseURL: "http://localhost:3000",
  apiBaseURL: "http://localhost:4000",
  storage: secureDeviceStorage
})

await authClient.register(device, {
  registrationCode: codeEnteredByUser
})

const response = await authClient.http.get("/api/orders")
```

The client stores the permanent device secret through the supplied storage implementation, requests tokens from `authBaseURL`, sends API requests to `apiBaseURL`, attaches Bearer tokens, and retries once after a `401` response. The original `baseURL` option still sets both URLs when the auth routes and API share one server.

## Authentication and authorization

The middleware authenticates a device. Route-specific permission checks still belong in the protected API. Return `401` for a missing or invalid token and `403` when an authenticated device lacks permission for an operation.
