import assert from "node:assert/strict"
import { generateKeyPairSync } from "node:crypto"
import test from "node:test"
import jwt from "jsonwebtoken"
import { AuthClient } from "clientregister"
import { createAuthenticate } from "clientregister/express"
import { signAccessToken } from "../src/authentication/token.js"

const SECRET = "test-secret-that-is-long-enough-for-development"

const createResponse = () => {
  return {
    statusCode: 200,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode
      return this
    },
    json(body) {
      this.body = body
      return this
    }
  }
}

const runMiddleware = (middleware, authorization) => {
  const req = { headers: { authorization } }
  const res = createResponse()
  let nextCalled = false

  middleware(req, res, () => {
    nextCalled = true
  })

  return { req, res, nextCalled }
}

test("createAuthenticate accepts a valid HS256 access token", () => {
  const token = jwt.sign(
    { deviceId: 42 },
    SECRET,
    {
      algorithm: "HS256",
      issuer: "client-register",
      audience: "device-apis",
      expiresIn: "5m"
    }
  )
  const authenticate = createAuthenticate({ secret: SECRET })

  const result = runMiddleware(authenticate, `Bearer ${token}`)

  assert.equal(result.nextCalled, true)
  assert.equal(result.req.auth.deviceId, 42)
  assert.equal(result.res.statusCode, 200)
})

test("createAuthenticate rejects a missing Bearer token", () => {
  const authenticate = createAuthenticate({ secret: SECRET })

  const result = runMiddleware(authenticate)

  assert.equal(result.nextCalled, false)
  assert.equal(result.res.statusCode, 401)
  assert.deepEqual(result.res.body, { error: "Bearer access token required" })
})

test("createAuthenticate rejects an expired token", () => {
  const token = jwt.sign(
    { deviceId: 42 },
    SECRET,
    {
      algorithm: "HS256",
      issuer: "client-register",
      audience: "device-apis",
      expiresIn: -1
    }
  )
  const authenticate = createAuthenticate({ secret: SECRET })

  const result = runMiddleware(authenticate, `Bearer ${token}`)

  assert.equal(result.nextCalled, false)
  assert.equal(result.res.statusCode, 401)
  assert.deepEqual(result.res.body, { error: "Invalid or expired access token" })
})

test("createAuthenticate rejects a token for another audience", () => {
  const token = jwt.sign(
    { deviceId: 42 },
    SECRET,
    {
      algorithm: "HS256",
      issuer: "client-register",
      audience: "another-api",
      expiresIn: "5m"
    }
  )
  const authenticate = createAuthenticate({ secret: SECRET })

  const result = runMiddleware(authenticate, `Bearer ${token}`)

  assert.equal(result.nextCalled, false)
  assert.equal(result.res.statusCode, 401)
})

test("createAuthenticate rejects a token signed with another secret", () => {
  const token = jwt.sign(
    { deviceId: 42 },
    "another-secret-that-is-long-enough-for-development",
    {
      algorithm: "HS256",
      issuer: "client-register",
      audience: "device-apis",
      expiresIn: "5m"
    }
  )
  const authenticate = createAuthenticate({ secret: SECRET })

  const result = runMiddleware(authenticate, `Bearer ${token}`)

  assert.equal(result.nextCalled, false)
  assert.equal(result.res.statusCode, 401)
})

test("RS256 tokens can be issued and verified with only the public key", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" }
  })
  const token = signAccessToken(42, {
    JWT_ALGORITHM: "RS256",
    JWT_PRIVATE_KEY: privateKey,
    JWT_PUBLIC_KEY: publicKey,
    JWT_ISSUER: "client-register",
    JWT_AUDIENCE: "device-apis",
    EXPIRES_IN: "5m"
  })
  const authenticate = createAuthenticate({ publicKey })

  const result = runMiddleware(authenticate, `Bearer ${token}`)

  assert.equal(result.nextCalled, true)
  assert.equal(result.req.auth.deviceId, 42)
  assert.equal(result.req.auth.sub, "42")
})

test("AuthClient supports separate authentication and API base URLs", () => {
  const client = new AuthClient({
    authBaseURL: "http://localhost:3000",
    apiBaseURL: "http://localhost:4000"
  })

  assert.equal(client.authHttp.defaults.baseURL, "http://localhost:3000")
  assert.equal(client.http.defaults.baseURL, "http://localhost:4000")
})
