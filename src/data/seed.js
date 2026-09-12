import { readFile } from "node:fs/promises"
import database from "./database.js"

const seedPath = new URL("./seed.sql", import.meta.url)

try {
  const seedSql = await readFile(seedPath, "utf8")
  await database.query(seedSql)
  console.log("PostgreSQL schema created successfully")
} catch (error) {
  console.error(`Failed to create PostgreSQL schema: ${error.message}`)
  process.exitCode = 1
} finally {
  await database.end()
}
