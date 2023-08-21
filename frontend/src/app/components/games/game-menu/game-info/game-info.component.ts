import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-game-info',
  templateUrl: './game-info.component.html',
  styleUrls: ['./game-info.component.css']
})
export class GameInfoComponent {
  @Input() status?: string;
  @Input() type?: string;


}
