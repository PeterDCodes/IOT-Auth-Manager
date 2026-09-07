

export class AuthClient{

    constructor(){
        this.name = "test"
        this.age = 1
    }


    /**
    *Initializes a registration request
    * @return {string} secret
    */
    async requestRegistration(){

        //Checks if device already registered (a secret is available in secret path)
        //return secret

        const REGISTRAION_URL = "this needs to be read from an env?"
        //Otherwise make a request (device assumes it was not registered)
        const response = await axios.get(REGISTRAION_URL);

        return response.secret
    }
        



    //Refresh
    /**
    * Initializes a token refrsh request to API. Will return token on success
    * @return {string} secret
    */
    async requestRefresh(){
        const REFRESH_URL = "this needs to be read from an env?"
        //Otherwise make a request (device assumes it was not registered)
        const response = await axios.get(REFRESH_URL);
    }

}

/**
 * Auth Client is intended to be used in your library
 * Its job is to initialize and then handle the tasks for registration and token refresh
 * It also securely stores secret value 
 * 
 */
