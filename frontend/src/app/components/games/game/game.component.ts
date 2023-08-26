import {Component, OnInit, Output} from '@angular/core';
import {LobbiesService} from "../../utils/lobbies-service";
import {ActivatedRoute} from "@angular/router";
import {OAuthService} from "angular-oauth2-oidc";
import {Subscription} from "rxjs";
import {GamesService} from "../../utils/games-service";
import {SharedUrls} from "../../utils/shared-urls";
import {webSocket, WebSocketSubject} from "rxjs/webSocket";
import {GameDTO} from "../../utils/dto";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {

  private routeSub!: Subscription;

  gameSocket!: WebSocketSubject<any>;

  @Output() game!: GameDTO;

  gameId!: string;

  constructor(private lobbiesService: LobbiesService,
              private gamesService: GamesService,
              private route: ActivatedRoute,
              private oAuthService: OAuthService) {
  }


  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      this.gameId = params['id']
    });

    // this.lobbiesService.establishWebSocketConnectionToLobby(<string>localStorage.getItem('lobbyID'))

    this.establishWebSocketConnectionToGame(this.gameId)

  }

  establishWebSocketConnectionToGame(gameId: string) {
    let tokenQuery = `?token=${this.oAuthService.getIdToken()}`;
    let url = (`ws://${SharedUrls.GAME_CORE_SERVER}/${gameId}/${tokenQuery}`)

    this.gameSocket = webSocket(url);
    //TODO replace deprecated
    this.gameSocket.subscribe(
      // @ts-ignore
      message => this.handleGameCoreMessage(message),
      // @ts-ignore // TODO Better error hanlding ;)
      err => console.log(err),
      () => console.log('Closing WS connection to Lobby')
    );


  }

  private handleGameCoreMessage(message: any) {
    //TODO might use ws to update list, but just http refreshing is so much easier
    switch (message.event) {

      case "gameStarted":
      case "gameUpdated":
      case "gameEnded":
      case "lateJoined":
        this.updateGame(message.data.game)

        console.log("handling event for Game ", message.event, message)
        break;

      default: {
        console.log("Wrong event :", message.event)
        break;
      }
    }
  }

  private updateGame(game: any) {
    console.log("Updating game ", game)
    this.game = {
      participants: game.participants,
      state: game.state,
      status: game.status,
      type: game.type,
      meta: game.meta
    }
  }
}
