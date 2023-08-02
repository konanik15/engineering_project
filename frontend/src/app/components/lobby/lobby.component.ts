import {Component, OnInit} from '@angular/core';
import {LobbyService} from './lobby-service';
import {LobbyDTO} from "../utils/dto";
import {JoinLobbyModalComponent} from "./join-lobby-modal/join-lobby-modal.component";
import {MatDialog} from "@angular/material/dialog";

type Game = {
  name: string;
  description: string;
};

@Component({
  selector: 'app-home',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css'],
})
export class LobbyComponent implements OnInit {

  constructor(public lobbyService: LobbyService, private dialog: MatDialog) {
  }

  displayedColumns: string[] = ['name', 'game', 'players/maxPlayers', 'join'];

  lobbies: LobbyDTO[] = []

  ngOnInit(): void {
    this.lobbyService.getLobbies().subscribe({
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
    this.lobbyService.getLobbies().subscribe({
      complete: () => {
        console.log('Completed getting lobbies')
      },
      next: (value) => () => {
        this.lobbies = value
      },
      error: () => {
        console.log('Smth went wrong with getting lobbies')
      }
    })

    if (this.activeGames.has(name)) {
      this.activeGames.delete(name);
    } else {
      this.activeGames.add(name);
    }
  }

  debug(...args: (string | number)[]) {
    console.log(...args);
  }

  sendMessage() {
    this.lobbyService.sendMessage();
  }


  announceSortChange($event: any) {

  }

  joinLobby(id: string) {
    console.log('IM JOINING THIS EPIC AMAZING LOBBY :', id);
  }

  viewModal(id: string) {
    console.log('showing modal: ', id)
    const dialogRef = this.dialog.open(JoinLobbyModalComponent, {
      id: id
    })
  }

}
