import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {GameLiteDTO} from "./dto";
import {SharedUrls} from "./shared-urls";
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class GamesService {

  socket: any;

  constructor(private http: HttpClient,
              private router: Router) {
  }

  getGames(): Observable<Array<GameLiteDTO>> {
    return this.http.get<Array<GameLiteDTO>>(`${SharedUrls.GAME_CORE_SERVER_HTTP}`)
  }

  openGameComponent(id: string) {
    let url: string;
    url = this.router.serializeUrl(
      this.router.createUrlTree([`/game/${id}`])
    );

    // window.open(url, '_blank')?.focus();
    this.router.navigateByUrl(url)
  }

}
