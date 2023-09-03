import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {OAuthService} from "angular-oauth2-oidc";
import {Observable} from "rxjs";
import {LobbyDTO} from "./dto";
import {SharedUrls} from "./shared-urls";

@Injectable({
  providedIn: 'root'
})
export class SocialService {


  public socialSocket: any;

  constructor(private http: HttpClient,
              private router: Router,
              private oAuthService: OAuthService) {
  }

  getAvatar(username: string): Observable<Blob> {
    return this.http.get<Blob>(`${SharedUrls.SOCIAL_SERVER_HTTP}/${SharedUrls.PROFILE}/${username}/${SharedUrls.AVATAR}`)
  }

}
