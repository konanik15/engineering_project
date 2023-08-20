import {Component, OnInit} from '@angular/core';
import {LobbiesService} from "../../utils/lobbies-service";
import {ActivatedRoute} from "@angular/router";
import {OAuthService} from "angular-oauth2-oidc";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {

  private routeSub!: Subscription;

  constructor(private lobbiesService: LobbiesService,
              private route: ActivatedRoute,
              private oAuthService: OAuthService) {
  }

  // private game : GameDTO = undefined;

  ngOnInit(): void {
    let gameId = '';
    this.routeSub = this.route.params.subscribe(params => {
      gameId = params['id']
    });

    // this.lobbiesService.getLobby(gameId).subscribe({
    //   next: (lobby) => {
    //     this.game = lobby
    //     this.establishWebSocketConnection()
    //     if (this.lobby && this.socket) {
    //       this.refreshLobby()
    //     }
    //   },
    //   error: () => {
    //     console.log('Smth went wrong with getting lobby by Id ', lobbyId)
    //   }
    // })
  }
}
