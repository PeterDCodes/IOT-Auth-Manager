
//Set up initial SQLite DB
import database from "./database.js";

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
            hashed_key TEXT
        ) STRICT
        `);
    }catch(error){
        console.log("Error creating devices table: " + error.message)
    }

}

createDeviceTable(database)