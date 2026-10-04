# IOT Auth Manager

PostgreSQL-backed device authentication using RS256 JWTs. The auth service signs tokens with its private key; APIs verify them with the published public key.

<img width="2312" height="1284" alt="image" src="https://github.com/user-attachments/assets/ffdfdf13-ab05-4170-8954-ca1804a8ee55" />


## Directory Structure
clients - implementation of client devices registering to service and maintaing secret, refresh, etc.
middelware - Standard authenticate middelwear and example of how to use in express projects
service - Main DIR containing the authentication mmanager service

## Setup

From `service/`:

```sh
cp .env-sample .env
./keys/makeKeys.sh
npm install
npm run seed
npm start
```

Set `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `JWT_PRIVATE_KEY_PATH`, `JWT_PUBLIC_KEY_PATH`, `EXPIRES_IN`, `ISSUER`, and `AUDIENCE` in `.env`. `REGISTRATION_CODE` is optional.

The service runs at `http://localhost:3000`.

## Authentication contract

1. Register a device and retain its `cd_device` and `secret`.
2. Send those credentials to `/auth/refresh` to receive an RS256 access token.
3. Send the token to protected APIs as `Authorization: Bearer <access_token>`.

<img width="2474" height="1062" alt="image" src="https://github.com/user-attachments/assets/1815f437-4f49-40f9-90fc-82de74ad82dc" />

The token contains `cd_device`, `sub`, `iss`, `aud`, `iat`, and `exp`. APIs must verify the RS256 signature, issuer, audience, and expiry.

## Routes

### `GET /`

Returns `200` with `IOT-AUTH-SERVER` as plain text.

### `POST /auth/register`

Request body:

```json
{
  "name": "Sensor 1",
  "serial": "SN-001",
  "mac_addr": "00:00:00:00:00:01",
  "device_ip": "192.0.2.10"
}
```

If `REGISTRATION_CODE` is set, include it in the `x-registration-code` header.

Returns `200`:

```json
{
  "message": "Device successfully Registered!",
  "cd_device": 1,
  "secret": "device-secret"
}
```

Returns `400` for missing fields or `403` for an invalid registration code.

### `POST /auth/refresh`

Request body:

```json
{ "cd_device": 1, "secret": "device-secret" }
```

Returns `200`:

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": "15m"
}
```

Returns `400` for missing credentials or `403` when the device is unknown, inactive, or the secret is invalid.

### `GET /devices`

Returns `200` with an array of devices. Each device contains `cd_device`, `name`, `serial`, `mac_addr`, `device_ip`, `dt_created`, `dt_modified`, `last_refresh`, and `active`. `last_refresh` is `null` until the device successfully requests an access token, then contains the UTC timestamp of the most recent successful refresh. Secret hashes are not returned.

### `GET /devices/:cd_device`

Returns `200` with one device in the same shape, or `404` if it does not exist.

### `GET /.well-known/jwks.json`

Returns `200` with the RS256 public key as a JSON Web Key Set. The key has `kid: "auth-key-1"`, `use: "sig"`, and `alg: "RS256"`.

All other routes return `404`.

<img width="2488" height="814" alt="image" src="https://github.com/user-attachments/assets/50b30d15-e84e-4965-bf40-386dc6a6c973" />

## Express middleware

Fetch the public key and use the same issuer and audience configured on the auth service:

```js
import { KeyManager, createAuthenticate } from "auth-middleware"

const keys = new KeyManager("./", "http://localhost:3000/.well-known/jwks.json")
const publicKey = await keys.fetchAndStore()
const authenticate = createAuthenticate({
  publicKey,
  issuer: process.env.ISSUER,
  audience: process.env.AUDIENCE
})

app.get("/protected", authenticate, (req, res) => {
  res.json({ cd_device: req.auth.cd_device })
})
```

Missing, invalid, or expired bearer tokens return `401`. Verified claims are available as `req.auth`.
