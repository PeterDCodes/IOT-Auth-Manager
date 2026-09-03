import { DatabaseSync } from 'node:sqlite';
const database = new DatabaseSync('devices.db');

export default database;