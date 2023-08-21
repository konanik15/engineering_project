import {Component, Input} from '@angular/core';
import {GameDTO} from "../../utils/dto";

@Component({
  selector: 'app-game-table',
  templateUrl: './game-table.component.html',
  styleUrls: ['./game-table.component.css']
})
export class GameTableComponent {

  @Input() game?: GameDTO

}
