import {Component, Input} from '@angular/core';
import {HandDTO} from "../../../utils/dto";

@Component({
    selector: 'app-durak-other-player-horizontal-hand',
    templateUrl: './durak-other-player-horizontal-hand.component.html',
    styleUrls: ['./durak-other-player-horizontal-hand.component.css']
})
export class DurakOtherPlayerHorizontalHandComponent {
    @Input() hand?: HandDTO;
}
