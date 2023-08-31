import {Component, Input} from '@angular/core';
import {HandDTO} from "../../../utils/dto";

@Component({
  selector: 'app-uno-other-player-horizontal-hand',
  templateUrl: './uno-other-player-horizontal-hand.component.html',
  styleUrls: ['./uno-other-player-horizontal-hand.component.css']
})
export class UnoOtherPlayerHorizontalHandComponent {
  @Input() hand? : HandDTO;
}
