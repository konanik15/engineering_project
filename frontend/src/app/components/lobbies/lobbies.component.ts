import {Component, OnInit} from '@angular/core';
import {LobbyDTO} from "../utils/dto";
import {MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';
import {JoinLobbyModalComponent} from "./join-lobby-modal/join-lobby-modal.component";
import {Router} from "@angular/router";
import {LobbiesService} from "../utils/lobbies-service";
import {CreateLobbyModalComponent} from "./create-lobby-modal/create-lobby-modal.component";
import {SharedUrls} from "../utils/shared-urls";
import {webSocket} from "rxjs/webSocket";
import {OAuthService} from "angular-oauth2-oidc";

@Component({
  selector: 'app-home',
  templateUrl: './lobbies.component.html',
  styleUrls: ['./lobbies.component.css'],
})
export class LobbiesComponent implements OnInit {

  constructor(public lobbiesService: LobbiesService,
              private modalService: MdbModalService,
              private router: Router,
              private oAuthService: OAuthService) {
  }

  joinLobbyModalRef: MdbModalRef<JoinLobbyModalComponent> | null = null;

  createLobbyModalRef: MdbModalRef<CreateLobbyModalComponent> | null = null;

  displayedColumns: string[] = ['name', 'game', 'players/maxPlayers', 'join'];

  lobbies: LobbyDTO[] = []

  private socket: any;

  ngOnInit(): void {
    this.loadLobbies()
    this.establishWebSocketConnectionToMainMenu()
  };

  // TODO lobby filtering and sorting
  announceSortChange($event: any) {
    console.log("sort change")
  }

  joinLobby(lobby: LobbyDTO) {
    console.log('lobby: ', lobby)
    if (lobby.passwordProtected) {
      this.openPasswordModal(lobby)
    } else {
      //this.router.navigate(['/lobby'])
      const url = this.router.serializeUrl(
        this.router.createUrlTree([`/lobby/${lobby.id}`])
      );
      window.open(url, '_blank');
    }
  }

  openPasswordModal(lobby: LobbyDTO) {
    this.joinLobbyModalRef = this.modalService.open(JoinLobbyModalComponent, {
      data: {
        id: `${lobby.id}`,
        name: `${lobby.name} `,
        game: `${lobby.game}`,
        lobby: lobby
      },
      modalClass: 'modal-dialog-centered'
    });
  }

  createLobby() {
    this.openCreateLobbyModal()
    console.log('creatingLobby')
  }

  openCreateLobbyModal() {
    this.createLobbyModalRef = this.modalService.open(CreateLobbyModalComponent, {
      data: {
        socket: this.socket
      },
      modalClass: 'modal-dialog-centered'
    });
  }


  refreshLobbiesList() {
    this.loadLobbies()
  }

  private loadLobbies() {
    this.lobbiesService.getLobbies().subscribe({
      complete: () => {
        console.log('Completed getting lobbies')
      },
      next: (value) => {
        this.lobbies = value
      },
      error: () => {
        console.log('Smth went wrong with getting lobbies')
      }
    })
  }

  private establishWebSocketConnectionToMainMenu() {
    console.log('Connecting to lobbyService via WS for Main menu')

    let tokenQuery = `?token=${this.oAuthService.getIdToken()}`;
    let url = (`ws://${SharedUrls.LOBBY_SERVER}${SharedUrls.LOBBIES}/${tokenQuery}`)

    this.socket = webSocket(url);

    this.socket.subscribe(
      // @ts-ignore
      msg => console.log('message received: ' + msg), // Called whenever there is a message from the server.
      // @ts-ignore
      err => console.log(err), // Called if at any point WebSocket API signals some kind of error.
      () => console.log('complete') // Called when connection is closed (for whatever reason).
    );
  }
}
