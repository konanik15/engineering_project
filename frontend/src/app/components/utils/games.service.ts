import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {GameLiteDTO} from "./dto";
import {SharedUrls} from "./shared-urls";

@Injectable({
  providedIn: 'root'
})
export class GamesService {

  constructor(private http: HttpClient) {
  }

  getGames(): Observable<Array<GameLiteDTO>> {
    return this.http.get<Array<GameLiteDTO>>(`${SharedUrls.GAME_CORE_SERVER_HTTP}`)
  }

}
