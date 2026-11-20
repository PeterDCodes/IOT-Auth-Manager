const STRING_LIMITS = {
  name: 100,
  serial_number: 100,
  mac_addr: 100,
  asset_code: 100,
  ip: 45
}

const validateString=(value, field, required=false)=>{
  if (value == null && !required) {
    return
  }

  if (typeof value !== "string" || value.length === 0 || value.length > STRING_LIMITS[field]) {
    throw new Error(`${field} must be a non-empty string no longer than ${STRING_LIMITS[field]} characters`)
  }
}

const validateOptionalInteger=(value, field)=>{
  if (value != null && !Number.isInteger(value)) {
    throw new Error(`${field} must be an integer`)
  }
}

export const validateRegistration=(device)=>{
  if (!device || typeof device !== "object" || Array.isArray(device)) {
    throw new Error("Registration body must be a JSON object")
  }

  validateString(device.name, "name", true)
  validateString(device.serial_number, "serial_number", true)
  validateString(device.mac_addr, "mac_addr", true)
  validateString(device.asset_code, "asset_code")
  validateString(device.ip, "ip")
  validateOptionalInteger(device.type, "type")
  validateOptionalInteger(device.model, "model")

  if (device.authenticate != null && !Number.isInteger(device.authenticate)) {
    throw new Error("authenticate must be an integer")
  }
}
