import { readFile } from "node:fs/promises"
import database from "./database.js"
import logger from "../utils/logging.js"


const seedPath = new URL("./seed.sql", import.meta.url)

try {
  const seedSql = await readFile(seedPath, "utf8")
  await database.query(seedSql)
  logger.info("PostgreSQL schema created successfully")
} catch (error) {
  logger.error(`Failed to create PostgreSQL schema: ${error.message}`)
  process.exitCode = 1
} finally {
  await database.end()
}
