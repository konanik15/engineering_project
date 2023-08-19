import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {GameLiteDTO} from "./dto";
import {SharedUrls} from "./shared-urls";
import {webSocket} from "rxjs/webSocket";
import {Router} from "@angular/router";
import {OAuthService} from "angular-oauth2-oidc";

@Injectable({
  providedIn: 'root'
})
export class GamesService {

  socket: any;

  constructor(private http: HttpClient,
              private router: Router,
              private oAuthService: OAuthService) {
  }

  getGames(): Observable<Array<GameLiteDTO>> {
    return this.http.get<Array<GameLiteDTO>>(`${SharedUrls.GAME_CORE_SERVER_HTTP}`)
  }

  joinGame(id: string) {
    let url: string;
    url = this.router.serializeUrl(
      this.router.createUrlTree([`/game/${id}`])
    );

    window.open(url, '_blank')?.focus();

  }

  establishWebSocketConnectionToGame() {
    console.log('Connecting to gameCo via WS for Main menu')

    let tokenQuery = `?token=${this.oAuthService.getIdToken()}`;
    let url = (`ws://${SharedUrls.GAME_CORE_SERVER}${SharedUrls.LOBBIES}/${tokenQuery}`)

    this.socket = webSocket(url);

  }

}
