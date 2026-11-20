export const validateRefresh = (body) => {
  if (!body || Array.isArray(body) || Object.keys(body).length !== 2 ||
      !("uuid" in body) || !("secret" in body)) {
    throw new Error("Refresh request body must only include uuid and secret")
  }

  if (typeof body.uuid !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.uuid)) {
    throw new Error("uuid must be a valid UUID")
  }

  if (typeof body.secret !== "string" || !/^[a-f0-9]{64}$/.test(body.secret)) {
    throw new Error("secret must be a valid secret")
  }
}
