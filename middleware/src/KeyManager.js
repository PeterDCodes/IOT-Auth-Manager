import { writeFile, readFile } from 'node:fs/promises';
import axios from "axios";


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
        const response = await axios.get(this.#endpoint);
        const {keys} = response.data;
        //Returns a single key
        return keys
    }
    
    //Check if Key is present or not
    async getKey(){
        //If the JSON file exists at path then true else false
        const data = await readFile(
            this.#storepath + this.FILENAME, "utf-8"
        )

        const jwk = JSON.parse(data);

        if(jwk == null){
            return null
        }else{
            return jwk
        }
    }


    /**
     * Converts the stored JWK to a standard public key
    */
    async givePublicKey(){

        const key = await this.getKey()

        const publicKey = crypto.createPublicKey({
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
            const keys = await this.fetchKey();
            await this.storeKey(keys);
            const publicKey = await this.givePublicKey()
            return publicKey
        }catch(error){
            throw new Error(`Failed to fetch and store target jwks: ${error.message}`)
            
        }
    }

}


export default KeyManager
