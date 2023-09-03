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


    private _name?: string;

    constructor(private oAuthService: OAuthService) {
    }

    get token() {
        let claims: any = this.oAuthService.getIdentityClaims();
        return claims ? claims : null;
    }

    get name(): string {
        const userClaims: any = this.oAuthService.getIdentityClaims();
        if (userClaims) {
            return userClaims.family_name;
        }
        return ""
    }

    ngOnInit(): void {
        this.configureSingleSignOn();
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
