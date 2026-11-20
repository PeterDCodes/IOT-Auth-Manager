import database from "../../data/database.js"

export const getDeviceTypes=async()=>{
  const result = await database.query(`
    SELECT cd_device_type, dt_record, ds_type
    FROM device_type
    ORDER BY cd_device_type
  `)

  return result.rows
}

export const getDeviceTypeById=async(cdDeviceType)=>{
  const result = await database.query(`
    SELECT cd_device_type, dt_record, ds_type
    FROM device_type
    WHERE cd_device_type = $1
  `, [cdDeviceType])

  return result.rows[0]
}
