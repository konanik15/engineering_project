export const environment = {
  production: false,
  keycloak: {
    issuer: "http://localhost:10102/auth/realms/engineeringProject",
    redirectUri: "http://localhost:4200/",
    clientId: "frontend",
    scope: "openid profile email offline_access"
  }
};
