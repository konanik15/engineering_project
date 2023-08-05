import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {SharedUrls} from './shared-urls';
import {LobbyDTO} from "./dto";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class LobbiesService {


  constructor(private http: HttpClient) {
  }

  getLobbies(): Observable<Array<LobbyDTO>> {
    return this.http.get<Array<LobbyDTO>>(`${SharedUrls.LOBBY_SERVER_HTTP}${SharedUrls.LOBBIES}`)
  }

  getLobby(lobbyId: string): Observable<LobbyDTO> {
    return this.http.get<LobbyDTO>(`${SharedUrls.LOBBY_SERVER_HTTP}${SharedUrls.LOBBY}/${lobbyId}`)
  }

}
