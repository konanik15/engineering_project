export const environment = {
  production: false,
  keycloak: {
    issuer: "http://localhost:8080/auth/realms/engineeringProject",
    redirectUri: "http://localhost:4200/",
    clientId: "frontend",
    scope: "openid profile email offline_access"
  }
};
