import pg from "pg"
import "dotenv/config"

const { Pool } = pg
const requiredDatabaseVariables = [
  "PGHOST",
  "PGPORT",
  "PGDATABASE",
  "PGUSER",
  "PGPASSWORD"
]
const missingDatabaseVariables = requiredDatabaseVariables.filter((name) => !process.env[name])

if (missingDatabaseVariables.length > 0) {
  throw new Error(`Missing PostgreSQL configuration: ${missingDatabaseVariables.join(", ")}`)
}

const database = new Pool()

export const verifyDatabaseConnection=async()=>{
  await database.query("SELECT 1")
}

export default database
