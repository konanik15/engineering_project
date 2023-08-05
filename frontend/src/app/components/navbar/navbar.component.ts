import {Component, OnInit} from '@angular/core';
import {OAuthService} from "angular-oauth2-oidc";
import {authCodeFlowConfig} from "../../sso-config";
import {JwksValidationHandler} from "angular-oauth2-oidc-jwks";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavbarComponent implements OnInit {

  name: string = "";

  constructor(private oAuthService: OAuthService) {
  }

  get token() {
    let claims: any = this.oAuthService.getIdentityClaims();
    return claims ? claims : null;
  }

  ngOnInit(): void {
    this.configureSingleSignOn();
    const userClaims: any = this.oAuthService.getIdentityClaims();
    if (userClaims) {
      this.name = userClaims.family_name ? userClaims.family_name : "Anonim";
    } else {
      console.log('User is not logged in yet')
    }
  }

  configureSingleSignOn() {
    this.oAuthService.configure(authCodeFlowConfig);
    this.oAuthService.tokenValidationHandler = new JwksValidationHandler();
    this.oAuthService.loadDiscoveryDocumentAndTryLogin();
  }

  login() {
    this.oAuthService.initCodeFlow();
  }

  logout() {
    this.oAuthService.logOut();
  }
}
