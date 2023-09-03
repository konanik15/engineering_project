import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {ProfileDTO} from "../utils/dto";
import {SharedUrls} from "../utils/shared-urls";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private http: HttpClient,
              private router: Router) {
  }


  getProfile(username: string): Observable<ProfileDTO> {
    return this.http.get<ProfileDTO>(`${SharedUrls.SOCIAL_SERVER_HTTP}/${SharedUrls.PROFILE}/${username}`)
  }

}
