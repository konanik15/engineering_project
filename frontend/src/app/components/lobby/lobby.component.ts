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
      complete: () => {
        console.log('Completed getting lobby')
      },
      next: (value) => {
        this.lobby = value
        this.establishWebSocketConnection()
      },
      error: () => {
        console.log('Smth went wrong with getting lobby by Id ', lobbyId)
      }
    })
  }

  private establishWebSocketConnection() {
    console.log('connecting to lobbyService via WS')

    let tokenQuery = `?token=${this.oAuthService.getIdToken()}`;
    let url = (`ws://${SharedUrls.LOBBY_SERVER}${SharedUrls.LOBBY}/${this.lobby.id}${tokenQuery}`)

    this.socket = webSocket(url);

    this.socket.subscribe(
      // @ts-ignore
      msg => console.log('message received: ' + msg), // Called whenever there is a message from the server.
      // @ts-ignore
      err => console.log(err), // Called if at any point WebSocket API signals some kind of error.
      () => console.log('complete') // Called when connection is closed (for whatever reason).
    );
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

}
