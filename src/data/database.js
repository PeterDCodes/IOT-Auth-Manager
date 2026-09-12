import pg from "pg"
import "dotenv/config"

const { Pool } = pg
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is required")
}

const database = new Pool({ connectionString })

export const verifyDatabaseConnection=async()=>{
  await database.query("SELECT 1")
}

export default database
