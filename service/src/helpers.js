import { getDeviceBySerial, getDeviceByName } from "./data/devices.js"
import { isIP } from "node:net"

export const validateDevice=async (name, serial, mac_addr, device_ip)=>{

    //check Name
    await checkName(name)
    //check Serial
    await checkSerial(serial)
    //check mac
    checkMac(mac_addr)
    //check ip
    checkIp(device_ip)
}

const checkName=async(name)=>{
    //Get device bny name. I dont want duplicates
    //throw error if a value came back becaus eI do not wnt duplicated names case insensitive
    if(typeof name !== "string" || !/^[a-zA-Z0-9]+$/.test(name)){
        throw new Error("Device name must only contain letters and numbers")
    }

    const device = await getDeviceByName(name)
    if(device){
        throw new Error("Device name already exists")
    }

    //Name can not contain spaces or special chars
}

const checkSerial=async(serial)=>{
    //must be a string between 6 and 24 chars. can ntot have spaces
    if(typeof serial !== "string" || serial.length < 6 || serial.length > 24 || /\s/.test(serial)){
        throw new Error("Device serial must be a string between 6 and 24 characters without spaces")
    }

    const device = await getDeviceBySerial(serial)
    if(device){
        throw new Error("Device serial already exists")
    }
}

const checkMac=(mac)=>{
    //must be valid MAC addr
    if(typeof mac !== "string" ||
        (!/^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/.test(mac) &&
        !/^([0-9a-fA-F]{2}-){5}[0-9a-fA-F]{2}$/.test(mac))){
        throw new Error("Device MAC address is invalid")
    }
}

const checkIp=(ip)=>{
    //must be valid ip addr
    if(typeof ip !== "string" || isIP(ip) === 0){
        throw new Error("Device IP address is invalid")
    }
}
