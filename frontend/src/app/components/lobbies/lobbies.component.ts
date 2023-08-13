import {Component, OnInit} from '@angular/core';
import {LobbyDTO} from "../utils/dto";
import {MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';
import {JoinLobbyModalComponent} from "./join-lobby-modal/join-lobby-modal.component";
import {Router} from "@angular/router";
import {LobbiesService} from "../utils/lobbies-service";
import {CreateLobbyModalComponent} from "./create-lobby-modal/create-lobby-modal.component";
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
  tempLobbyId: string = '';

  private socket: any;

  ngOnInit(): void {
    this.loadLobbies()
    this.lobbiesService.establishWebSocketConnectionToMainMenu()
    this.lobbiesService.socket.subscribe(
      // @ts-ignore // TODO mby some type handling
      message => this.handleMessage(message),
      // @ts-ignore
      err => console.log(err),
      () => console.log('Connection with lobbyService is closed')
    );
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
      this.lobbiesService.joinLobby(<string>lobby._id)
    }
  }

  openPasswordModal(lobby: LobbyDTO) {
    this.joinLobbyModalRef = this.modalService.open(JoinLobbyModalComponent, {
      data: {
        lobbyId: `${lobby._id}`,
      },
      modalClass: 'modal-dialog-centered'
    });
    this.tempLobbyId = <string>lobby._id

    this.joinLobbyModalRef.component.socket = this.socket;
  }

  createLobby() {
    this.openCreateLobbyModal()
    console.log('creatingLobby')
  }

  openCreateLobbyModal() {
    this.createLobbyModalRef = this.modalService.open(CreateLobbyModalComponent, {
      modalClass: 'modal-dialog-centered'
    });
  }


  refreshLobbiesList() {
    this.loadLobbies()
  }

  private loadLobbies() {
    this.lobbiesService.getLobbies().subscribe({
      next: (value) => {
        this.lobbies = value
      },
      error: () => {
        console.log('Smth went wrong with getting lobbies')
      }
    })
  }

  private handleMessage(message: any) {
    //TODO might use ws to update list, but just http refreshing is so much easier
    switch (message.type) {
      case "lobbyCreated":
      case "lobbyDeleted":
      case "playerJoined":
      case "playerLeft":
      case "startGameResult":
      case "lobbyPending":

        this.refreshLobbiesList()
        console.log("Handling ws message from LobbyService", (message.type))
        break;

      case "passwordValidationResult":
        if (message.data.isValid) {
          console.log("goodPass", message)
          this.lobbiesService.joinLobby(this.tempLobbyId)

        } else {
          console.log("badPass")
        }
        break;

      default: {
        console.log("Wrong message type")
        break;
      }
    }
  }
}
