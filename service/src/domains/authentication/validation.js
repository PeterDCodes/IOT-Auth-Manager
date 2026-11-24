export const validateRefresh = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      !Object.hasOwn(body, "uuid") || !Object.hasOwn(body, "secret") ||
      Object.keys(body).some((key) => !["uuid", "secret", "config"].includes(key))) {
    throw new Error("Refresh request body must only include uuid and secret, with optional config")
  }

  if (typeof body.uuid !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.uuid)) {
    throw new Error("uuid must be a valid UUID")
  }

  if (typeof body.secret !== "string" || !/^[a-f0-9]{64}$/.test(body.secret)) {
    throw new Error("secret must be a valid secret")
  }

  if (Object.hasOwn(body, "config") &&
      (typeof body.config !== "string" || body.config.trim() === "")) {
    throw new Error("config must be a non-empty string")
  }
}
