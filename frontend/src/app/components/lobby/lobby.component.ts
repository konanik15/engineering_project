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

  private routeSub!: Subscription;

  private socket: any;

  ready: boolean = false;

  lobby!: LobbyDTO;

  title = 'angular8-springboot-websocket';

  constructor(private lobbiesService: LobbiesService,
              private route: ActivatedRoute,
              private oAuthService: OAuthService) {
  }


  ngOnInit(): void {
    let lobbyId = '';
    this.routeSub = this.route.params.subscribe(params => {
      lobbyId = params['id']//log the value of id
    });

    this.lobbiesService.getLobby(lobbyId).subscribe({
      next: (value) => {
        this.lobby = value
        this.establishWebSocketConnection()
      },
      error: () => {
        console.log('Smth went wrong with getting lobby by Id ', lobbyId)
      }
    })
  }

  playerIsReady(player: any) {
    let foundPlayer = this.lobby.players?.find(player => player.wsId === player.wsId)
    console.log("checking player", player)
    return foundPlayer ? foundPlayer.ready : false

  }

  private establishWebSocketConnection() {
    console.log('Connecting to lobbyService via WS')

    let tokenQuery = `?token=${this.oAuthService.getIdToken()}`;
    let url = (`ws://${SharedUrls.LOBBY_SERVER}${SharedUrls.LOBBY}/${this.lobby._id}${tokenQuery}`)

    this.socket = webSocket(url);

    this.socket.subscribe(
      // @ts-ignore
      msg => this.handleMessage(msg),
      // @ts-ignore
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
      case "gameEnded":
        this.refreshLobby()
        console.log("Handling ws message from LobbyService", (message.type))
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
    console.log('Im :', status)
    this.socket.next({
      "type": status
    })
  }

  private refreshLobby() {
    this.lobbiesService.getLobby(<string>this.lobby._id).subscribe({
      next: (value) => {
        this.lobby = value
      },
      error: () => {
        console.log('Smth went wrong with getting lobby by Id ', this.lobby.id)
      }
    })
  }
}
