import assert from "node:assert/strict"
import test from "node:test"
import { validateRefresh } from "../src/domains/authentication/validation.js"
import { validateRegistration } from "../src/domains/devices/validation.js"

const validRegistration = {
  name: "MDI-Tablet-1",
  serial_number: "WS-2026-0001",
  mac_addr: "unformatted-mac-value"
}

test("registration requires name, serial number, and MAC address", () => {
  for (const field of ["name", "serial_number", "mac_addr"]) {
    const registration = { ...validRegistration }
    delete registration[field]

    assert.throws(() => validateRegistration(registration), new RegExp(field))
  }
})

test("registration accepts string MAC and IP values without format restrictions", () => {
  assert.doesNotThrow(() => validateRegistration({
    ...validRegistration,
    ip: "device-network-address"
  }))
})

test("registration rejects strings beyond their limits", () => {
  assert.throws(
    () => validateRegistration({ ...validRegistration, name: "a".repeat(101) }),
    /name must be a non-empty string no longer than 100 characters/
  )
  assert.throws(
    () => validateRegistration({ ...validRegistration, ip: "a".repeat(46) }),
    /ip must be a non-empty string no longer than 45 characters/
  )
})

test("registration accepts integer reference IDs and authenticate flag", () => {
  assert.doesNotThrow(() => validateRegistration({
    ...validRegistration,
    type: 12,
    model: 1,
    authenticate: 1
  }))

  assert.throws(
    () => validateRegistration({ ...validRegistration, model: "1" }),
    /model must be an integer/
  )
})

test("refresh requires exactly a UUID and generated secret", () => {
  assert.doesNotThrow(() => validateRefresh({
    uuid: "123e4567-e89b-42d3-a456-426614174000",
    secret: "a".repeat(64)
  }))

  assert.throws(
    () => validateRefresh({ uuid: "not-a-uuid", secret: "a".repeat(64) }),
    /uuid must be a valid UUID/
  )
  assert.throws(
    () => validateRefresh({
      uuid: "123e4567-e89b-42d3-a456-426614174000",
      secret: "short",
      extra: true
    }),
    /must only include uuid and secret/
  )
})
