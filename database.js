import { DatabaseSync } from 'node:sqlite';
const database = new DatabaseSync('devices.db');


export const addDevice=(id, serial, mac_addr, device_ip, hashed_key)=>{
    // // Create a prepared statement to insert data into the database.
    const insert = database.prepare('INSERT INTO devices (id, serial, mac_addr, device_ip, key) VALUES (?, ?, ?, ?, ?)');
    // // Execute the prepared statement with bound values.
    insert.run(id, serial, mac_addr, device_ip, hashed_key);
}



//Method to create the devices table
const createDeviceTable=(database)=>{
    database.exec(`
    CREATE TABLE devices(
        id INTEGER PRIMARY KEY,
        serial TEXT,
        mac_addr TEXT,
        device_ip TEXT,
        hashed_key TEXT
    ) STRICT
    `);
}


//Method to query all devices in the table
const getDevices=(database)=>{
    // Create a prepared statement to read data from the database.
    const query = database.prepare('SELECT * FROM devices ORDER BY key');
    // Execute the prepared statement and log the result set.
    console.log(query.all());
}

