import {Component, OnInit} from '@angular/core';
import {GamesService} from "../utils/games.service";

type Game = {
  type: string;
  description: string;
};


@Component({
  selector: 'app-available-games',
  templateUrl: './available-games.component.html',
  styleUrls: ['./available-games.component.css']
})
export class AvailableGamesComponent implements OnInit {

  games: Game[] = [];

  name: string = "";

  constructor(
    private gamesService: GamesService) {
  }

  ngOnInit(): void {
    this.gamesService.getGames().subscribe({
      complete: () => {
        console.log('Completed getting games')
      },
      next: (value) => {
        this.games = value
      },
      error: () => {
        console.log('Smth went wrong with getting available games')
      }
    });
  }
}
