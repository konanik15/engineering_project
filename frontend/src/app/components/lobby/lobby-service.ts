import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {AppEndpoints} from '../utils/app.endpoints';
@Injectable({
  providedIn: 'root',
})
export class LobbyService {

  path: string = '/api'
  response: string = ""

  constructor(private http: HttpClient) {
  }

  sendMessage(): void {
    const params = new HttpParams().append('body', 'Epic message');
    params.append('responseType', 'text')

    this.http.get(this.path + '/rest/echo', {params, responseType: 'text'})
      .subscribe((e) => this.response = e)
  }

  getLobbies(): void {
    console.log('getting lobbies' + AppEndpoints.LOBBY)
  }



}
