const axios = require("axios");
const jwt = require('jsonwebtoken');
let publicKey;

const kcRealm = process.env.KEYCLOAK_REALM;
const kcHost = process.env.KEYCLOAK_HOST;
const kcPort = process.env.KEYCLOAK_PORT || "8080";

async function init() {
    if (!kcRealm || !kcHost)
        throw new Error("Keycloak environment variables are missing. KEYCLOAK_REALM and KEYCLOAK_HOST are required.");

    console.log("Obtaining public key from keycloak...");
    while (!publicKey) {
        await axios.get(`http://${kcHost}:${kcPort}/auth/realms/${kcRealm}`)
        .then((response) => {
            if (response.status !== 200 || !response.data || !response.data.public_key)
                throw new Error("Invalid kc response", { cause: response });
            // wouldn't work without explicitly adding header and trailer. maybe there's a more elegant way to do it?
            publicKey = "-----BEGIN PUBLIC KEY-----\n" + response.data.public_key + "\n-----END PUBLIC KEY-----";
        })
        .catch((error) => {
            console.error("Could not obtain public key:\n", error.message || error);
        });
        if (!publicKey) {
            console.log("Retrying in 5 sec...");
            await new Promise(resolve => setTimeout(resolve, 5000)); //wait 5 sec
        }
    }
}

function verifyToken(token) {
    try {
        return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } catch (error) {
        throw new Error(error.message.replace(/^JsonWebTokenError:\s+/, ""));
    }
}

function protectHTTP() {
    return async (req, res, next) => {
        let token = req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/, "") : null;
        if (!token)
            return res.status(401).send("token not included");
        
        try {
            req.decoded_token = verifyToken(token);
        } catch (error) {
            return res.status(401).send(error.message);
        }
        
        return next();
    }
}

function protectWS() {
    return async (connection, req, next) => {
        // Not all clients or browsers may allow to include additional headers to an HTTP request during a handshake
        // This is why including a token is also allowed here as a query
        let token = req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/, "") : req.query.token;
    
        // Not all clients or browsers may handle 401/403 HTTP upgrade responses well
        // This is why the connection is allowed to be established and then it is closed with an appropriate WS code
        if (!token)
            return connection.close(1008, "token not included");
    
        try {
            req.decoded_token = verifyToken(token);
        } catch (error) {
            return connection.close(1008, error.message);
        }
    
        return next();
    }
}

module.exports = { init, protectHTTP, protectWS };
