import database from "../../data/database.js"

export const getDeviceDeployments=async()=>{
  const result = await database.query(`
    SELECT cd_deployment, dt_record, device_uuid, cd_location,
      cd_production_line, ds_project, ds_owner
    FROM device_deployment
    ORDER BY cd_deployment
  `)

  return result.rows
}

export const getDeviceDeploymentById=async(cdDeployment)=>{
  const result = await database.query(`
    SELECT cd_deployment, dt_record, device_uuid, cd_location,
      cd_production_line, ds_project, ds_owner
    FROM device_deployment
    WHERE cd_deployment = $1
  `, [cdDeployment])

  return result.rows[0]
}
