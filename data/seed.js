
//SEED methods to set up initial SQLite DB and set a test client
import fs from 'node:fs'
import database from "./database.js";
import { registerNewDevice } from "./devices.js"


//Method to create the devices table
const createDeviceTable=(database)=>{
    try{
        database.exec(`
        CREATE TABLE devices(
            id INTEGER PRIMARY KEY,
            name TEXT,
            serial TEXT,
            mac_addr TEXT,
            device_ip TEXT,
            hashed_key TEXT,
            dt_created TEXT,
            dt_modified TEXT,
            active INTEGER
        ) STRICT
        `);
    }catch(error){
        console.log("Error creating devices table: " + error.message)
    }

}

//Builds and writes a seeded client for testing
//Helper to write Seeded Test Key
const saveKey=(secret)=>{
    fs.writeFileSync('TestKey.txt', secret);
}

const SEED_CLIENT = {
    "id" : 0,
    "name": "SeedClient",
    "serial" : "00000",
    "mac_addr" : "00000",
    "device_ip" : "0.0.0.0"
}

//Register Client
export const seedClient=async()=>{
    try{
        const secret = await registerNewDevice(SEED_CLIENT);
        //Save its key by writing to CSV
        saveKey(secret);
    }catch(error){
        console.log(`ERROR - Failed to register seed client: ${error.message}`);
    }
}



//Run Seed
createDeviceTable(database)
await seedClient();