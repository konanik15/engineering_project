const axios = require("axios");
const jwt = require('jsonwebtoken');
let publicKey;

const kcRealm = process.env.KEYCLOAK_REALM;
const kcHost = process.env.KEYCLOAK_HOST;
const kcPort = process.env.KEYCLOAK_PORT || "8080";
const kcUserAPIAccess = process.env.KEYCLOAK_REQUIRE_USER_API_ACCESS ? 
    ["1", "true"].includes(process.env.KEYCLOAK_REQUIRE_USER_API_ACCESS.toLowerCase()) :
    false;

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
            req.token = token;
            req.username = req.decoded_token.preferred_username;
        } catch (error) {
            return res.status(401).send(error.message);
        }

        if (kcUserAPIAccess)
            try { await userExists("dummy", req.token); }
            catch (error) {
                return res.status(401).send("Token does not have access to kc user api");
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
            req.token = token;
            req.username = req.decoded_token.preferred_username;
        } catch (error) {
            return connection.close(1008, error.message);
        }

        if (kcUserAPIAccess)
            try { await userExists("dummy", req.token); }
            catch (error) {
                return connection.close(1008, "Token does not have access to kc user api");
            }
    
        return next();
    }
}

async function userExists(username, token) {
    try {
        let response = await axios.get(`http://${kcHost}:${kcPort}/auth/admin/realms/${kcRealm}/users`, {
            params: {
                username
            },
            headers: {
                Authorization: `Bearer ${token}`,
                Host: verifyToken(token).iss.match(/(?<=https?:\/\/)[^/]+/)[0] //this is an ugly kludge to solve kc 401 issue
            }
        });

        if (response.status !== 200 || !Array.isArray(response.data))
            throw new Error("Invalid response");
        
        return response.data.length !== 0;
    } catch (e) {
        throw new Error("Unable to verify user existence", { cause: e });
    }
}

module.exports = { init, protectHTTP, protectWS, userExists };
