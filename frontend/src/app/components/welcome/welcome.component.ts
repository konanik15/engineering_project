import {Component, OnInit} from '@angular/core';
import {OAuthService} from "angular-oauth2-oidc";
import {authCodeFlowConfig} from "../../sso-config";
import {JwksValidationHandler} from "angular-oauth2-oidc-jwks";

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  name: string = "";

  constructor(
    public oAuthService: OAuthService) {
  }

  ngOnInit(): void {
    this.configureSingleSignOn();
  }

  getUserName(): any {
    const userClaims: any = this.oAuthService.getIdentityClaims();
    if (userClaims) {
      return userClaims.family_name ? userClaims.family_name : "Anonim";
    }
  }

  configureSingleSignOn() {
    this.oAuthService.configure(authCodeFlowConfig);
    this.oAuthService.tokenValidationHandler = new JwksValidationHandler();
    this.oAuthService.loadDiscoveryDocumentAndTryLogin();
  }


  get token() {
    let claims: any = this.oAuthService.getIdentityClaims();
    return claims ? claims : null;
  }

  login() {
    this.oAuthService.initCodeFlow();
  }
}


