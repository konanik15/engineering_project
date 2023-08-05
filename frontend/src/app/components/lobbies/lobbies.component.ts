import {Component, OnInit} from '@angular/core';
import {LobbyDTO} from "../utils/dto";
import {MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';
import {JoinLobbyModalComponent} from "./join-lobby-modal/join-lobby-modal.component";
import {Router} from "@angular/router";
import {LobbiesService} from "../utils/lobbies-service";

type Game = {
  name: string;
  description: string;
};

@Component({
  selector: 'app-home',
  templateUrl: './lobbies.component.html',
  styleUrls: ['./lobbies.component.css'],
})
export class LobbiesComponent implements OnInit {

  constructor(public lobbiesService: LobbiesService, private modalService: MdbModalService, private router: Router) {
  }

  modalRef: MdbModalRef<JoinLobbyModalComponent> | null = null;

  displayedColumns: string[] = ['name', 'game', 'players/maxPlayers', 'join'];

  lobbies: LobbyDTO[] = []

  ngOnInit(): void {
    this.loadLobbies()

  };

  games: Readonly<Game[]> = [
    {name: 'Poker', description: 'Loose all your money'},
    {name: 'Durak', description: 'How do you even play this sh*t'},
    {name: 'Factorio', description: 'Launch the rocket get bitches'},
    {name: 'Dark Souls', description: 'DEX >>> SEX'},
    {name: 'Chess', description: 'Szacher matter'},
    {
      name: 'Star Realms',
      description:
        'Actually you need to have an IQ of over 200 to even understand how to play this game at the lowest possible level.',
    },
  ] as const;

  activeGames: Set<string> = new Set();

  toggleSelect(name: string) {
    if (this.activeGames.has(name)) {
      this.activeGames.delete(name);
    } else {
      this.activeGames.add(name);
    }
  }

  announceSortChange($event: any) {
    console.log("sort change")
  }

  joinLobby(lobby: LobbyDTO) {
    if (lobby.passwordProtected) {
      this.openModal(lobby)
    } else {
      //this.router.navigate(['/lobby'])
      const url = this.router.serializeUrl(
        this.router.createUrlTree([`/lobby/${lobby.id}`])
      );
      window.open(url, '_blank');
    }
  }

  openModal(lobby: LobbyDTO) {
    this.modalRef = this.modalService.open(JoinLobbyModalComponent, {
      data: {
        name: `${lobby.name} `,
        game: `${lobby.game}`,
        lobby: lobby
      },
      modalClass: 'modal-dialog-centered'
    });
  }

  createLobby() {
    console.log('creatingLobby')
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
}
