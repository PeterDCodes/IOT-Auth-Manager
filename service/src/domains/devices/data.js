import crypto from "node:crypto"
import bcrypt from "bcrypt"
import database from "../../data/database.js"
import { validateRegistration } from "./validation.js"

const SALT_ROUNDS = 12

export const registerNewDevice=async(device)=>{
  validateRegistration(device)

  const client = await database.connect()

  try {
    await client.query("BEGIN")
    await ensureDeviceIsUnique(client, device)

    const uuid = crypto.randomUUID()
    await addDevice(client, uuid, device)

    if (device.authenticate === 1) {
      const secret = makeKey()
      const hashedKey = await makeHash(secret)
      await addDeviceAuthentication(client, uuid, hashedKey)
      await client.query("COMMIT")
      return { uuid, secret }
    }

    await client.query("COMMIT")
    return { uuid }
  } catch(error) {
    await client.query("ROLLBACK")

    if (error.code === "23505") {
      throw new Error("Device name, serial number, and MAC address must be unique")
    }

    throw new Error("Failed to register device", { cause: error })
  } finally {
    client.release()
  }
}

const ensureDeviceIsUnique=async(client, { name, serial_number, mac_addr })=>{
  const result = await client.query(`
    SELECT 1
    FROM device
    WHERE LOWER(ds_device_name) = LOWER($1)
      OR ds_serial_number = $2
      OR LOWER(ds_mac_address) = LOWER($3)
    LIMIT 1
  `, [name, serial_number, mac_addr])

  if (result.rowCount > 0) {
    throw new Error("Device name, serial number, and MAC address must be unique")
  }
}

const addDevice=async(client, uuid, device)=>{
  await client.query(`
    INSERT INTO device (
      device_uuid,
      ds_device_name,
      ds_asset_code,
      cd_device_type,
      cd_device_model,
      ds_serial_number,
      ds_mac_address,
      ds_ip_addr
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    uuid,
    device.name,
    device.asset_code ?? null,
    device.type ?? null,
    device.model ?? null,
    device.serial_number,
    device.mac_addr,
    device.ip ?? null
  ])
}

const addDeviceAuthentication=async(client, uuid, hashedKey)=>{
  await client.query(`
    INSERT INTO device_authentication (
      device_uuid,
      ds_hashed_key,
      dt_authenticated,
      fl_active
    ) VALUES ($1, $2, CURRENT_TIMESTAMP, TRUE)
  `, [uuid, hashedKey])
}

export const getDeviceAuthenticationByUuid=async(uuid)=>{
  const result = await database.query(`
    SELECT device_uuid, ds_hashed_key, fl_active
    FROM device_authentication
    WHERE device_uuid = $1
  `, [uuid])

  return result.rows[0]
}

export const updateLastRefresh=async(uuid)=>{
  await database.query(`
    UPDATE device_authentication
    SET dt_last_refresh = CURRENT_TIMESTAMP,
        dt_updated = CURRENT_TIMESTAMP
    WHERE device_uuid = $1
  `, [uuid])
}

export const getPublicDeviceByUuid=async(uuid)=>{
  const result = await database.query(`
    SELECT
      device_uuid AS uuid,
      ds_device_name AS name,
      ds_asset_code AS asset_code,
      cd_device_type AS type,
      cd_device_model AS model,
      ds_serial_number AS serial_number,
      ds_mac_address AS mac_addr,
      ds_ip_addr AS ip,
      dt_record,
      dt_updated
    FROM device
    WHERE device_uuid = $1
  `, [uuid])

  return result.rows[0]
}

export const getDevices=async()=>{
  const result = await database.query(`
    SELECT
      device_uuid AS uuid,
      ds_device_name AS name,
      ds_asset_code AS asset_code,
      cd_device_type AS type,
      cd_device_model AS model,
      ds_serial_number AS serial_number,
      ds_mac_address AS mac_addr,
      ds_ip_addr AS ip,
      dt_record,
      dt_updated
    FROM device
    ORDER BY cd_device
  `)

  return result.rows
}

export const makeHash=async(secret)=>bcrypt.hash(secret, SALT_ROUNDS)

export const validateHash=async(secret, hash)=>bcrypt.compare(secret, hash)

export const makeKey=()=>crypto.randomBytes(32).toString("hex")
