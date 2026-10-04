import { writeFile, readFile } from 'node:fs/promises';
import axios from "axios";
import crypto from "crypto"


/**
 * A class that will help retrieve and store keys
 */
export class KeyManager {

    //Private Fields
    #storepath;
    #endpoint;


    /**
     * 
     * @param {string} storepath the intended path to store JWK
     * @param {stirng} endpoint the url of API for JWKS retrieval
     */
    constructor(storepath, endpoint) {
        this.#storepath = storepath;      // Public property initialized here
        this.#endpoint = endpoint;         // Private property initialized here
        this.FILENAME = "/jwks.json"
    }

    //Set Storepath
    set setStorepath(newStorepath){
        this.#storepath = newStorepath
    }
    //Set Endpoint
    set setEndpoint(newEndpoint){
        this.#endpoint = newEndpoint
    }

    /**
     * @param {json} jwk JSON web key set
     */
    async storeKey(jwk){
        //TODO Check jwk format
        await writeFile(
        this.#storepath + this.FILENAME,
        JSON.stringify(jwk, null, 2),
        "utf-8"
        );
        console.log('Key saved successfully!');
    }


    //FetchKey from API
    async fetchKey(){
        try{
            const response = await axios.get(this.#endpoint);
            const keys = response.data?.keys;

            if(!Array.isArray(keys) || keys.length === 0){
                throw new Error("Endpoint returned no public keys")
            }

            //Returns a single key
            return keys[0]
        }catch(error){
            throw new Error("Failed to fetch public key", { cause: error })
        }
    }
    
    //Check if Key is present or not
    async getKey(){
        try{
            const data = await readFile(
                this.#storepath + this.FILENAME, "utf-8"
            )

            return JSON.parse(data);
        }catch(error){
            if(error.code === "ENOENT"){
                return null
            }

            throw new Error("Failed to read stored public key", { cause: error })
        }
    }


    /**
     * Converts the stored JWK to a standard public key
    */
    async givePublicKey(){

        const key = await this.getKey()

        const publicKey = crypto.createPublicKey({
            //Uses first element of the list of keys. In future would need to fix if many jwks are given by server API
            key: key,
            format: "jwk"
        })
        return publicKey
    };


    /**
     * Fetch and store the key from the endpoint. Returns a public key
    */ 
    async fetchAndStore(){

        try{
            let key = await this.getKey();

            if(key === null){
                key = await this.fetchKey();
                await this.storeKey(key);
            }

            return crypto.createPublicKey({
                key,
                format: "jwk"
            })

        }catch(error){
            throw new Error("Failed to obtain public key", { cause: error })
        }
    }

}


export default KeyManager
