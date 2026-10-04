import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const SERVICE_URL = process.env.SERVICE_URL ?? "http://localhost:3000"
const REQUEST_TIMEOUT_MS = 10_000

let serviceIsReachable = false
let registrationCode
let registeredDevice

const request = (path, options = {}) => fetch(`${SERVICE_URL}${path}`, {
  ...options,
  signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
})

const readResponseText = async(response) => (await response.text()).trim()

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

const registrationHeaders = async(extraHeaders = {}) => {
  const code = await getRegistrationCode()
  return {
    "content-type": "application/json",
    ...(code ? { "x-registration-code": code } : {}),
    ...extraHeaders
  }
}

const assertServiceWasReached = () => {
  assert.equal(
    serviceIsReachable,
    true,
    `The auth service must be running at ${SERVICE_URL} before this test is run`
  )
}

test("auth service is reachable", async() => {
  let response

  try {
    response = await request("/")
    serviceIsReachable = true
  } catch (error) {
    assert.fail(`Could not reach the auth service at ${SERVICE_URL}: ${error.message}`)
  }

  assert.equal(response.status, 200)
  assert.equal(await readResponseText(response), "IOT-AUTH-SERVER")
})

test("GET /.well-known/jwks.json returns the signing key", async() => {
  assertServiceWasReached()

  const response = await request("/.well-known/jwks.json")
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.ok(Array.isArray(body.keys))
  assert.ok(body.keys.length > 0)
  assert.equal(body.keys[0].kty, "RSA")
  assert.equal(body.keys[0].kid, "auth-key-1")
  assert.equal(body.keys[0].use, "sig")
  assert.equal(body.keys[0].alg, "RS256")
  assert.equal(typeof body.keys[0].n, "string")
  assert.equal(typeof body.keys[0].e, "string")
})

test("POST /auth/register rejects a request with missing fields", async() => {
  assertServiceWasReached()

  const response = await request("/auth/register", {
    method: "POST",
    headers: await registrationHeaders(),
    body: JSON.stringify({ name: "incomplete-device" })
  })

  assert.equal(response.status, 400)
  assert.equal(await readResponseText(response), "Missing required fields")
})

test("POST /auth/register rejects an invalid registration code when one is configured", async(t) => {
  assertServiceWasReached()

  if (!await getRegistrationCode()) {
    t.skip("REGISTRATION_CODE is not configured")
    return
  }

  const response = await request("/auth/register", {
    method: "POST",
    headers: await registrationHeaders({ "x-registration-code": "invalid-test-code" }),
    body: JSON.stringify({})
  })

  assert.equal(response.status, 403)
  assert.deepEqual(await response.json(), {
    error: "Valid registration code required"
  })
})

test("POST /auth/register registers a valid device", async() => {
  assertServiceWasReached()

  const uniqueValue = `${Date.now()}${process.pid}`
  const device = {
    name: `test-device-${uniqueValue}`,
    serial: `TEST-${uniqueValue}`.slice(0, 24),
    mac_addr: `02:00:${uniqueValue.slice(-2).padStart(2, "0")}:${uniqueValue.slice(-4, -2).padStart(2, "0")}:${uniqueValue.slice(-6, -4).padStart(2, "0")}:${uniqueValue.slice(-8, -6).padStart(2, "0")}`,
    device_ip: "192.0.2.10"
  }

  const response = await request("/auth/register", {
    method: "POST",
    headers: await registrationHeaders(),
    body: JSON.stringify(device)
  })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.message, "Device successfully Registered!")
  assert.ok(Number.isInteger(body.cd_device))
  assert.match(body.secret, /^[a-f0-9]{64}$/)

  registeredDevice = {
    ...device,
    cd_device: body.cd_device,
    secret: body.secret
  }

  const deviceResponse = await request(`/devices/${registeredDevice.cd_device}`)
  assert.equal(deviceResponse.status, 200)
  assert.equal((await deviceResponse.json()).last_refresh, null)
})

test("POST /auth/refresh rejects an invalid request body", async() => {
  assertServiceWasReached()

  const response = await request("/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cd_device: 1 })
  })

  assert.equal(response.status, 400)
  assert.equal(
    await readResponseText(response),
    "Refresh request body must only include cd_device and secret"
  )
})

test("POST /auth/refresh rejects an incorrect secret", async() => {
  assertServiceWasReached()
  assert.ok(registeredDevice, "The device registration test must succeed first")

  const response = await request("/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      cd_device: registeredDevice.cd_device,
      secret: "0".repeat(64)
    })
  })

  assert.equal(response.status, 403)
  assert.equal(await readResponseText(response), "Refresh request failed. UNAUTHORIZED DEVICE")

  const deviceResponse = await request(`/devices/${registeredDevice.cd_device}`)
  assert.equal(deviceResponse.status, 200)
  assert.equal((await deviceResponse.json()).last_refresh, null)
})

test("POST /auth/refresh issues a credential for a registered device", async() => {
  assertServiceWasReached()
  assert.ok(registeredDevice, "The device registration test must succeed first")

  const response = await request("/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      cd_device: registeredDevice.cd_device,
      secret: registeredDevice.secret
    })
  })
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.match(body.access_token, /^[^.]+\.[^.]+\.[^.]+$/)
  assert.equal(body.token_type, "Bearer")
  assert.ok(body.expires_in)

  const deviceResponse = await request(`/devices/${registeredDevice.cd_device}`)
  const refreshedDevice = await deviceResponse.json()
  assert.equal(deviceResponse.status, 200)
  assert.equal(typeof refreshedDevice.last_refresh, "string")
  assert.equal(Number.isNaN(Date.parse(refreshedDevice.last_refresh)), false)
  assert.match(refreshedDevice.last_refresh, /Z$/)
})

test("GET /devices returns registered devices without secret hashes", async() => {
  assertServiceWasReached()
  assert.ok(registeredDevice, "The device registration test must succeed first")

  const response = await request("/devices")
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.ok(Array.isArray(body))

  const device = body.find(({ cd_device }) => cd_device === registeredDevice.cd_device)
  assert.ok(device, "The newly registered device should be in the device list")
  assert.equal(device.name, registeredDevice.name)
  assert.equal(device.serial, registeredDevice.serial)
  assert.equal(device.mac_addr, registeredDevice.mac_addr)
  assert.equal(device.device_ip, registeredDevice.device_ip)
  assert.equal(device.active, true)
  assert.equal(typeof device.last_refresh, "string")
  assert.equal("hashed_key" in device, false)
  assert.equal("secret" in device, false)
})

test("GET /devices/:cd_device returns one public device", async() => {
  assertServiceWasReached()
  assert.ok(registeredDevice, "The device registration test must succeed first")

  const response = await request(`/devices/${registeredDevice.cd_device}`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.cd_device, registeredDevice.cd_device)
  assert.equal(body.name, registeredDevice.name)
  assert.equal(body.serial, registeredDevice.serial)
  assert.equal("hashed_key" in body, false)
  assert.equal("secret" in body, false)
})

test("GET /devices/:cd_device returns 404 for an unknown device", async() => {
  assertServiceWasReached()

  const response = await request("/devices/-1")

  assert.equal(response.status, 404)
  assert.equal(await readResponseText(response), "Device not found")
})

test("invalid JSON is rejected", async() => {
  assertServiceWasReached()

  const response = await request("/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{invalid-json"
  })

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: "Invalid JSON",
    message: "The request body could not be parsed as valid JSON. Please check your syntax."
  })
})

test("unknown routes return 404", async() => {
  assertServiceWasReached()

  const response = await request("/route-that-does-not-exist")

  assert.equal(response.status, 404)
  assert.equal(await readResponseText(response), "Route not found")
})
