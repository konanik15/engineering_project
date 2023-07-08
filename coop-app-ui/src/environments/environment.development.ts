export const environment = {
  production: false,
  keycloak: {
    issuer: "http://localhost:10102/auth/realms/echo",
    redirectUri: "http://localhost:4200/",
    clientId: "echo",
    scope: "openid profile email offline_access"
  }
};
