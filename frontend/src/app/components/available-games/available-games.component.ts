import {Component, OnInit} from '@angular/core';
import {GamesService} from "../utils/games-service";
import {GameLiteDTO} from "../utils/dto";

@Component({
  selector: 'app-available-games',
  templateUrl: './available-games.component.html',
  styleUrls: ['./available-games.component.css']
})
export class AvailableGamesComponent implements OnInit {

  games: GameLiteDTO[] = [];

  activeGames: Set<string> = new Set();

  name: string = "";

  constructor(
    private gamesService: GamesService) {
  }

  ngOnInit(): void {
    this.gamesService.getGames().subscribe({
      next: (value) => {
        this.games = value
      },
      error: () => {
        console.log('Smth went wrong with getting available games')
      }
    });
  }

  toggleSelect(name: string) {
    if (this.activeGames.has(name)) {
      this.activeGames.delete(name);
    } else {
      this.activeGames.add(name);
    }
  }
}
