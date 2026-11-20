import database from "../../data/database.js"

export const getDeviceModels=async()=>{
  const result = await database.query(`
    SELECT cd_device_model, cd_device_type, ds_model, ds_vendor
    FROM device_model
    ORDER BY cd_device_model
  `)

  return result.rows
}

export const getDeviceModelById=async(cdDeviceModel)=>{
  const result = await database.query(`
    SELECT cd_device_model, cd_device_type, ds_model, ds_vendor
    FROM device_model
    WHERE cd_device_model = $1
  `, [cdDeviceModel])

  return result.rows[0]
}
