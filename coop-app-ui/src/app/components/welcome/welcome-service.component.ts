import {Injectable} from "@angular/core";
import {HttpClient, HttpParams} from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class WelcomeService {

  path: string = 'http://localhost:10100'

  constructor(private http: HttpClient) {
  }

  getMessage(): string {
    const params = new HttpParams().append('param', 'Epic message');
    this.http.get<string>(this.path + '/rest/echo', {params}).subscribe(
      e => {
        return e;
      }
    )
    return "oops smth went wrong ;)"
  }
}
