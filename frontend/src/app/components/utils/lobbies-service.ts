import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {SharedUrls} from './shared-urls';
import {LobbyDTO, LobbyLiteDTO} from "./dto";
import {Observable} from "rxjs";
import {Router} from "@angular/router";
import {webSocket} from "rxjs/webSocket";
import {OAuthService} from "angular-oauth2-oidc";

@Injectable({
  providedIn: 'root',
})
export class LobbiesService {
  static get lobbySocket(): any {
    return this._lobbySocket;
  }

  static set lobbySocket(value: any) {
    this._lobbySocket = value;
  }

  public mainMenuSocket: any;

  private static _lobbySocket: any;

  constructor(private http: HttpClient,
              private router: Router,
              private oAuthService: OAuthService) {
  }

  getLobbies(): Observable<Array<LobbyDTO>> {
    return this.http.get<Array<LobbyDTO>>(`${SharedUrls.LOBBY_SERVER_HTTP}${SharedUrls.LOBBIES}`)
  }

  getLobby(lobbyId: string): Observable<LobbyDTO> {
    return this.http.get<LobbyDTO>(`${SharedUrls.LOBBY_SERVER_HTTP}${SharedUrls.LOBBY}/${lobbyId}`)
  }

  createLobby(lobbyDTO: LobbyDTO) {
    return this.http.post<LobbyLiteDTO>(`${SharedUrls.LOBBY_SERVER_HTTP}${SharedUrls.LOBBIES}`, lobbyDTO)
  }

  joinLobby(id: string) {
    let url: string;
    url = this.router.serializeUrl(
      this.router.createUrlTree([`/lobby/${id}`])
    );

    window.open(url, '_blank')?.focus();

  }

  establishWebSocketConnectionToMainMenu() {
    console.log('Connecting to lobbyService via WS for Main menu')

    let tokenQuery = `?token=${this.oAuthService.getIdToken()}`;
    let url = (`ws://${SharedUrls.LOBBY_SERVER}${SharedUrls.LOBBIES}/${tokenQuery}`)

    this.mainMenuSocket = webSocket(url);
  }

  establishWebSocketConnectionToLobby(lobbyId: string) {
    console.log('Connecting to lobby via WS')

    let tokenQuery = `?token=${this.oAuthService.getIdToken()}`;
    let passwordQuery = `&password=${localStorage.getItem('password')}`;
    let url = (`ws://${SharedUrls.LOBBY_SERVER}${SharedUrls.LOBBY}/${lobbyId}${tokenQuery}${passwordQuery}`)


    LobbiesService._lobbySocket = webSocket(url);
  }
}
