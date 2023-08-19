import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Subscription} from "rxjs";
import {LobbyDTO} from "../utils/dto";
import {LobbiesService} from "../utils/lobbies-service";
import {OAuthService} from "angular-oauth2-oidc";
import {SharedUrls} from "../utils/shared-urls";
import {webSocket} from "rxjs/webSocket";


@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit, OnDestroy {
  get requiredAmountOfPlayers(): boolean {
    if (this.lobby.players) {
      return this.lobby.players.length >= this.lobby.minPlayers!
    }
    return false;
  }

  set requiredAmountOfPlayers(value: boolean) {
    this._requiredAmountOfPlayers = value;
  }

  private routeSub!: Subscription;

  socket: any;

  ready: boolean = false;

  lobby!: LobbyDTO;

  allReady: boolean = false;

  private _requiredAmountOfPlayers: boolean = false;

  constructor(private lobbiesService: LobbiesService,
              private route: ActivatedRoute,
              private oAuthService: OAuthService) {
  }


  ngOnInit(): void {
    let lobbyId = '';
    this.routeSub = this.route.params.subscribe(params => {
      lobbyId = params['id']
    });

    this.lobbiesService.getLobby(lobbyId).subscribe({
      next: (lobby) => {
        this.lobby = lobby
        this.establishWebSocketConnection()
        if (this.lobby && this.socket) {
          this.refreshLobby()
        }
      },
      error: () => {
        console.log('Smth went wrong with getting lobby by Id ', lobbyId)
      }
    })
  }

  private determineIfPlayerIsReady() {
    if (this.lobby?.players) {
      let userClaims: any = this.oAuthService.getIdentityClaims()

      return this.lobby.players.find(player => player.name === userClaims.family_name)?.ready;
    }
    return false
  }

  private establishWebSocketConnection() {
    console.log('Connecting to lobbyService via WS')

    let tokenQuery = `?token=${this.oAuthService.getIdToken()}`;
    let passwordQuery = `&password=${localStorage.getItem('password')}`;
    let url = (`ws://${SharedUrls.LOBBY_SERVER}${SharedUrls.LOBBY}/${this.lobby._id}${tokenQuery}${passwordQuery}`)

    this.socket = webSocket(url);

    this.socket.subscribe(
      // @ts-ignore
      msg => this.handleMessage(msg),
      // @ts-ignore // TODO Better error hanlding ;)
      err => console.log(err),
      () => console.log('Closing WS connection to Lobby')
    );
  }

  private handleMessage(message: any) {
    //TODO might use ws to update list, but just http refreshing is so much easier
    switch (message.type) {

      case "playerJoined":
      case "newMessage":
      case "playerReady":
      case "playerUnready":
      case "joinResult":
      case "gameEnded":
      case "startGameResult":
      case "readyResult":
        this.refreshLobby()
        console.log("Handling ws message from LobbyService", (message.type))
        break;

      case "messageResult":
        console.log("Message type:", message.type, "handled by other listeners")
        break;

      case "gameStarted":
        console.log("gameStarted for lobby ", message.data.gameId)
        break;

      default: {
        console.log("Wrong message type:", message.type)
        break;
      }
    }
  }

  ngOnDestroy() {
    this.socket.complete();
    this.routeSub.unsubscribe();
  }

  revertReady() {
    this.ready = !this.ready;
    let status: string;
    if (this.ready) {
      status = "ready"
    } else {
      status = 'unready'
    }
    this.socket.next({
      "type": status
    })
  }

  private refreshLobby() {
    this.lobbiesService.getLobby(<string>this.lobby._id).subscribe({
      next: (lobby) => {
        this.lobby = lobby
        if (this.lobby.players?.length! > 0) {
          this.determineIfPlayerIsReady()
        }
        this.checkIfAllPlayersAreReady()
      },
      error: () => {
        console.log('Smth went wrong with getting lobby by Id ', this.lobby._id)
      }
    })
  }

  private checkIfAllPlayersAreReady() {
    if (this.lobby.players) {
      this.allReady = this.lobby.players.every(player => {
        return player.ready
      })
    }
  }

  startGame() {
    console.log("Starting game!")
    this.socket.next({
      "type": "startGame"
    })
  }

}
