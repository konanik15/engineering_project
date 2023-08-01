export const environment = {
  production: false,
  keycloak: {
    issuer: "http://localhost:10100/auth/realms/cardz",
    redirectUri: "http://localhost:4200/",
    clientId: "cardz",
    scope: "openid profile email offline_access"
  }
};
