import {Component, Input} from '@angular/core';
import {HandDTO} from "../../../utils/dto";

@Component({
    selector: 'app-durak-other-player-vertical-hand',
    templateUrl: './durak-other-player-vertical-hand.component.html',
    styleUrls: ['./durak-other-player-vertical-hand.component.css']
})
export class DurakOtherPlayerVerticalHandComponent {
    @Input() hand?: HandDTO;
}
