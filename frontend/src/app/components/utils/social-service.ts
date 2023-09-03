import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {OAuthService} from "angular-oauth2-oidc";

@Injectable({
  providedIn: 'root'
})
export class SocialService {


  public socialSocket: any;

  constructor(private http: HttpClient,
              private router: Router,
              private oAuthService: OAuthService) {
  }

}
