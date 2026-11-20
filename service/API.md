# IOT Auth Service API

The service stores device inventory separately from authentication state. Run `npm run seed` from this directory to create the v2 PostgreSQL schema.

## Register a device

`POST /register`

If `REGISTRATION_CODE` is configured, send it in the `x-registration-code` header.

```json
{
  "name": "MDI-Tablet-1",
  "serial_number": "WS-2026-0001",
  "mac_addr": "00:1A:2B:3C:4D:5E",
  "asset_code": "EAM-15432",
  "type": 12,
  "model": 1,
  "ip": "127.0.0.1",
  "authenticate": 1
}
```

`name`, `serial_number`, and `mac_addr` are required, non-empty strings of at most 100 characters. They must each be unique; name and MAC comparisons are case-insensitive. `asset_code` is an optional string of at most 100 characters and `ip` is an optional string of at most 45 characters. The service does not validate MAC or IP formatting. `type` and `model` are optional integer references.

Only `authenticate: 1` creates an authentication record and secret. Its response is:

```json
{
  "message": "Device successfully registered and authenticated",
  "uuid": "123e4567-e89b-42d3-a456-426614174000",
  "secret": "one-time-secret"
}
```

All other integer values, or an omitted `authenticate`, register inventory only:

```json
{
  "message": "Device successfully registered"
}
```

## Refresh an access token

`POST /refresh`

```json
{
  "uuid": "123e4567-e89b-42d3-a456-426614174000",
  "secret": "one-time-secret"
}
```

An active authentication record with a matching secret receives the existing credential response containing `access_token`, `token_type`, and `expires_in`. The RS256 token contains a `uuid` claim and uses that UUID as its subject.

## Read APIs

- `GET /devices` and `GET /devices/:uuid`
- `GET /device-types` and `GET /device-types/:cd_device_type`
- `GET /device-models` and `GET /device-models/:cd_device_model`
- `GET /device-deployments` and `GET /device-deployments/:cd_deployment`

Collection endpoints return arrays ordered by their database identity. Detail endpoints return `404` when the requested record does not exist. Authentication secret hashes are never included in device responses.
