import {Injectable} from "@angular/core";
import {HttpClient, HttpParams} from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class HomeService {

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
}
