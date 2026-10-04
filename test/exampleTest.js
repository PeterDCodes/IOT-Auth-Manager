import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const SERVICE_URL = process.env.SERVICE_URL ?? "http://localhost:3000"
const EXAMPLE_URL = process.env.EXAMPLE_URL ?? "http://localhost:3001"
const REQUEST_TIMEOUT_MS = 10_000

let exampleIsReachable = false
let registrationCode
let registeredDevice
let accessToken

const request = (baseUrl, path, options = {}) => fetch(`${baseUrl}${path}`, {
  ...options,
  signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
})

const getRegistrationCode = async() => {
  if (registrationCode !== undefined) {
    return registrationCode
  }

  if (process.env.REGISTRATION_CODE) {
    registrationCode = process.env.REGISTRATION_CODE
    return registrationCode
  }

  try {
    const envFile = await readFile(new URL("../service/.env", import.meta.url), "utf8")
    const match = envFile.match(/^\s*REGISTRATION_CODE\s*=\s*(.*?)\s*$/m)
    registrationCode = match?.[1]?.replace(/^(['"])(.*)\1$/, "$2") || null
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error
    }
    registrationCode = null
  }

  return registrationCode
}

const assertExampleWasReached = () => {
  assert.equal(
    exampleIsReachable,
    true,
    `The middleware example must be running at ${EXAMPLE_URL} before this test is run`
  )
}

test("middleware example is reachable through its public route", async() => {
  let response

  try {
    response = await request(EXAMPLE_URL, "/public")
    exampleIsReachable = true
  } catch (error) {
    assert.fail(`Could not reach the middleware example at ${EXAMPLE_URL}: ${error.message}`)
  }

  assert.equal(response.status, 200)
  assert.equal((await response.text()).trim(), "PUBLIC ROUTE")
})

test("GET /protected requires a device ID", async() => {
  assertExampleWasReached()

  const response = await request(EXAMPLE_URL, "/protected")

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: "Device ID required" })
})

test("GET /protected requires a bearer token", async() => {
  assertExampleWasReached()

  const response = await request(EXAMPLE_URL, "/protected", {
    headers: { "x-device-id": "1" }
  })

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: "Bearer access token required" })
})

test("GET /protected rejects an invalid bearer token", async() => {
  assertExampleWasReached()

  const response = await request(EXAMPLE_URL, "/protected", {
    headers: {
      "x-device-id": "1",
      authorization: "Bearer invalid-token"
    }
  })

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: "Invalid or expired access token" })
})

test("auth service issues a credential for the protected-route test", async() => {
  assertExampleWasReached()

  const uniqueValue = `${Date.now()}${process.pid}`
  const registrationHeaders = { "content-type": "application/json" }
  const code = await getRegistrationCode()

  if (code) {
    registrationHeaders["x-registration-code"] = code
  }

  let registrationResponse
  try {
    registrationResponse = await request(SERVICE_URL, "/auth/register", {
      method: "POST",
      headers: registrationHeaders,
      body: JSON.stringify({
        name: `example-test-${uniqueValue}`,
        serial: `EX-${uniqueValue}`.slice(0, 24),
        mac_addr: `02:01:${uniqueValue.slice(-2).padStart(2, "0")}:${uniqueValue.slice(-4, -2).padStart(2, "0")}:${uniqueValue.slice(-6, -4).padStart(2, "0")}:${uniqueValue.slice(-8, -6).padStart(2, "0")}`,
        device_ip: "192.0.2.11"
      })
    })
  } catch (error) {
    assert.fail(`Could not reach the auth service at ${SERVICE_URL}: ${error.message}`)
  }

  assert.equal(registrationResponse.status, 200)
  registeredDevice = await registrationResponse.json()
  assert.ok(Number.isInteger(registeredDevice.cd_device))
  assert.match(registeredDevice.secret, /^[a-f0-9]{64}$/)

  const refreshResponse = await request(SERVICE_URL, "/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      cd_device: registeredDevice.cd_device,
      secret: registeredDevice.secret
    })
  })

  assert.equal(refreshResponse.status, 200)
  const credential = await refreshResponse.json()
  assert.match(credential.access_token, /^[^.]+\.[^.]+\.[^.]+$/)
  accessToken = credential.access_token
})

test("GET /protected accepts a valid service credential", async() => {
  assertExampleWasReached()
  assert.ok(registeredDevice, "The credential setup test must succeed first")
  assert.ok(accessToken, "The credential setup test must succeed first")

  const response = await request(EXAMPLE_URL, "/protected", {
    headers: {
      "x-device-id": String(registeredDevice.cd_device),
      authorization: `Bearer ${accessToken}`
    }
  })

  assert.equal(response.status, 200)
  assert.equal((await response.text()).trim(), "PROTECTED ROUTE")
})
