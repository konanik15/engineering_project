import {Component, Input} from '@angular/core';
import { PlayerLiteDTO} from "../../../utils/dto";

@Component({
  selector: 'app-player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.css']
})
export class PlayerListComponent {
  @Input() players?: PlayerLiteDTO[];

}
