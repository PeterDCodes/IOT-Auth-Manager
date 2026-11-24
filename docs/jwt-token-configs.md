# JWT token configurations

IOT Auth Manager reads token configurations from the PostgreSQL `config` table each time an authenticated device calls `POST /refresh`. Each configuration sets the token's issuer, audience, and lifetime. Devices that omit `config` receive a token signed using the `default` configuration.

## Create the table and add configurations

From the repository root, apply the [configuration schema](../service/src/data/config.sql) to the same database used by the service. Run `psql` with that database's standard `PG*` connection settings.

```sh
psql -v ON_ERROR_STOP=1 -f service/src/data/config.sql
```

On a fresh setup, insert an active `default` row and any named configurations you want to offer. The example below creates a 15-minute default token and a one-day token for the `mdata` audience. Apply these inserts once. Repeated inserts create additional versions with the same name.

```sql
INSERT INTO config (name, issuer, audience, expires_in)
VALUES
  ('default', 'IOT-AUTH-MANAGER', 'IOT-DEVICE', '15m'),
  ('mdata',   'IOT-AUTH-MANAGER', 'mdata',      '1d');
```

`npm run seed` creates the device schema. Apply `config.sql` separately and insert `default` explicitly. If you are migrating from environment-based token settings, copy the old `ISSUER`, `AUDIENCE`, and `EXPIRES_IN` values into the default row. All configurations use RS256 and the private key at `JWT_PRIVATE_KEY_PATH`.

| Column | How it is used |
| --- | --- |
| `name` | The exact string a device sends as `config`. PostgreSQL generates the separate row ID, `cd_config`. |
| `issuer` | The JWT's `iss` claim and the value of its `key` claim. |
| `audience` | The JWT's `aud` claim. Use the audience expected by the receiving service. |
| `expires_in` | The lifetime stored as text. Include a unit, for example `30s`, `15m`, or `1d`. |
| `active` | Whether a row is eligible for refresh. New rows are active by default. |

If several active rows share a name, the service selects the newest by `dt_created`, using the highest `cd_config` to break ties. Changes apply to subsequent refresh requests without a restart. To retire a configuration, deactivate all active rows with that name. Previously issued tokens keep their original expiry.

## Request a token

Send the registered device's UUID and its 64-character lowercase hexadecimal secret in a JSON body. With the service listening locally, send the request to `http://localhost:3000/refresh`. With the repository's APISIX auth route, use `/auth/refresh` on the gateway.

```sh
curl -sS http://localhost:3000/refresh \
  -H 'Content-Type: application/json' \
  --data "{\"uuid\":\"$DEVICE_UUID\",\"secret\":\"$DEVICE_SECRET\",\"config\":\"mdata\"}"
```

Set `DEVICE_UUID` and `DEVICE_SECRET` to the credentials returned during registration. Remove the `config` field to select `default`. The HTTP `200` response identifies the selected configuration and returns the configured lifetime as text.

```json
{
  "access_token": "<signed JWT>",
  "token_type": "Bearer",
  "expires_in": "1d",
  "config": "mdata"
}
```

Send the access token to protected APIs in the `Authorization: Bearer <signed JWT>` header. A blank or non-string `config`, or a name with no active row, returns HTTP `400`. If a request omits `config` and gets a configuration error, check that an active `default` row exists. A device with inactive authentication or a mismatched secret receives HTTP `403`.

## Match APISIX credentials

For APISIX routes using `jwt-auth`, set the Consumer's JWT credential key to the configuration's `issuer` and use the public key that matches the service's signing key. The [Consumer setup script](../APISIX/scripts/setup-consumer.sh) takes these values from `SERVICE_KEY` and `PUB_KEY_PATH`. Both example configurations emit `key: IOT-AUTH-MANAGER` because they share an issuer. To target a different APISIX JWT credential, give the named configuration an issuer that matches that credential's key.

Any device that passes refresh authentication can request any active configuration. The current schema has no per-device configuration assignment.
