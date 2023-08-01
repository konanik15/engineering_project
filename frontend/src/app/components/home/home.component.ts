import { Component } from '@angular/core';
import { HomeService } from './home-service';

type Game = {
  name: string;
  description: string;
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(public homeService: HomeService) {}

  games: Readonly<Game[]> = [
    { name: 'Poker', description: 'Loose all your money' },
    { name: 'Durak', description: 'How do you even play this sh*t' },
    { name: 'Factorio', description: 'Launch the rocket get bitches' },
    { name: 'Dark Souls', description: 'DEX >>> SEX' },
    { name: 'Chess', description: 'Szacher matter' },
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

  debug(...args: (string | number)[]) {
    console.log(...args);
  }

  sendMessage() {
    this.homeService.sendMessage();
  }
}
