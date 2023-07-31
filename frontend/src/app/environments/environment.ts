export const environment = {
    production: true,
    azure: {
        issuer: "https://idsvr4.azurewebsites.net",
        clientId: "spa",
        scope: "openid profile email offline_access"
    }
};
