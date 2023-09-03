import {Component, OnInit, ViewChild} from '@angular/core';
import {LobbyDTO} from "../utils/dto";
import {MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';
import {JoinLobbyModalComponent} from "./join-lobby-modal/join-lobby-modal.component";
import {LobbiesService} from "../utils/lobbies-service";
import {CreateLobbyModalComponent} from "./create-lobby-modal/create-lobby-modal.component";
import {LiveAnnouncer} from "@angular/cdk/a11y";
import {MatSort, Sort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";

@Component({
  selector: 'app-home',
  templateUrl: './lobbies.component.html',
  styleUrls: ['./lobbies.component.css'],
})
export class LobbiesComponent implements OnInit {


  constructor(private lobbiesService: LobbiesService,
              private modalService: MdbModalService,
              private _liveAnnouncer: LiveAnnouncer) {
  }

  joinLobbyModalRef: MdbModalRef<JoinLobbyModalComponent> | null = null;

  createLobbyModalRef: MdbModalRef<CreateLobbyModalComponent> | null = null;

  displayedColumns: string[] = ['name', 'game', 'players/maxPlayers', 'join'];


  lobbies: LobbyDTO[] = []
  tempLobbyId: string = '';
  dataSource = new MatTableDataSource(this.lobbies);

  @ViewChild(MatSort) sort?: MatSort;


  private socket: any;

  ngOnInit(): void {
    this.loadLobbies()
    this.lobbiesService.establishWebSocketConnectionToMainMenu()
    this.lobbiesService.mainMenuSocket.subscribe(
      // @ts-ignore
      message => this.handleMessage(message),
      // @ts-ignore
      err => console.log(err),
      () => console.log('Connection with lobbyService is closed')
    );
  };

  // TODO lobby filtering and sorting
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  joinLobby(lobby: LobbyDTO) {
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
          this.lobbiesService.joinLobby(this.tempLobbyId)
          this.joinLobbyModalRef?.close()

        }
        break;

      default: {
        console.log("Wrong message type", message)
        break;
      }
    }
  }
}
